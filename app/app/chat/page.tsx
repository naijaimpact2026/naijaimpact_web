'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Chat,
    Channel as ChannelComponent,
    Window,
    ChannelHeader,
    MessageList,
    MessageComposer,
    Thread,
} from 'stream-chat-react'
import type { Channel } from 'stream-chat'
import {
    MessageCircle,
    Users,
    Search,
    UserPlus,
    Loader2,
    Plus,
    Sparkles,
    MessagesSquare,
    SlidersHorizontal,
    Circle,
    UserRoundPlus,
    Lightbulb,
} from 'lucide-react'
import { useChatClient } from '@/components/app/ChatProvider'
import CreateGroupChatModal from '@/components/app/chat/CreateGroupChatModal'
import {
    startDmChat,
    fetchFollowingForChat,
} from '@/lib/actions/chat'
import { toast } from 'sonner'

interface ChatUser {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}


type ActiveTab = 'all' | 'following' | 'groups' | 'requests'

function getInitials(name: string) {
    return name.split(' ').map((p) => p[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function timeAgo(date: Date | string | undefined): string {
    if (!date) return ''
    const d = new Date(date)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return 'now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

function Avatar({ user, size = 'md' }: { user: ChatUser; size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'h-9 w-9 text-[10px]',
        md: 'h-11 w-11 text-xs',
        lg: 'h-12 w-12 text-sm',
    }

    return (
        <div className={`${sizes[size]} shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-100 flex items-center justify-center font-bold text-slate-600`}>
            {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name} className="h-full w-full object-cover" />
            ) : (
                getInitials(user.display_name)
            )}
        </div>
    )
}

function ChatEmptyState({ onFindPeople }: { onFindPeople: () => void }) {
    const highlights = [
        {
            icon: MessageCircle,
            title: 'Chat one-on-one',
            text: 'Build meaningful connections',
            iconClass: 'bg-blue-50 text-blue-600',
        },
        {
            icon: Users,
            title: 'Create groups',
            text: 'Collaborate with communities',
            iconClass: 'bg-emerald-50 text-emerald-600',
        },
        {
            icon: Lightbulb,
            title: 'Share ideas',
            text: 'Turn conversations into opportunities',
            iconClass: 'bg-amber-50 text-amber-500',
        },
        {
            icon: MessageCircle,
            title: 'Stay connected',
            text: 'Grow together',
            iconClass: 'bg-rose-50 text-rose-500',
        },
    ]

    return (
        <div className="flex h-full min-h-[520px] flex-col items-center justify-center px-8 text-center">
            <div className="relative mb-7 h-28 w-28">
                <div className="absolute inset-0 rounded-full bg-emerald-500/10" />
                <div className="absolute inset-3 rounded-full border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50" />
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-slate-100 bg-white shadow-sm">
                        <MessagesSquare className="h-8 w-8 text-emerald-600" strokeWidth={1.7} />
                    </div>
                </div>
                <span className="absolute -right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-emerald-100 shadow-sm">
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                </span>
                <span className="absolute -bottom-1 left-0 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-amber-100 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight text-slate-900">Start a conversation</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                Connect with people, join groups, and be part of a growing community of innovators, creators, and changemakers.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={onFindPeople}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    style={{ background: 'linear-gradient(135deg,#1a6a3d,#0f4d2d)' }}
                >
                    <Users className="h-4 w-4" />
                    Find people
                </button>
                <div className="[&>button]:!flex [&>button]:!h-[46px] [&>button]:!items-center [&>button]:!justify-center [&>button]:!gap-2 [&>button]:!rounded-xl [&>button]:!border [&>button]:!border-slate-300 [&>button]:!bg-white [&>button]:!px-6 [&>button]:!text-sm [&>button]:!font-bold [&>button]:!text-slate-700 [&>button]:hover:!bg-slate-50">
                    <CreateGroupChatModal />
                </div>
            </div>

            <div className="mt-14 grid w-full max-w-xl grid-cols-2 gap-6 border-t border-slate-100 pt-8 sm:grid-cols-4">
                {highlights.map((item) => {
                    const Icon = item.icon
                    return (
                        <div key={item.title} className="text-center">
                            <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full ${item.iconClass}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <p className="text-xs font-bold text-slate-800">{item.title}</p>
                            <p className="mt-1 text-[11px] leading-4 text-slate-400">{item.text}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function ChannelRow({ channel, onClick }: { channel: Channel; onClick: () => void }) {
    const lastMessage = channel.state.messages[channel.state.messages.length - 1]
    const rawData = channel.data as Record<string, unknown> | undefined
    const customData = rawData?.custom as Record<string, unknown> | undefined
    const channelName = typeof rawData?.name === 'string' ? rawData.name : typeof customData?.name === 'string' ? customData.name : undefined
    const channelImage = typeof rawData?.image === 'string' ? rawData.image : typeof customData?.image === 'string' ? customData.image : undefined
    const members = Object.values(channel.state.members)
    const otherMembers = members.filter((m) => m.user?.id !== channel._client.userID)
    const name = channelName || otherMembers.map((m) => m.user?.name ?? '?').join(', ') || 'Unknown'
    const unread = channel.countUnread()

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50"
        >
            <div className="relative shrink-0">
                <div className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border bg-slate-100 text-xs font-bold ${unread > 0 ? 'border-emerald-400' : 'border-slate-100'}`}>
                    {channelImage ? (
                        <img src={channelImage} alt={name} className="h-full w-full object-cover" />
                    ) : (
                        <div className={`flex h-full w-full items-center justify-center ${isGroup ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'}`}>
                            {isGroup ? <Users className="h-4 w-4" /> : getInitials(name)}
                        </div>
                    )}
                </div>
                {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-black text-white">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${unread > 0 ? 'font-black text-slate-900' : 'font-semibold text-slate-800'}`}>{name}</p>
                    <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(lastMessage?.created_at)}</span>
                </div>
                <p className={`mt-1 truncate text-xs ${unread > 0 ? 'font-semibold text-slate-600' : 'text-slate-400'}`}>
                    {lastMessage?.text || 'No messages yet'}
                </p>
            </div>
        </button>
    )
}

function PersonRow({
    user,
    onMessage,
}: {
    user: ChatUser
    onMessage: (u: ChatUser) => Promise<void>
}) {
    const [loading, setLoading] = useState(false)

    return (
        <div className="flex items-center gap-3 px-3 py-3 transition hover:bg-slate-50">
            <div className="relative">
                <Avatar user={user} size="sm" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">{user.display_name}</p>
                <p className="truncate text-[11px] text-slate-400">@{user.username}</p>
            </div>

            <button
                type="button"
                onClick={async () => {
                    setLoading(true)
                    try {
                        await onMessage(user)
                    } finally {
                        setLoading(false)
                    }
                }}
                className="flex h-8 items-center justify-center rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                disabled={loading}
            >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Message'}
            </button>
        </div>
    )
}

function TabBtn({
    label,
    active,
    onClick,
    badge,
}: {
    label: string
    active: boolean
    onClick: () => void
    badge?: number
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative shrink-0 px-4 py-3 text-xs font-bold transition ${active ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-700'}`}
        >
            {label}
            {badge != null && badge > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-black text-white">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
            {active && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-emerald-600" />}
        </button>
    )
}

export default function ChatPage() {
    const { client, isReady } = useChatClient()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<ActiveTab>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [channels, setChannels] = useState<Channel[]>([])
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
    const [channelsLoading, setChannelsLoading] = useState(true)
    const [following, setFollowing] = useState<ChatUser[]>([])
    const [loadingPeople, setLoadingPeople] = useState(false)
    const mountedRef = useRef(true)

    useEffect(() => {
        mountedRef.current = true
        if (!isReady || !client) return

        setChannelsLoading(true)

        client.queryChannels(
            { type: 'messaging', members: { $in: [client.userID as string] } },
            { last_message_at: -1 },
            { watch: true, state: true, limit: 50 },
        ).then((chs) => {
            if (mountedRef.current) {
                setChannels(chs)
                setChannelsLoading(false)
            }
        }).catch(() => {
            if (mountedRef.current) setChannelsLoading(false)
        })

        const handleEvent = () => {
            client.queryChannels(
                { type: 'messaging', members: { $in: [client.userID as string] } },
                { last_message_at: -1 },
                { watch: false, state: true, limit: 50 },
            ).then((chs) => {
                if (mountedRef.current) {
                    setChannels([...chs])

                    if (selectedChannel) {
                        const updated = chs.find((channel) => channel.id === selectedChannel.id)
                        if (updated) setSelectedChannel(updated)
                    }
                }
            }).catch(() => {})
        }

        client.on('message.new', handleEvent)

        return () => {
            mountedRef.current = false
            client.off('message.new', handleEvent)
        }
    }, [isReady, client, selectedChannel])

    useEffect(() => {
        if (activeTab !== 'following') return

        setLoadingPeople(true)

        fetchFollowingForChat()
            .then((f) => setFollowing(f))
            .catch(() => {})
            .finally(() => setLoadingPeople(false))
    }, [activeTab])


    const openChannel = useCallback(async (channel: Channel) => {
        try {
            await channel.watch()
            setSelectedChannel(channel)
        } catch (error) {
            console.error('[ChatPage] Failed to open channel:', error)
            toast.error('Could not open conversation')
        }
    }, [])

    const handleStartDm = useCallback(async (user: ChatUser) => {
        try {
            const { channelId } = await startDmChat(user.id)

            if (client) {
                const channel = client.channel('messaging', channelId)
                await channel.watch()
                setSelectedChannel(channel)

                setChannels((current) => {
                    const exists = current.some((item) => item.id === channel.id)
                    return exists ? current : [channel, ...current]
                })
            } else {
                router.push(`/app/chat/${channelId}`)
            }
        } catch (err: any) {
            toast.error(err?.message ?? 'Could not start chat')
        }
    }, [client, router])



    if (!isReady || !client) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-white">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-500">Connecting to chat…</p>
            </div>
        )
    }

    const filteredChannels = searchQuery
        ? channels.filter((ch) => {
            const rawData = ch.data as Record<string, unknown> | undefined
            const name = typeof rawData?.name === 'string' ? rawData.name : ''
            const otherNames = Object.values(ch.state.members)
                .filter((m) => m.user?.id !== ch._client.userID)
                .map((m) => m.user?.name ?? '')
                .join(' ')

            return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                otherNames.toLowerCase().includes(searchQuery.toLowerCase())
        })
    }, [searchQuery])

    const filteredNormalChannels = useMemo(() => filterChannelList(normalChannels), [filterChannelList, normalChannels])
    const filteredGroupChannels = useMemo(() => filterChannelList(groupChannels), [filterChannelList, groupChannels])

    const filteredFollowing = useMemo(() =>
    {
        if (!searchQuery) return following
        const q = searchQuery.toLowerCase().trim()
        return following.filter(u => u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
    }, [following, searchQuery])

    const filteredFollowing = following.filter(
        (u) =>
            u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const totalUnread = channels.reduce((sum, channel) => sum + channel.countUnread(), 0)

    return (
        <Chat client={client}>
            <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-[#f7f9fc]">
                <div className="border-b border-slate-200 bg-white px-5 py-4 md:px-7">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">Messages</h1>
                            <p className="mt-1 text-sm text-slate-400">
                                Chat with your community, collaborate, and build meaningful connections.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="[&>button]:!flex [&>button]:!h-10 [&>button]:!items-center [&>button]:!gap-2 [&>button]:!rounded-xl [&>button]:!border [&>button]:!border-slate-200 [&>button]:!bg-white [&>button]:!px-4 [&>button]:!text-xs [&>button]:!font-bold [&>button]:!text-slate-700 [&>button]:hover:!bg-slate-50">
                                <CreateGroupChatModal />
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab('following')}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                                <Users className="h-4 w-4" />
                                Find People
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 min-h-0 flex-col gap-4 p-4 md:p-5 xl:grid xl:grid-cols-[350px_minmax(0,1fr)_300px] xl:gap-4">
                    <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:h-[calc(100dvh-10.5rem)]">
                        <div className="border-b border-slate-100 p-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={activeTab === 'all' ? 'Search conversations...' : 'Search people...'}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                />
                                <button
                                    type="button"
                                    aria-label="Conversation filters"
                                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center border-b border-slate-100 px-1">
                            <TabBtn label="All" active={activeTab === 'all'} onClick={() => setActiveTab('all')} badge={totalUnread || undefined} />
                            <TabBtn label="Following" active={activeTab === 'following'} onClick={() => setActiveTab('following')} badge={following.length || undefined} />
                            <TabBtn label="Groups" active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} />
                            <TabBtn label="Requests" active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {activeTab === 'all' && (
                                channelsLoading ? (
                                    <div>
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="flex animate-pulse items-center gap-3 border-b border-slate-100 px-4 py-3.5">
                                                <div className="h-11 w-11 rounded-full bg-slate-100" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                                                    <div className="h-2.5 w-3/4 rounded bg-slate-100" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredChannels.length === 0 ? (
                                    <div className="px-5 py-14 text-center">
                                        <MessageCircle className="mx-auto h-8 w-8 text-slate-200" />
                                        <p className="mt-3 text-sm font-bold text-slate-700">
                                            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-400">
                                            {searchQuery ? 'Try another search term.' : 'Find someone and start your first conversation.'}
                                        </p>
                                    </div>
                                ) : (
                                    filteredChannels.map((channel) => (
                                        <ChannelRow
                                            key={channel.id}
                                            channel={channel}
                                            onClick={() => openChannel(channel)}
                                        />
                                    ))
                                )
                            )}

                            {activeTab === 'following' && (
                                loadingPeople ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                                    </div>
                                ) : filteredFollowing.length === 0 ? (
                                    <div className="px-5 py-14 text-center">
                                        <Users className="mx-auto h-8 w-8 text-slate-200" />
                                        <p className="mt-3 text-sm font-bold text-slate-700">
                                            {searchQuery ? 'No results' : 'Not following anyone yet'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Follow people to start conversations with them.
                                        </p>
                                    </div>
                                ) : (
                                    filteredFollowing.map((user) => (
                                        <PersonRow
                                            key={user.id}
                                            user={user}
                                            onMessage={handleStartDm}
                                        />
                                    ))
                                )
                            )}

                            {activeTab === 'groups' && (
                                (() => {
                                    const groupChannels = filteredChannels.filter(
                                        (channel) => Object.keys(channel.state.members).length > 2
                                    )

                                    return groupChannels.length > 0 ? (
                                        groupChannels.map((channel) => (
                                            <ChannelRow
                                                key={channel.id}
                                                channel={channel}
                                                onClick={() => openChannel(channel)}
                                            />
                                        ))
                                    ) : (
                                        <div className="px-5 py-14 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                                                <Users className="h-6 w-6 text-emerald-600" />
                                            </div>
                                            <p className="mt-4 text-sm font-bold text-slate-800">
                                                No groups yet
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-slate-400">
                                                Create a group and start collaborating with your community.
                                            </p>
                                            <div className="mt-5 [&>button]:!flex [&>button]:!h-10 [&>button]:!items-center [&>button]:!justify-center [&>button]:!gap-2 [&>button]:!rounded-xl [&>button]:!border [&>button]:!border-slate-200 [&>button]:!bg-emerald-600 [&>button]:!px-5 [&>button]:!text-xs [&>button]:!font-bold [&>button]:!text-white [&>button]:hover:!bg-emerald-700">
                                                <CreateGroupChatModal />
                                            </div>
                                        </div>
                                    )
                                })()
                            )}

                            {activeTab === 'requests' && (
                                <div className="px-5 py-14 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                                        <UserPlus className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <p className="mt-4 text-sm font-bold text-slate-800">
                                        No requests
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-400">
                                        Connection and chat requests will appear here.
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setActiveTab('following')}
                            className="hidden border-t border-slate-100 p-3 text-xs font-bold text-emerald-700 transition hover:bg-slate-50 sm:block"
                        >
                            <span className="inline-flex items-center gap-2">
                                <UserRoundPlus className="h-4 w-4" />
                                Find someone to chat with
                            </span>
                        </button>
                    </aside>

                    <main className="min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {selectedChannel ? (
                            <ChannelComponent channel={selectedChannel}>
                                <Window>
                                    <ChannelHeader />
                                    <MessageList />
                                    <MessageComposer />
                                </Window>
                                <Thread />
                            </ChannelComponent>
                        ) : (
                            <ChatEmptyState onFindPeople={() => setActiveTab('following')} />
                        )}
                    </main>

                    <aside className="hidden min-h-0 space-y-4 xl:block xl:h-[calc(100dvh-10.5rem)] xl:overflow-y-auto">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                                    <Users className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900">Find people</h2>
                                    <p className="text-[11px] text-slate-400">Connect with your community.</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveTab('following')}
                                className="mt-4 flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-xs text-slate-400 transition hover:border-emerald-300 hover:bg-white"
                            >
                                <Search className="h-4 w-4" />
                                Search by name or username...
                            </button>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-2 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-black text-slate-900">
                                        Suggested for you
                                    </h2>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        People you may want to connect with.
                                    </p>
                                </div>
                                <Sparkles className="h-4 w-4 text-amber-400" />
                            </div>

                            <div className="mt-4 space-y-1">
                                <div className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                                        <Users className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-800">
                                            Discover new people
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            Find creators and professionals in your community.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('following')}
                                    className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-slate-50 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-50"
                                >
                                    <Search className="h-3.5 w-3.5" />
                                    Discover people
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-2 flex items-center justify-between">
                                <h2 className="text-sm font-black text-slate-900">Online now</h2>
                                <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                            </div>

                            {following.length > 0 ? (
                                following.slice(0, 5).map((user) => (
                                    <PersonRow key={user.id} user={user} onMessage={handleStartDm} />
                                ))
                            ) : (
                                <p className="py-7 text-center text-xs text-slate-400">
                                    Follow people to see your community here.
                                </p>
                            )}
                        </div>
                    </aside>
                </div>

                <button
                    type="button"
                    onClick={() => setActiveTab('following')}
                    aria-label="New message"
                    className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 active:scale-95 xl:hidden"
                >
                    <Plus className="h-6 w-6" strokeWidth={2.5} />
                </button>
            </div>
        </Chat>
    )
}
