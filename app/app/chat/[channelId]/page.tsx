'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import 'stream-chat-react/dist/css/index.css'
import
    {
        Chat,
        Channel,
        Window,
        MessageList,
        MessageComposerUI,
        Thread,
        useChannelStateContext,
    } from 'stream-chat-react'
import type { Channel as StreamChannel } from 'stream-chat'
import { ArrowLeft, Loader2, MoreVertical } from 'lucide-react'
import { useChatClient } from '@/components/app/ChatProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ─── Custom channel header ───────────────────────────────────────────────────

function CustomChannelHeader()
{
    const router = useRouter()
    const { channel } = useChannelStateContext()

    const rawData = channel.data as Record<string, unknown> | undefined
    const channelName = typeof rawData?.name === 'string' ? rawData.name : undefined
    const channelImage = typeof rawData?.image === 'string' ? rawData.image : undefined

    const members = Object.values(channel.state.members)
    const otherMembers = members.filter((m) => m.user?.id !== channel._client.userID)
    const name =
        channelName ||
        otherMembers.map((m) => m.user?.name ?? m.user?.id ?? '?').join(', ') ||
        'Conversation'

    const initials = name
        .split(' ')
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const onlineCount = members.filter((m) => m.user?.online).length

    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
            <button
                onClick={() => router.push('/app/chat')}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors -ml-1.5 shrink-0"
                aria-label="Back"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            <Avatar className="h-9 w-9 shrink-0 border border-border">
                <AvatarImage src={channelImage} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{name}</p>
                {onlineCount > 0 && (
                    <p className="text-[11px] text-primary leading-tight font-medium">{onlineCount} online</p>
                )}
            </div>

            <button
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Options"
            >
                <MoreVertical className="w-5 h-5" />
            </button>
        </div>
    )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ChannelPage()
{
    const { channelId } = useParams<{ channelId: string }>()
    const { client, isReady } = useChatClient()
    const router = useRouter()
    const { resolvedTheme } = useTheme()
    const [channel, setChannel] = useState<StreamChannel | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() =>
    {
        if (!isReady || !client || !channelId) return
        let cancelled = false

        async function loadChannel()
        {
            try
            {
                setLoading(true)
                setError(null)
                const ch = client!.channel('messaging', channelId as string)
                await ch.watch()
                if (!cancelled) setChannel(ch)
            } catch (err)
            {
                console.error('[ChannelPage] Failed to load channel:', err)
                if (!cancelled) setError('Could not load this conversation.')
            } finally
            {
                if (!cancelled) setLoading(false)
            }
        }

        loadChannel()
        return () => { cancelled = true }
    }, [isReady, client, channelId])

    if (!isReady || loading)
    {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !channel)
    {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 px-6">
                <p className="text-muted-foreground text-center">{error ?? 'Conversation not found.'}</p>
                <button
                    onClick={() => router.push('/app/chat')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Messages
                </button>
            </div>
        )
    }

    const streamTheme = resolvedTheme === 'dark' ? 'str-chat__theme-dark' : 'str-chat__theme-light'

    return (
        <Chat client={client!} theme={streamTheme}>
            <Channel channel={channel}>
                <div
                    className="flex flex-col bg-background"
                    style={{ height: '100dvh' }}
                >
                    <Window>
                        {/* Custom header */}
                        <CustomChannelHeader />

                        {/* Message list fills remaining space */}
                        <div className="flex-1 overflow-y-auto">
                            <MessageList />
                        </div>

                        {/* Composer pinned to bottom */}
                        <div className="bg-card border-t border-border px-3 py-2">
                            <MessageComposerUI />
                        </div>
                    </Window>

                    <Thread />
                </div>
            </Channel>
        </Chat>
    )
}
