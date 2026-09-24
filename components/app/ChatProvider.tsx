'use client'

import React, {
    createContext,
    useContext,
    useEffect,
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

interface ChatProviderValue {
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

/**
 * Hook used by ChatPage and other components that need
 * access to the connected Stream Chat client.
 */
export const useChatClient = (): ChatProviderValue => {
    return useContext(ChatProviderContext)
}

// ─── Helper: exponential backoff delay ──────────────────────────────────────

function backoffDelay(attempt: number): number {
    // 500ms, 1s, 2s, 4s, 8s
    return Math.min(500 * Math.pow(2, attempt), 8000)
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface ChatProviderProps {
    children: React.ReactNode
}

export default function ChatProvider({ children }: ChatProviderProps) {
    const [client, setClient] = useState<StreamChat | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [unavailable, setUnavailable] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    const disconnectRef = useRef<(() => Promise<void>) | null>(null)
    const mountedRef = useRef(true)

    // Prevent overlapping/consecutive connectUser calls.
    const connectingRef = useRef(false)

    // Write to the global unread context so Sidebar/BottomNav badge updates
    const { setMessageCount } = useUnreadCount()

    const updateUnread = useCallback(
        (count: number) => {
            setUnreadCount(count)
            setMessageCount(count)
        },
        [setMessageCount],
    )

    const connectWithRetry = useCallback(async () => {
        if (!mountedRef.current || connectingRef.current) return

        connectingRef.current = true

        try {
            const supabase = createClient()

            const {
                data: { user: authUser },
            } = await supabase.auth.getUser()

            if (!authUser || !mountedRef.current) return

            // Fetch profile for display name and avatar
            const { data: profile } = await supabase
                .from('users')
                .select('id, display_name, avatar_url')
                .eq('auth_id', authUser.id)
                .single()

            if (!profile || !mountedRef.current) return

            const streamClient = getStreamClient()
            const MAX_ATTEMPTS = 5

            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                if (!mountedRef.current) return

                try {
                    // Do not call connectUser again if this client is already
                    // connected as the same user.
                    if (
                        streamClient.userID &&
                        streamClient.userID === profile.id
                    ) {
                        setClient(streamClient)
                        setIsReady(true)

                        const userObj =
                            streamClient.user as unknown as Record<
                                string,
                                unknown
                            > | null

                        const initialUnread =
                            (userObj?.total_unread_count as number | undefined) ??
                            0

                        updateUnread(initialUnread)
                        return
                    }

                    // If another user is connected, disconnect before
                    // attempting to connect the current user.
                    if (streamClient.userID) {
                        await streamClient.disconnectUser()
                    }

                    // Fetch a fresh token from our server route
                    const res = await fetch('/api/stream-token', {
                        cache: 'no-store',
                    })

                    if (!res.ok) {
                        throw new Error(`Token fetch failed: ${res.status}`)
                    }

                    const { token } = await res.json()

                    if (!mountedRef.current) return

                    // Connect the user to Stream Chat exactly once.
                    await streamClient.connectUser(
                        {
                            id: profile.id,
                            name: profile.display_name,
                            image: profile.avatar_url ?? undefined,
                        },
                        token,
                    )

                    if (!mountedRef.current) {
                        await streamClient.disconnectUser()
                        return
                    }

                    // Seed initial unread count
                    const userObj =
                        streamClient.user as unknown as Record<
                            string,
                            unknown
                        > | null

                    const initialUnread =
                        (userObj?.total_unread_count as number | undefined) ?? 0

                    updateUnread(initialUnread)

                    // Listen for message events to update the global badge
                    const handleNewMessage = (event: Event) => {
                        if (!mountedRef.current) return

                        const total = event.total_unread_count ?? 0
                        updateUnread(total)
                    }

                    streamClient.on(
                        'notification.message_new',
                        handleNewMessage,
                    )

                    streamClient.on(
                        'notification.mark_read',
                        handleNewMessage,
                    )

                    // Store disconnect function for cleanup
                    disconnectRef.current = async () => {
                        streamClient.off(
                            'notification.message_new',
                            handleNewMessage,
                        )

                        streamClient.off(
                            'notification.mark_read',
                            handleNewMessage,
                        )

                        if (streamClient.userID) {
                            await streamClient.disconnectUser()
                        }
                    }

                    setClient(streamClient)
                    setIsReady(true)

                    return
                } catch (err) {
                    console.error(
                        `[ChatProvider] Connection attempt ${attempt + 1} failed:`,
                        err,
                    )

                    if (attempt < MAX_ATTEMPTS - 1) {
                        await new Promise<void>((resolve) =>
                            setTimeout(resolve, backoffDelay(attempt)),
                        )
                    } else {
                        if (mountedRef.current) {
                            setUnavailable(true)
                        }
                    }
                }
            }
        } finally {
            connectingRef.current = false
        }
    }, [updateUnread])

    useEffect(() => {
        mountedRef.current = true

        connectWithRetry()

        return () => {
            mountedRef.current = false

            if (disconnectRef.current) {
                disconnectRef.current()
                disconnectRef.current = null
            }

        }
    }, [connectWithRetry])

    if (unavailable) {
        return (
            <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center space-y-2">
                    <p className="text-muted-foreground font-medium">
                        Chat unavailable
                    </p>

                    <p className="text-sm text-muted-foreground">
                        Could not connect to the messaging service. Please try
                        refreshing the page.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <ChatProviderContext.Provider
            value={{
                client,
                isReady,
                unreadCount,
            }}
        >
            {children}
        </ChatProviderContext.Provider>
    )
}
