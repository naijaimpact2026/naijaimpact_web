'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
            <button
                onClick={() => router.push('/app/chat')}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors -ml-1.5 shrink-0"
                aria-label="Back"
            >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={channelImage} />
                <AvatarFallback className="bg-green-100 text-green-700 font-bold text-xs">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                {onlineCount > 0 && (
                    <p className="text-[11px] text-green-600 leading-tight">{onlineCount} online</p>
                )}
            </div>

            <button
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Options"
            >
                <MoreVertical className="w-5 h-5 text-gray-500" />
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
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        )
    }

    if (error || !channel)
    {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4 px-6">
                <p className="text-gray-500 text-center">{error ?? 'Conversation not found.'}</p>
                <button
                    onClick={() => router.push('/app/chat')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Messages
                </button>
            </div>
        )
    }

    return (
        <Chat client={client!}>
            <Channel channel={channel}>
                <div
                    className="flex flex-col bg-gray-50"
                    style={{ height: '100dvh' }}
                >
                    <Window>
                        {/* Our custom header */}
                        <CustomChannelHeader />

                        {/* Message list fills remaining space */}
                        <div className="flex-1 overflow-y-auto">
                            <MessageList />
                        </div>

                        {/* Composer pinned to bottom */}
                        <div className="bg-white border-t border-gray-100 px-2 py-2">
                            <MessageComposerUI />
                        </div>
                    </Window>

                    <Thread />
                </div>
            </Channel>
        </Chat>
    )
}
