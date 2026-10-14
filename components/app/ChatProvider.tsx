'use client'

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from 'react'
import type { StreamChat, Event } from 'stream-chat'
import { getStreamClient } from '@/lib/stream'
import { createClient } from '@/lib/supabase/client'
import { useUnreadCount } from './UnreadCountContext'
import { playReceiveMessageSound } from '@/lib/chat-sound'

// ─── Public context shape ────────────────────────────────────────────────────

interface ChatProviderValue
{
    client: StreamChat | null
    isReady: boolean
    unreadCount: number
}

/**
 * Default context value — safe to read outside a ChatProvider.
 */
const ChatProviderContext = createContext<ChatProviderValue>({
    client: null,
    isReady: false,
    unreadCount: 0,
})

export function useChatClient()
{
    return useContext(ChatProviderContext)
}

// ─── Helper: exponential backoff delay ──────────────────────────────────────

function backoffDelay(attempt: number): number
{
    // 500ms, 1s, 2s, 4s, 8s
    return Math.min(500 * Math.pow(2, attempt), 8000)
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface ChatProviderProps
{
    children: React.ReactNode
}

export default function ChatProvider({ children }: ChatProviderProps)
{
    const [client, setClient] = useState<StreamChat | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [unavailable, setUnavailable] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const cleanupListenersRef = useRef<(() => void) | null>(null)
    const mountedRef = useRef(true)

    // Write to the global unread context so Sidebar/BottomNav badge updates
    const { setMessageCount } = useUnreadCount()

    const updateUnread = useCallback(
        (count: number) =>
        {
            setUnreadCount(count)
            setMessageCount(count)
        },
        [setMessageCount],
    )

    const connectWithRetry = useCallback(async () =>
    {
        const supabase = createClient()
        const {
            data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser || !mountedRef.current) return

        // Fetch profile for display name and avatar (matches by auth_id or id)
        const { data: profile } = await supabase
            .from('users')
            .select('id, display_name, avatar_url')
            .or(`auth_id.eq.${authUser.id},id.eq.${authUser.id}`)
            .maybeSingle()

        if (!mountedRef.current) return

        const activeUserId = profile?.id || authUser.id
        const displayName =
            profile?.display_name ||
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split('@')[0] ||
            'User'
        const avatarUrl =
            profile?.avatar_url ||
            authUser.user_metadata?.avatar_url ||
            undefined

        // getStreamClient() dynamically imports the `stream-chat` SDK the
        // first time it's called — if that chunk fetch fails (offline,
        // ad-blocker, CDN blip), don't let it throw as an unhandled
        // rejection out of this fire-and-forget call; degrade to "badge
        // never populates" rather than anything more visible.
        let streamClient: Awaited<ReturnType<typeof getStreamClient>>
        try
        {
            streamClient = await getStreamClient()
        } catch (err)
        {
            console.error('[ChatProvider] Failed to load chat SDK:', err)
            return
        }

        // Helper to register listeners and update state
        const attachListenersAndFinish = () =>
        {
            const userObj = streamClient.user as unknown as Record<string, unknown> | null
            const initialUnread = (userObj?.total_unread_count as number | undefined) ?? 0
            updateUnread(initialUnread)

            const handleNewMessage = (event: Event) =>
            {
                if (!mountedRef.current) return
                const total = event.total_unread_count ?? 0
                updateUnread(total)
                if (event.user?.id !== streamClient.userID)
                {
                    const channelCid = event.cid
                    const isMuted = channelCid ? Boolean(streamClient._muteStatus(channelCid)?.muted) : false
                    if (!isMuted)
                    {
                        playReceiveMessageSound()
                    }
                }
            }

            streamClient.on('notification.message_new', handleNewMessage)
            streamClient.on('notification.mark_read', handleNewMessage)

            cleanupListenersRef.current = () =>
            {
                streamClient.off('notification.message_new', handleNewMessage)
                streamClient.off('notification.mark_read', handleNewMessage)
            }

            setClient(streamClient)
            setIsReady(true)
        }

        // Helper to check if a JWT token is expired (or expires within 60s)
        const isTokenExpired = (rawToken: string | null | undefined): boolean =>
        {
            if (!rawToken) return true
            try
            {
                const parts = rawToken.split('.')
                if (parts.length < 2) return true
                const base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/')
                const jsonPayload = decodeURIComponent(
                    atob(base64Url)
                        .split('')
                        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join(''),
                )
                const payload = JSON.parse(jsonPayload)
                if (!payload.exp) return false // No expiration set
                return Math.floor(Date.now() / 1000) >= payload.exp - 60
            } catch
            {
                return true
            }
        }

        const currentToken = (streamClient as any)?.tokenManager?.token as string | undefined
        const isStaticToken = (streamClient as any)?.tokenManager?.isStatic?.()
        const tokenIsExpired = isTokenExpired(currentToken)

        // If singleton is connected to a different user, or token is expired/static, disconnect cleanly first
        if (streamClient.userID && (streamClient.userID !== activeUserId || isStaticToken || tokenIsExpired))
        {
            try
            {
                await streamClient.disconnectUser()
            } catch
            {
                // Ignore disconnect errors
            }
        }
        else if (streamClient.userID === activeUserId && streamClient.user && !isStaticToken && !tokenIsExpired)
        {
            // Already connected to active user with an active, non-expired tokenProvider
            attachListenersAndFinish()
            return
        }

        // Token provider: Stream Chat SDK automatically calls this initially AND on any token expiration (code 40)
        const tokenProvider = async (): Promise<string> =>
        {
            const res = await fetch('/api/stream-token')
            if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`)
            const data = await res.json()
            return data.token as string
        }

        const MAX_ATTEMPTS = 5

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++)
        {
            if (!mountedRef.current) return

            try
            {
                // Connect the user using tokenProvider so Stream Chat automatically auto-renews tokens
                await streamClient.connectUser(
                    {
                        id: activeUserId,
                        name: displayName,
                        image: avatarUrl ?? undefined,
                    },
                    tokenProvider,
                )

                if (!mountedRef.current) return

                attachListenersAndFinish()
                return // success — exit retry loop
            } catch (err)
            {
                console.error(`[ChatProvider] Connection attempt ${attempt + 1} failed:`, err)

                if (attempt < MAX_ATTEMPTS - 1)
                {
                    await new Promise<void>((resolve) =>
                        setTimeout(resolve, backoffDelay(attempt)),
                    )
                } else
                {
                    // All retries exhausted
                    if (mountedRef.current)
                    {
                        setUnavailable(true)
                    }
                }
            }
        }
    }, [updateUnread])

    useEffect(() =>
    {
        mountedRef.current = true
        connectWithRetry()

        return () =>
        {
            mountedRef.current = false
            if (cleanupListenersRef.current)
            {
                cleanupListenersRef.current()
                cleanupListenersRef.current = null
            }
        }
    }, [connectWithRetry])

    if (unavailable)
    {
        return (
            <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center space-y-2">
                    <p className="text-muted-foreground font-medium">Chat unavailable</p>
                    <p className="text-sm text-muted-foreground">
                        Could not connect to the messaging service. Please try refreshing the page.
                    </p>
                </div>
            </div>
        )
    }

    const value = useMemo(() => ({ client, isReady, unreadCount }), [client, isReady, unreadCount])

    return (
        <ChatProviderContext.Provider value={value}>
            {children}
        </ChatProviderContext.Provider>
    )
}
