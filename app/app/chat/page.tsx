'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Chat } from 'stream-chat-react'
import type { Channel } from 'stream-chat'
import { MessageCircle, Users, Search, UserPlus, UserCheck, Loader2, Plus, Sparkles, MessagesSquare } from 'lucide-react'
import { useChatClient } from '@/components/app/ChatProvider'
import CreateGroupChatModal from '@/components/app/chat/CreateGroupChatModal'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { followUser, unfollowUser } from '@/lib/actions/profile'
import { startDmChat, fetchFollowingForChat, fetchSuggestedUsers } from '@/lib/actions/chat'
import { toast } from '@/components/toast'
import { SkeletonAvatar, SkeletonLine, WAVE_STEP } from '@/components/app/skeletons/primitives'
import ChatSkeleton from '@/components/app/skeletons/ChatSkeleton'

interface ChatUser { id: string; username: string; display_name: string; avatar_url: string | null }
interface SuggestedUser extends ChatUser { isFollowing: boolean }
type ActiveTab = 'chats' | 'people' | 'suggested'

function getInitials(name: string) { return name.split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2) }
function timeAgo(date: Date | string | undefined): string
{
    if (!date) return ''
    const d = new Date(date), diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return 'now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

// ─── Animated empty state ─────────────────────────────────────────────────────
function ChatEmptyState({ onFindPeople }: { onFindPeople: () => void })
{
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[55vh] px-8 text-center gap-5 bg-card">
            <div className="relative w-24 h-24 mb-2">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30" />
                <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse" />
                <div className="relative z-10 w-full h-full rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <MessagesSquare className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20 border border-card flex items-center justify-center animate-bounce delay-75">
                    <MessageCircle className="w-3.5 h-3.5 text-primary" />
                </span>
                <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-amber-500/20 border border-card animate-bounce delay-150 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                </span>
            </div>
            <div className="space-y-1.5">
                <h3 className="font-black text-lg text-foreground">No conversations yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Follow people and start a chat, or create a group to connect with your community.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
                <button
                    onClick={onFindPeople}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                >
                    <Users className="w-4 h-4" /> Find people
                </button>
                <CreateGroupChatModal
                    trigger={
                        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted text-foreground transition-all">
                            <Users className="w-4 h-4 text-muted-foreground" /> New Group
                        </button>
                    }
                />
            </div>
        </div>
    )
}

