'use client'

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Chat } from 'stream-chat-react'
import type { Channel } from 'stream-chat'
import { MessageCircle, Users, Search, UserPlus, UserCheck, Loader2, Plus, Sparkles, MessagesSquare, Ban, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useChatClient } from '@/components/app/ChatProvider'
import CreateGroupChatModal from '@/components/app/chat/CreateGroupChatModal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { followUser, unfollowUser } from '@/lib/actions/profile'
import { startDmChat, fetchFollowingForChat, fetchSuggestedUsers, fetchBlockedUsers, unblockUserChat, type BlockedUserItem } from '@/lib/actions/chat'
import { toast } from '@/components/toast'
import { SkeletonAvatar, SkeletonLine, WAVE_STEP } from '@/components/app/skeletons/primitives'
import ChatSkeleton from '@/components/app/skeletons/ChatSkeleton'

interface ChatUser { id: string; username: string; display_name: string; avatar_url: string | null }
interface SuggestedUser extends ChatUser { isFollowing: boolean }
type ActiveTab = 'chats' | 'groups' | 'people' | 'suggested' | 'blocked'

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

function isGroupChannel(channel: Channel): boolean
{
    const id = channel.id ?? ''
    if (id.startsWith('group_')) return true
    if (id.startsWith('dm_')) return false

    const rawData = channel.data as Record<string, unknown> | undefined
    const customData = rawData?.custom as Record<string, unknown> | undefined
    if (Boolean(customData?.isGroup) || Boolean(rawData?.isGroup)) return true

    const members = Object.values(channel.state?.members || {})
    const clientUserId = channel._client?.userID
    const otherMembers = members.filter(m => m.user?.id !== clientUserId)

    return members.length > 2 || otherMembers.length > 1
}

// ─── Animated empty state for direct messages ────────────────────────────────
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
                    Follow people and start a 1-on-1 direct message chat.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
                <button
                    onClick={onFindPeople}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                >
                    <Users className="w-4 h-4" /> Find people
                </button>
            </div>
        </div>
    )
}

// ─── Animated empty state for group chats ────────────────────────────────────
function GroupEmptyState()
{
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[55vh] px-8 text-center gap-5 bg-card">
            <div className="relative w-24 h-24 mb-2">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30" />
                <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse" />
                <div className="relative z-10 w-full h-full rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20 border border-card flex items-center justify-center animate-bounce delay-75">
                    <MessageCircle className="w-3.5 h-3.5 text-primary" />
                </span>
                <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-amber-500/20 border border-card animate-bounce delay-150 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                </span>
            </div>
            <div className="space-y-1.5">
                <h3 className="font-black text-lg text-foreground">No group chats yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Create a group to start discussions with multiple members, collaborate, and share updates.
                </p>
            </div>
            <div className="w-full max-w-xs">
                <CreateGroupChatModal
                    trigger={
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer">
                            <Users className="w-4 h-4" /> Create New Group
                        </button>
                    }
                />
            </div>
        </div>
    )
}

