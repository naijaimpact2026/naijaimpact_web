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
        MessageComposer,
        Thread,
        useChannelStateContext,
        useMessageContext,
        useChatContext,
        ComponentProvider,
    } from 'stream-chat-react'
import type { Channel as StreamChannel } from 'stream-chat'
import { ArrowLeft, Loader2, MoreVertical, Bell, BellOff, Check, CheckCheck, Clock, User as UserIcon, Users } from 'lucide-react'
import { useChatClient } from '@/components/app/ChatProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import
{
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import GroupInfoModal from '@/components/app/chat/GroupInfoModal'
import { getUserProfileById } from '@/lib/actions/chat'
import { playSendMessageSound, playReceiveMessageSound } from '@/lib/chat-sound'
import { toast } from '@/components/toast'

function formatLastSeen(dateStr?: string | Date): string
{
    if (!dateStr) return 'Offline'
    const date = new Date(dateStr)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Active just now'
    if (diffSec < 3600) return `Active ${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `Active ${Math.floor(diffSec / 3600)}h ago`
    return `Last seen ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

// ─── Custom channel header ───────────────────────────────────────────────────

function CustomChannelHeader()
{
    const router = useRouter()
    const { channel } = useChannelStateContext()
    const [groupInfoOpen, setGroupInfoOpen] = useState(false)
    const [, setPresenceTick] = useState(0)

    // Listen to real-time presence events so online/offline state updates instantly
    useEffect(() =>
    {
        const client = channel._client
        if (!client) return

        const handlePresenceChange = (event: any) =>
        {
            if (event.user?.id && channel.state.members[event.user.id])
            {
                setPresenceTick((t) => t + 1)
            }
        }

        client.on('user.presence.changed', handlePresenceChange)
        client.on('user.updated', handlePresenceChange)

        return () =>
        {
            client.off('user.presence.changed', handlePresenceChange)
            client.off('user.updated', handlePresenceChange)
        }
    }, [channel])

    const rawData = channel.data as Record<string, unknown> | undefined
    const customData = rawData?.custom as Record<string, unknown> | undefined
    const channelName = typeof rawData?.name === 'string' ? rawData.name : typeof customData?.name === 'string' ? customData.name : undefined
    const channelImage = typeof rawData?.image === 'string' ? rawData.image : typeof customData?.image === 'string' ? customData.image : undefined

    const members = Object.values(channel.state.members)
    const currentUserId = channel._client.userID
    const otherMembers = members.filter((m) => m.user?.id !== currentUserId)
    const isGroup = (channel.id ?? '').startsWith('group_') || Boolean((customData as any)?.isGroup) || otherMembers.length > 1
    const otherMember = otherMembers[0]

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

    // Online status computation
    const onlineCount = members.filter((m) => m.user?.online).length
    const isOtherOnline = !isGroup && Boolean(otherMember?.user?.online)
    const otherLastActive = otherMember?.user?.last_active

    const [isMuted, setIsMuted] = useState(() => Boolean(channel.muteStatus()?.muted))

    useEffect(() =>
    {
        const updateMute = () =>
        {
            setIsMuted(Boolean(channel.muteStatus()?.muted))
        }

        updateMute()
        channel.on('channel.updated', updateMute)
        channel.on('channel.muted', updateMute)
        channel.on('channel.unmuted', updateMute)

        return () =>
        {
            channel.off('channel.updated', updateMute)
            channel.off('channel.muted', updateMute)
            channel.off('channel.unmuted', updateMute)
        }
    }, [channel])

    const handleToggleMute = async () =>
    {
        try
        {
            if (isMuted)
            {
                await channel.unmute()
                setIsMuted(false)
                toast.success('Notifications unmuted')
            } else
            {
                await channel.mute()
                setIsMuted(true)
                toast.success('Notifications muted for this conversation')
            }
        } catch (err)
        {
            console.error('Failed to toggle mute:', err)
            toast.error('Failed to update notifications')
        }
    }

    // Action: navigate to user's profile
    const handleViewProfile = async () =>
    {
        if (isGroup)
        {
            setGroupInfoOpen(true)
            return
        }

        if (!otherMember?.user?.id) return

        const directUsername = (otherMember.user as any)?.username
        if (directUsername)
        {
            router.push(`/app/profile/${directUsername}`)
            return
        }

        try
        {
            const profile = await getUserProfileById(otherMember.user.id)
            if (profile?.username)
            {
                router.push(`/app/profile/${profile.username}`)
            }
        } catch (err)
        {
            console.error('Failed to get profile for navigation:', err)
        }
    }

    return (
        <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10 w-full shrink-0">
                <button
                    onClick={() => router.push('/app/chat')}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors -ml-1.5 shrink-0"
                    aria-label="Back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar with click to view profile/group info & online status indicator */}
                <div
                    onClick={handleViewProfile}
                    className="relative cursor-pointer shrink-0 group"
                    title={isGroup ? 'View Group Info' : 'View Profile'}
                >
                    <Avatar className="h-9 w-9 border border-border group-hover:border-primary/50 transition-colors">
                        <AvatarImage src={channelImage || otherMember?.user?.image} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {!isGroup && (
                        <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-card ${
                                isOtherOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'
                            }`}
                        />
                    )}
                </div>

                {/* Title & dynamic online presence */}
                <div
                    onClick={handleViewProfile}
                    className="flex-1 min-w-0 cursor-pointer group"
                    title={isGroup ? 'View Group Info' : 'View Profile'}
                >
                    <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {name}
                        </p>
                        {isMuted && (
                            <span title="Notifications muted">
                                <BellOff className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            </span>
                        )}
                    </div>
                    {isGroup ? (
                        <p className="text-[11px] text-muted-foreground leading-tight font-medium">
                            {members.length} members
                            {onlineCount > 0 && (
                                <span className="text-emerald-500 font-semibold"> · {onlineCount} online</span>
                            )}
                        </p>
                    ) : (
                        <p className="text-[11px] leading-tight font-medium flex items-center">
                            {isOtherOnline ? (
                                <span className="text-emerald-500 flex items-center font-semibold">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                                    Online
                                </span>
                            ) : (
                                <span className="text-muted-foreground">
                                    {formatLastSeen(otherLastActive)}
                                </span>
                            )}
                        </p>
                    )}
                </div>

                {/* 3-Dots Dropdown Options Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 outline-hidden"
                            aria-label="Conversation options"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg p-1.5">
                        {isGroup ? (
                            <DropdownMenuItem
                                onClick={() => setGroupInfoOpen(true)}
                                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-sm font-medium"
                            >
                                <Users className="w-4 h-4 text-primary" />
                                Group Info & Members
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={handleViewProfile}
                                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-sm font-medium"
                            >
                                <UserIcon className="w-4 h-4 text-primary" />
                                View Profile
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                            onClick={handleToggleMute}
                            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-sm font-medium"
                        >
                            {isMuted ? (
                                <>
                                    <Bell className="w-4 h-4 text-primary" />
                                    Unmute notifications
                                </>
                            ) : (
                                <>
                                    <BellOff className="w-4 h-4 text-muted-foreground" />
                                    Mute notifications
                                </>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Group info modal */}
            {isGroup && (
                <GroupInfoModal
                    isOpen={groupInfoOpen}
                    onClose={() => setGroupInfoOpen(false)}
                    channel={channel}
                    currentUserId={currentUserId}
                />
            )}
        </>
    )
}

// ─── Custom Message Status (Seen with Sky-Blue Double Tick) ───────────────────

function CustomMessageStatus()
{
    const { isMyMessage, message, readBy, deliveredTo, threadList } = useMessageContext()
    const { client } = useChatContext()

    if (!isMyMessage() || message.type === 'error') return null

    const justReadByMe = readBy?.length === 1 && readBy[0].id === client.user?.id
    const deliveredOnlyToMe = deliveredTo?.length === 1 && deliveredTo[0].id === client.user?.id
    const isSending = message.status === 'sending'
    const isRead = Boolean(readBy?.length && !justReadByMe && !threadList)
    const isDelivered = Boolean(deliveredTo?.length && !deliveredOnlyToMe && !isRead && !threadList)

    if (isSending)
    {
        return (
            <span className="inline-flex items-center text-muted-foreground/60 mr-1" title="Sending...">
                <Clock className="w-3 h-3 animate-spin" />
            </span>
        )
    }

    if (isRead)
    {
        return (
            <span
                className="inline-flex items-center gap-0.5 text-sky-400 dark:text-sky-400 font-semibold text-[11px] mr-1 select-none"
                title="Seen"
            >
                <span>Seen</span>
                <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
        )
    }

    if (isDelivered)
    {
        return (
            <span
                className="inline-flex items-center text-muted-foreground/70 dark:text-white/60 mr-1 select-none"
                title="Delivered"
            >
                <CheckCheck className="w-3.5 h-3.5 stroke-[2]" />
            </span>
        )
    }

    return (
        <span
            className="inline-flex items-center text-muted-foreground/70 dark:text-white/60 mr-1 select-none"
            title="Sent"
        >
            <Check className="w-3.5 h-3.5 stroke-[2]" />
        </span>
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
                await ch.markRead().catch(() => {})
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

    // Mark channel read when window gains focus
    useEffect(() =>
    {
        if (!channel) return
        const onFocus = () =>
        {
            channel.markRead().catch(() => {})
        }
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [channel])

    const handleSendMessage = (ch: StreamChannel, message: any, options?: any) =>
    {
        playSendMessageSound()
        return ch.sendMessage(message, options)
    }

    // Play sounds on receiving messages from other users (if not muted)
    useEffect(() =>
    {
        if (!channel || !client) return

        const handleNewMessage = (event: any) =>
        {
            const senderId = event.message?.user?.id || event.user?.id
            if (!senderId) return

            if (senderId !== client.userID)
            {
                const isMuted = Boolean(channel.muteStatus()?.muted)
                if (!isMuted)
                {
                    playReceiveMessageSound()
                }
                channel.markRead().catch(() => {})
            }
        }

        channel.on('message.new', handleNewMessage)
        return () =>
        {
            try
            {
                channel.off('message.new', handleNewMessage)
            } catch {
                // Ignore if channel was closed
            }
        }
    }, [channel, client])

    if (!isReady || loading)
    {
        return (
            <div className="flex items-center justify-center min-h-[calc(100dvh-4rem)] bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !channel)
    {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-4rem)] bg-background gap-4 px-6">
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
        <div className="flex flex-col h-[calc(100dvh-4rem)] w-full overflow-hidden bg-background">
            <Chat client={client!} theme={streamTheme}>
                <Channel channel={channel} doSendMessageRequest={handleSendMessage}>
                    <ComponentProvider value={{ MessageStatus: CustomMessageStatus }}>
                        <Window>
                            <CustomChannelHeader />
                            <MessageList returnAllReadData />
                            <MessageComposer />
                        </Window>
                        <Thread />
                    </ComponentProvider>
                </Channel>
            </Chat>
        </div>
    )
}