// ─── Channel row ─────────────────────────────────────────────────────────────
function ChannelRow({ channel, onClick }: { channel: Channel; onClick: () => void })
{
    const lastMessage = channel.state.messages[channel.state.messages.length - 1]
    const rawData = channel.data as Record<string, unknown> | undefined
    const channelName = typeof rawData?.name === 'string' ? rawData.name : undefined
    const channelImage = typeof rawData?.image === 'string' ? rawData.image : undefined
    const members = Object.values(channel.state.members)
    const otherMembers = members.filter(m => m.user?.id !== channel._client.userID)
    const name = channelName || otherMembers.map(m => m.user?.name ?? '?').join(', ') || 'Unknown'
    const unread = channel.countUnread()
    const isGroup = members.length > 2

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors text-left border-b border-border last:border-0"
        >
            <div className="relative shrink-0">
                <div className={`h-12 w-12 rounded-full overflow-hidden border-2 flex items-center justify-center text-sm font-bold ${unread > 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                    {channelImage
                        ? <img src={channelImage} alt={name} className="w-full h-full object-cover" />
                        : <div className={`w-full h-full flex items-center justify-center text-sm font-bold ${isGroup ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {isGroup ? <Users className="w-4 h-4" /> : getInitials(name)}
                        </div>
                    }
                </div>
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-black text-foreground' : 'font-semibold text-foreground/90'}`}>{name}</p>
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(lastMessage?.created_at)}</span>
                </div>
                <p className={`text-xs mt-0.5 truncate ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {lastMessage?.text || 'No messages yet'}
                </p>
            </div>
        </button>
    )
}

// ─── People row ──────────────────────────────────────────────────────────────
function PeopleRow({ user, onMessage }: { user: ChatUser; onMessage: (u: ChatUser) => Promise<void> })
{
    const [loading, setLoading] = useState(false)
    return (
        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
            <div className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                {user.avatar_url ? <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" /> : getInitials(user.display_name)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{user.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
            <button
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card text-foreground hover:bg-muted hover:border-primary/40 hover:text-primary disabled:opacity-40 transition-colors"
                disabled={loading}
                onClick={async () => { setLoading(true); try { await onMessage(user) } finally { setLoading(false) } }}
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />} Message
            </button>
        </div>
    )
}

// ─── Suggested row ────────────────────────────────────────────────────────────
function SuggestedRow({ user, onFollowToggle, onMessage }: { user: SuggestedUser; onFollowToggle: (u: SuggestedUser, f: boolean) => void; onMessage: (u: ChatUser) => Promise<void> })
{
    const [following, setFollowing] = useState(user.isFollowing)
    const [followPending, setFollowPending] = useState(false)
    const [msgPending, setMsgPending] = useState(false)

    async function handleFollow()
    {
        setFollowPending(true); const was = following; setFollowing(!was)
        try
        {
            const r = was ? await unfollowUser(user.id) : await followUser(user.id)
            if (!r.success) { setFollowing(was); toast.error(r.error) }
            else { onFollowToggle(user, !was); toast.success(was ? `Unfollowed ${user.display_name}` : `Following ${user.display_name}`) }
        } catch { setFollowing(was) } finally { setFollowPending(false) }
    }

    return (
        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
            <div className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                {user.avatar_url ? <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" /> : getInitials(user.display_name)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{user.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 ${
                        following
                            ? 'border border-border bg-card text-foreground hover:bg-muted'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    }`}
                    disabled={followPending}
                    onClick={handleFollow}
                >
                    {followPending ? <Loader2 className="w-3 h-3 animate-spin" /> : following ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {following ? 'Following' : 'Follow'}
                </button>
                {following && (
                    <button
                        className="w-8 h-8 rounded-xl flex items-center justify-center border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                        disabled={msgPending}
                        onClick={async () => { setMsgPending(true); try { await onMessage(user) } finally { setMsgPending(false) } }}
                        aria-label={`Message ${user.display_name}`}
                    >
                        {msgPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                    </button>
                )}
            </div>
        </div>
    )
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number })
{
    return (
        <button
            onClick={onClick}
            className={`relative shrink-0 px-5 py-3 text-sm font-bold transition-colors whitespace-nowrap ${
                active
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
            }`}
        >
            {label}
            {badge != null && badge > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                    {badge}
                </span>
            )}
        </button>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ChatPage()
{
    const { client, isReady } = useChatClient()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<ActiveTab>('chats')
    const [searchQuery, setSearchQuery] = useState('')
    const [channels, setChannels] = useState<Channel[]>([])
    const [channelsLoading, setChannelsLoading] = useState(true)
    const [following, setFollowing] = useState<ChatUser[]>([])
    const [suggested, setSuggested] = useState<SuggestedUser[]>([])
    const [loadingPeople, setLoadingPeople] = useState(false)
    const [startingDm, setStartingDm] = useState<string | null>(null)
    const mountedRef = useRef(true)

    // Query channels directly — no ChannelList component
    useEffect(() =>
    {
        mountedRef.current = true
        if (!isReady || !client) return
        setChannelsLoading(true)
        client.queryChannels(
            { type: 'messaging', members: { $in: [client.userID as string] } },
            { last_message_at: -1 },
            { watch: true, state: true, limit: 50 }
        ).then(chs => { if (mountedRef.current) { setChannels(chs); setChannelsLoading(false) } })
            .catch(() => { if (mountedRef.current) setChannelsLoading(false) })

        // Live update on new messages
        const handleEvent = () =>
        {
            client.queryChannels(
                { type: 'messaging', members: { $in: [client.userID as string] } },
                { last_message_at: -1 },
                { watch: false, state: true, limit: 50 }
            ).then(chs => { if (mountedRef.current) setChannels([...chs]) }).catch(() => { })
        }
        client.on('message.new', handleEvent)
        return () => { mountedRef.current = false; client.off('message.new', handleEvent) }
    }, [isReady, client])

    useEffect(() =>
    {
        if (activeTab !== 'people' && activeTab !== 'suggested') return
        setLoadingPeople(true)
        Promise.all([fetchFollowingForChat(), fetchSuggestedUsers()])
            .then(([f, s]) => { setFollowing(f); setSuggested(s) })
            .catch(() => { })
            .finally(() => setLoadingPeople(false))
    }, [activeTab])

    const handleStartDm = useCallback(async (user: ChatUser) =>
    {
        if (startingDm) return
        setStartingDm(user.id)
        try { const { channelId } = await startDmChat(user.id); router.push(`/app/chat/${channelId}`) }
        catch (err: any) { toast.error(err?.message ?? 'Could not start chat') }
        finally { setStartingDm(null) }
    }, [router, startingDm])

    const handleFollowToggle = useCallback((user: SuggestedUser, nowFollowing: boolean) =>
    {
        setSuggested(prev => prev.map(u => u.id === user.id ? { ...u, isFollowing: nowFollowing } : u))
        if (nowFollowing) setFollowing(prev => prev.find(u => u.id === user.id) ? prev : [user, ...prev])
        else setFollowing(prev => prev.filter(u => u.id !== user.id))
    }, [])

    if (!isReady || !client)
    {
        return <ChatSkeleton />
    }

    const filteredChannels = searchQuery
        ? channels.filter(ch =>
        {
            const rawData = ch.data as Record<string, unknown> | undefined
            const name = typeof rawData?.name === 'string' ? rawData.name : ''
            const otherNames = Object.values(ch.state.members).filter(m => m.user?.id !== ch._client.userID).map(m => m.user?.name ?? '').join(' ')
            return name.toLowerCase().includes(searchQuery.toLowerCase()) || otherNames.toLowerCase().includes(searchQuery.toLowerCase())
        })
        : channels

    const filteredFollowing = following.filter(u => u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    const filteredSuggested = suggested.filter(u => u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <Chat client={client}>
            <div className="flex flex-col bg-background" style={{ height: 'calc(100dvh - 3.5rem)' }}>

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-card sticky top-0 z-10 border-b border-border shadow-sm">
                    <div>
                        <h1 className="text-lg font-black text-foreground">Messages</h1>
                        <p className="text-xs text-muted-foreground font-medium">Chat with your community</p>
                    </div>
                    <CreateGroupChatModal />
                </div>

                {/* ── Search ── */}
                <div className="px-4 py-3 bg-card border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={activeTab === 'chats' ? 'Search conversations…' : 'Search people…'}
                            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex items-center bg-card border-b border-border overflow-x-auto scrollbar-none">
                    <TabBtn label="Chats" active={activeTab === 'chats'} onClick={() => setActiveTab('chats')} badge={channels.reduce((s, ch) => s + ch.countUnread(), 0) || undefined} />
                    <TabBtn label="Following" active={activeTab === 'people'} onClick={() => setActiveTab('people')} badge={following.length || undefined} />
                    <TabBtn label="Suggested" active={activeTab === 'suggested'} onClick={() => setActiveTab('suggested')} />
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto bg-background">
                    {activeTab === 'chats' && (
                        channelsLoading ? (
                            <div className="space-y-0 pt-0">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-card border-b border-border">
                                        <SkeletonAvatar size={48} delay={i * WAVE_STEP} />
                                        <div className="flex-1 space-y-2">
                                            <SkeletonLine width="50%" height={12} delay={i * WAVE_STEP} />
                                            <SkeletonLine width="75%" height={10} delay={i * WAVE_STEP} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredChannels.length === 0 ? (
                            searchQuery
                                ? <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6 bg-card">
                                    <Search className="w-8 h-8 text-muted-foreground/40" />
                                    <p className="font-bold text-foreground">No matching conversations</p>
                                    <p className="text-sm text-muted-foreground">Try a different search term</p>
                                </div>
                                : <ChatEmptyState onFindPeople={() => setActiveTab('people')} />
                        ) : (
                            <div className="bg-card rounded-none divide-y divide-border">
                                {filteredChannels.map(ch => <ChannelRow key={ch.id} channel={ch} onClick={() => router.push(`/app/chat/${ch.id}`)} />)}
                            </div>
                        )
                    )}

                    {activeTab === 'people' && (
                        loadingPeople
                            ? <div className="flex justify-center py-12 bg-card"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            : filteredFollowing.length === 0
                                ? <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center bg-card">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <Users className="w-7 h-7 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">{searchQuery ? 'No results' : 'Not following anyone yet'}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{searchQuery ? 'Try a different search' : 'Discover people in Suggested'}</p>
                                    </div>
                                    {!searchQuery && (
                                        <button
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors"
                                            onClick={() => setActiveTab('suggested')}
                                        >
                                            <Sparkles className="w-4 h-4 text-amber-500" /> Find suggested people
                                        </button>
                                    )}
                                </div>
                                : <div className="bg-card">
                                    <p className="px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 border-b border-border">
                                        People you follow · {filteredFollowing.length}
                                    </p>
                                    <div className="divide-y divide-border">
                                        {filteredFollowing.map(u => <PeopleRow key={u.id} user={u} onMessage={handleStartDm} />)}
                                    </div>
                                </div>
                    )}

                    {activeTab === 'suggested' && (
                        loadingPeople
                            ? <div className="flex justify-center py-12 bg-card"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            : filteredSuggested.length === 0
                                ? <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center bg-card">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <Sparkles className="w-7 h-7 text-amber-500" />
                                    </div>
                                    <p className="font-bold text-foreground">No suggestions right now</p>
                                    <p className="text-sm text-muted-foreground">Check back soon as more people join</p>
                                </div>
                                : <div className="bg-card">
                                    <p className="px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 border-b border-border">
                                        People you may know · {filteredSuggested.length}
                                    </p>
                                    <div className="divide-y divide-border">
                                        {filteredSuggested.map(u => (
                                            <SuggestedRow key={u.id} user={u} onFollowToggle={handleFollowToggle} onMessage={handleStartDm} />
                                        ))}
                                    </div>
                                </div>
                    )}
                </div>

                {/* ── FAB ── */}
                <button
                    onClick={() => setActiveTab('people')}
                    aria-label="New message"
                    className="fixed bottom-20 right-4 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-95 transition-all xl:hidden"
                >
                    <Plus className="w-6 h-6" strokeWidth={2.5} />
                </button>
            </div>
        </Chat>
    )
}