// ─── Channel row ─────────────────────────────────────────────────────────────
function ChannelRow({ channel, onClick, isBlocked }: { channel: Channel; onClick: () => void; isBlocked?: boolean })
{
    const lastMessage = channel.state.messages[channel.state.messages.length - 1]
    const rawData = channel.data as Record<string, unknown> | undefined
    const customData = rawData?.custom as Record<string, unknown> | undefined
    const channelName = typeof rawData?.name === 'string' ? rawData.name : typeof customData?.name === 'string' ? customData.name : undefined
    const channelImage = typeof rawData?.image === 'string' ? rawData.image : typeof customData?.image === 'string' ? customData.image : undefined
    const members = Object.values(channel.state.members)
    const otherMembers = members.filter(m => m.user?.id !== channel._client.userID)
    const otherMember = otherMembers[0]
    const isGroup = isGroupChannel(channel)
    const name = channelName || otherMembers.map(m => m.user?.name ?? '?').join(', ') || (isGroup ? 'Group Chat' : 'Unknown')
    const displayImage = channelImage || (!isGroup ? ((otherMember?.user?.image as string | undefined) || (otherMember?.user as any)?.avatar_url) : undefined)
    const unread = channel.countUnread()

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors text-left border-b border-border last:border-0"
        >
            <div className="relative shrink-0">
                <Avatar className={`h-12 w-12 rounded-full border-2 flex items-center justify-center text-sm font-bold ${unread > 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                    {displayImage && (
                        <AvatarImage src={displayImage} alt={name} className="w-full h-full object-cover" />
                    )}
                    <AvatarFallback className={`w-full h-full flex items-center justify-center text-sm font-bold ${isGroup ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {isGroup ? <Users className="w-4 h-4" /> : getInitials(name)}
                    </AvatarFallback>
                </Avatar>
                {isBlocked && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center ring-2 ring-card text-[9px] shadow-xs">
                        <Ban className="w-2.5 h-2.5" />
                    </span>
                )}
                {unread > 0 && !isBlocked && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`text-sm truncate ${unread > 0 ? 'font-black text-foreground' : 'font-semibold text-foreground/90'}`}>{name}</p>
                        {isBlocked && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                                <Ban className="w-2.5 h-2.5" /> Blocked
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(lastMessage?.created_at)}</span>
                </div>
                <p className={`text-xs mt-0.5 truncate ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {lastMessage?.text || 'No messages yet'}
                </p>
            </div>
        </button>
    )
}

// ─── Blocked row ─────────────────────────────────────────────────────────────
function BlockedRow({
    item,
    onUnblock,
    onOpenChat,
}: {
    item: BlockedUserItem
    onUnblock: (id: string) => Promise<void>
    onOpenChat?: () => void
})
{
    const [unblocking, setUnblocking] = useState(false)
    return (
        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
            <div className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                {item.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.avatar_url} alt={item.display_name} className="w-full h-full object-cover" />
                ) : (
                    getInitials(item.display_name)
                )}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-destructive text-white flex items-center justify-center ring-2 ring-card text-[8px]">
                    <Ban className="w-2.5 h-2.5" />
                </span>
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpenChat}>
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground truncate hover:text-primary transition-colors">{item.display_name}</p>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                        Blocked
                    </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                    @{item.username} {item.blocked_at && `· Blocked ${timeAgo(item.blocked_at)}`}
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {onOpenChat && (
                    <button
                        onClick={onOpenChat}
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors"
                    >
                        View Prior Chat
                    </button>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    disabled={unblocking}
                    onClick={async () => {
                        setUnblocking(true)
                        try {
                            await onUnblock(item.id)
                        } finally {
                            setUnblocking(false)
                        }
                    }}
                    className="rounded-xl text-xs font-semibold h-8 px-3 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                    {unblocking ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1" />}
                    Unblock
                </Button>
            </div>
        </div>
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

// ─── Main page content ────────────────────────────────────────────────────────
function ChatPageContent()
{
    const { client, isReady } = useChatClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const targetUserId = searchParams.get('to') || searchParams.get('user')
    const [openingTargetChat, setOpeningTargetChat] = useState(false)
    const [activeTab, setActiveTab] = useState<ActiveTab>('chats')
    const [searchQuery, setSearchQuery] = useState('')
    const [channels, setChannels] = useState<Channel[]>([])
    const [channelsLoading, setChannelsLoading] = useState(true)
    const [following, setFollowing] = useState<ChatUser[]>([])
    const [suggested, setSuggested] = useState<SuggestedUser[]>([])
    const [loadingPeople, setLoadingPeople] = useState(false)
    const [startingDm, setStartingDm] = useState<string | null>(null)
    const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([])
    const [loadingBlocked, setLoadingBlocked] = useState(false)
    const mountedRef = useRef(true)

    const loadBlockedUsers = useCallback(async () =>
    {
        setLoadingBlocked(true)
        try
        {
            const users = await fetchBlockedUsers()
            setBlockedUsers(users)
        }
        catch (err)
        {
            console.error('Failed to load blocked users:', err)
        }
        finally
        {
            setLoadingBlocked(false)
        }
    }, [])

    useEffect(() =>
    {
        loadBlockedUsers()
    }, [loadBlockedUsers])

    useEffect(() =>
    {
        if (activeTab === 'blocked')
        {
            loadBlockedUsers()
        }
    }, [activeTab, loadBlockedUsers])

    const handleUnblockUser = useCallback(async (targetUserId: string) =>
    {
        try
        {
            await unblockUserChat(targetUserId)
            toast.success('User unblocked')
            setBlockedUsers(prev => prev.filter(u => u.id !== targetUserId))
        }
        catch (err: any)
        {
            toast.error(err?.message || 'Failed to unblock user')
        }
    }, [])

    const blockedSet = useMemo(() => new Set(blockedUsers.map(u => u.id)), [blockedUsers])

    const isChannelBlocked = useCallback((ch: Channel) =>
    {
        const clientUserId = ch._client?.userID
        const otherMember = Object.values(ch.state?.members || {}).find(m => m.user?.id !== clientUserId)
        if (!otherMember?.user?.id) return false
        return blockedSet.has(otherMember.user.id)
    }, [blockedSet])

    // Automatically open DM with target user when redirected from artisan/seller profile
    useEffect(() =>
    {
        if (!isReady || !client || !targetUserId) return
        if (targetUserId === client.userID) return

        let cancelled = false
        async function connectWithTarget()
        {
            setOpeningTargetChat(true)
            try
            {
                const { channelId } = await startDmChat(targetUserId!)
                if (!cancelled)
                {
                    router.replace(`/app/chat/${channelId}`)
                }
            }
            catch (err: any)
            {
                if (!cancelled)
                {
                    console.error('Failed to open chat with user:', err)
                    toast.error(err?.message || 'Could not start chat with artisan')
                    setOpeningTargetChat(false)
                }
            }
        }
        connectWithTarget()
        return () => { cancelled = true }
    }, [isReady, client, targetUserId, router])

    // Query channels directly — no ChannelList component
    useEffect(() =>
    {
        mountedRef.current = true
        if (!isReady || !client) return
        setChannelsLoading(true)

        let watchedChannels: Awaited<ReturnType<typeof client.queryChannels>> = []

        client.queryChannels(
            { type: 'messaging', members: { $in: [client.userID as string] } },
            { last_message_at: -1 },
            { watch: true, state: true, limit: 50 }
        ).then(chs =>
        {
            watchedChannels = chs
            if (mountedRef.current) { setChannels(chs); setChannelsLoading(false) }
        })
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
        return () =>
        {
            mountedRef.current = false
            client.off('message.new', handleEvent)
            watchedChannels.forEach(ch => ch.stopWatching().catch(() => {}))
        }
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

    // Ensure recent chats are explicitly ordered by latest message activity
    const normalChannels = useMemo(() =>
    {
        return channels
            .filter(ch => !isGroupChannel(ch))
            .sort((a, b) =>
            {
                const aTime = a.state.last_message_at ? new Date(a.state.last_message_at).getTime() : 0
                const bTime = b.state.last_message_at ? new Date(b.state.last_message_at).getTime() : 0
                return bTime - aTime
            })
    }, [channels])

    const groupChannels = useMemo(() =>
    {
        return channels
            .filter(ch => isGroupChannel(ch))
            .sort((a, b) =>
            {
                const aTime = a.state.last_message_at ? new Date(a.state.last_message_at).getTime() : 0
                const bTime = b.state.last_message_at ? new Date(b.state.last_message_at).getTime() : 0
                return bTime - aTime
            })
    }, [channels])

    const filterChannelList = useCallback((list: Channel[]) =>
    {
        if (!searchQuery) return list
        const q = searchQuery.toLowerCase().trim()
        return list.filter(ch =>
        {
            const rawData = ch.data as Record<string, unknown> | undefined
            const customData = rawData?.custom as Record<string, unknown> | undefined
            const name = typeof rawData?.name === 'string' ? rawData.name : typeof customData?.name === 'string' ? customData.name : ''
            const otherNames = Object.values(ch.state?.members || {}).filter(m => m.user?.id !== ch._client?.userID).map(m => m.user?.name ?? '').join(' ')
            return name.toLowerCase().includes(q) || otherNames.toLowerCase().includes(q)
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

    const filteredSuggested = useMemo(() =>
    {
        if (!searchQuery) return suggested
        const q = searchQuery.toLowerCase().trim()
        return suggested.filter(u => u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
    }, [suggested, searchQuery])

    const filteredBlocked = useMemo(() =>
    {
        if (!searchQuery) return blockedUsers
        const q = searchQuery.toLowerCase().trim()
        return blockedUsers.filter(u => u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
    }, [blockedUsers, searchQuery])

    if (!isReady || !client)
    {
        return <ChatSkeleton />
    }

    return (
        <Chat client={client}>
            <div className="flex flex-col bg-background h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4rem)]">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-card sticky top-0 z-10 border-b border-border shadow-sm">
                    <div>
                        <h1 className="text-lg font-black text-foreground">Chat</h1>
                        <p className="text-xs text-muted-foreground font-medium">Chat with your community</p>
                    </div>
                    <CreateGroupChatModal />
                </div>

                {/* Connecting banner when arriving from artisan / seller CTA */}
                {openingTargetChat && (
                    <div className="flex items-center justify-center gap-2 bg-primary/10 border-b border-primary/20 py-2.5 px-4 text-xs font-bold text-primary animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Opening chat with artisan…
                    </div>
                )}

                {/* ── Search ── */}
                <div className="px-4 py-3 bg-card border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={
                                activeTab === 'chats'
                                    ? 'Search direct messages…'
                                    : activeTab === 'groups'
                                        ? 'Search groups…'
                                        : activeTab === 'blocked'
                                            ? 'Search blocked accounts…'
                                            : 'Search people…'
                            }
                            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex items-center bg-card border-b border-border overflow-x-auto scrollbar-none">
                    <TabBtn
                        label="Chats"
                        active={activeTab === 'chats'}
                        onClick={() => setActiveTab('chats')}
                        badge={normalChannels.reduce((s, ch) => s + ch.countUnread(), 0) || undefined}
                    />
                    <TabBtn
                        label="Following"
                        active={activeTab === 'people'}
                        onClick={() => setActiveTab('people')}
                        badge={following.length || undefined}
                    />
                    <TabBtn
                        label="Suggested"
                        active={activeTab === 'suggested'}
                        onClick={() => setActiveTab('suggested')}
                    />
                    <TabBtn
                        label="Groups"
                        active={activeTab === 'groups'}
                        onClick={() => setActiveTab('groups')}
                        badge={groupChannels.reduce((s, ch) => s + ch.countUnread(), 0) || undefined}
                    />
                    <TabBtn
                        label="Blocked"
                        active={activeTab === 'blocked'}
                        onClick={() => setActiveTab('blocked')}
                        badge={blockedUsers.length || undefined}
                    />
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto bg-background">
                    {/* Normal Direct Messages (Recent Chats) */}
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
                        ) : filteredNormalChannels.length === 0 ? (
                            searchQuery
                                ? <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6 bg-card">
                                    <Search className="w-8 h-8 text-muted-foreground/40" />
                                    <p className="font-bold text-foreground">No matching direct messages</p>
                                    <p className="text-sm text-muted-foreground">Try a different search term</p>
                                </div>
                                : <ChatEmptyState onFindPeople={() => setActiveTab('people')} />
                        ) : (
                            <div className="bg-card rounded-none divide-y divide-border">
                                {filteredNormalChannels.map(ch => (
                                    <ChannelRow
                                        key={ch.id}
                                        channel={ch}
                                        isBlocked={isChannelBlocked(ch)}
                                        onClick={() => router.push(`/app/chat/${ch.id}`)}
                                    />
                                ))}
                            </div>
                        )
                    )}

                    {/* Group Chats */}
                    {activeTab === 'groups' && (
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
                        ) : filteredGroupChannels.length === 0 ? (
                            searchQuery
                                ? <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6 bg-card">
                                    <Search className="w-8 h-8 text-muted-foreground/40" />
                                    <p className="font-bold text-foreground">No matching groups</p>
                                    <p className="text-sm text-muted-foreground">Try a different search term</p>
                                </div>
                                : <GroupEmptyState />
                        ) : (
                            <div className="bg-card rounded-none divide-y divide-border">
                                {filteredGroupChannels.map(ch => <ChannelRow key={ch.id} channel={ch} onClick={() => router.push(`/app/chat/${ch.id}`)} />)}
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

                    {/* Blocked Accounts Tab */}
                    {activeTab === 'blocked' && (
                        loadingBlocked ? (
                            <div className="flex justify-center py-12 bg-card">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : filteredBlocked.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center bg-card">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <ShieldCheck className="w-7 h-7 text-primary" />
                                </div>
                                <p className="font-bold text-foreground">
                                    {searchQuery ? 'No matching blocked users' : 'No blocked users'}
                                </p>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    {searchQuery ? 'Try a different search term' : 'Anyone you block will appear here. Their prior message history is preserved.'}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-card">
                                <p className="px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 border-b border-border">
                                    Blocked accounts · {filteredBlocked.length}
                                </p>
                                <div className="divide-y divide-border">
                                    {filteredBlocked.map(u => {
                                        const existingChannel = channels.find(ch => {
                                            if (isGroupChannel(ch)) return false
                                            const members = Object.values(ch.state?.members || {})
                                            return members.some(m => m.user?.id === u.id)
                                        })
                                        return (
                                            <BlockedRow
                                                key={u.id}
                                                item={u}
                                                onUnblock={handleUnblockUser}
                                                onOpenChat={existingChannel ? () => router.push(`/app/chat/${existingChannel.id}`) : undefined}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        )
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

export default function ChatPage()
{
    return (
        <Suspense fallback={<ChatSkeleton />}>
            <ChatPageContent />
        </Suspense>
    )
}
