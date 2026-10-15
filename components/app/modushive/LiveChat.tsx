'use client'

import { useEffect, useRef, useState } from 'react'
import type { Channel, LocalMessage } from 'stream-chat'
import {
    ChevronDown,
    Crown,
    Loader2,
    MessageCircle,
    PanelRightClose,
    Send,
    Sparkles,
    Users,
} from 'lucide-react'
import { useChatClient } from '@/components/app/ChatProvider'

interface LiveChatProps {
    channelId: string
    hostId?: string
    onCollapse?: () => void
    onWatcherCountChange?: (count: number) => void
}

const QUICK_REACTIONS = ['👋', '🔥', '❤️', '👏', '🎉', '🚀', '💯']

function getAvatarGradient(id?: string) {
    const gradients = [
        'from-blue-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-purple-500 to-pink-600',
        'from-cyan-500 to-blue-600',
        'from-rose-500 to-red-600',
    ]
    if (!id) return gradients[0]
    let hash = 0
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i)
        hash |= 0
    }
    return gradients[Math.abs(hash) % gradients.length]
}

function getInitials(name?: string) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
}

function formatMessageTime(createdAt?: string | Date) {
    if (!createdAt) return ''
    try {
        const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } catch {
        return ''
    }
}

/**
 * Modern, sleek live stream chat with real-time viewer tracking,
 * host distinction, user avatars, timestamps, quick reactions,
 * and responsive layout.
 */
export default function LiveChat({
    channelId,
    hostId,
    onCollapse,
    onWatcherCountChange,
}: LiveChatProps) {
    const { client, isReady } = useChatClient()
    const [channel, setChannel] = useState<Channel | null>(null)
    const [messages, setMessages] = useState<LocalMessage[]>([])
    const [watcherCount, setWatcherCount] = useState(0)
    const [text, setText] = useState('')
    const [failed, setFailed] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [hasUnreadBelow, setHasUnreadBelow] = useState(false)

    const listRef = useRef<HTMLDivElement>(null)
    const isAtBottomRef = useRef(true)

    const currentUserId = client?.userID
    const isCurrentUserHost = Boolean(hostId && currentUserId === hostId)

    useEffect(() => {
        if (!client || !isReady) return
        let cancelled = false
        const ch = client.channel('livestream', channelId)

        ch.watch({ messages: { limit: 50 } })
            .then(() => {
                if (cancelled) return
                setChannel(ch)
                setMessages([...ch.state.messages])
                const count = ch.state.watcher_count ?? 0
                setWatcherCount(count)
                onWatcherCountChange?.(count)
            })
            .catch(() => {
                if (!cancelled) setFailed(true)
            })

        const handleNewMessage = () => {
            setMessages([...ch.state.messages])
            if (!isAtBottomRef.current) {
                setHasUnreadBelow(true)
            }
        }

        const handleWatchers = () => {
            const count = ch.state.watcher_count ?? 0
            setWatcherCount(count)
            onWatcherCountChange?.(count)
        }

        const subMsg = ch.on('message.new', handleNewMessage)
        const subStart = ch.on('user.watching.start', handleWatchers)
        const subStop = ch.on('user.watching.stop', handleWatchers)

        return () => {
            cancelled = true
            subMsg.unsubscribe()
            subStart.unsubscribe()
            subStop.unsubscribe()
            ch.stopWatching().catch(() => {})
        }
    }, [client, isReady, channelId, onWatcherCountChange])

    // Scroll to bottom when new messages arrive if user is already near bottom
    useEffect(() => {
        if (isAtBottomRef.current && listRef.current) {
            listRef.current.scrollTo({
                top: listRef.current.scrollHeight,
                behavior: 'smooth',
            })
            setHasUnreadBelow(false)
        }
    }, [messages])

    function handleScroll() {
        if (!listRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = listRef.current
        const atBottom = scrollHeight - scrollTop - clientHeight < 40
        isAtBottomRef.current = atBottom
        if (atBottom) {
            setHasUnreadBelow(false)
        }
    }

    function scrollToBottom() {
        if (!listRef.current) return
        listRef.current.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: 'smooth',
        })
        isAtBottomRef.current = true
        setHasUnreadBelow(false)
    }

    async function send(e?: React.FormEvent) {
        if (e) e.preventDefault()
        const body = text.trim()
        if (!body || !channel || isSending) return
        setText('')
        setIsSending(true)
        try {
            await channel.sendMessage({ text: body })
            scrollToBottom()
        } catch {
            setText(body)
        } finally {
            setIsSending(false)
        }
    }

    async function sendReaction(emoji: string) {
        if (!channel || isSending) return
        setIsSending(true)
        try {
            await channel.sendMessage({ text: emoji })
            scrollToBottom()
        } catch {
            // ignore reaction send blip
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="flex h-[440px] lg:h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/95 shadow-xl backdrop-blur-xl transition-all">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 shrink-0 bg-muted/30">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs sm:text-sm font-bold text-foreground">Live Chat</h2>
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Viewer Counter Pill */}
                    <div
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 border border-emerald/25 px-2.5 py-1 text-[11px] font-semibold text-emerald transition-all"
                        title={`${watcherCount} ${watcherCount === 1 ? 'person' : 'people'} currently watching`}
                    >
                        <Users className="h-3 w-3" />
                        <span>{watcherCount}</span>
                    </div>

                    {isCurrentUserHost && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/25 px-2 py-0.5 text-[10px] font-bold text-primary">
                            <Crown className="h-2.5 w-2.5" />
                            Host View
                        </span>
                    )}

                    {onCollapse && (
                        <button
                            type="button"
                            onClick={onCollapse}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="Hide chat"
                            aria-label="Hide chat"
                        >
                            <PanelRightClose className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Message Stream */}
            <div
                ref={listRef}
                onScroll={handleScroll}
                className="relative flex-1 min-h-0 space-y-3 overflow-y-auto px-3.5 py-3.5 scroll-smooth"
            >
                {/* Welcome Notice */}
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 text-center">
                    <p className="text-[11px] font-medium text-muted-foreground inline-flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                        Welcome to the live chat! Be respectful & kind to everyone.
                    </p>
                </div>

                {failed ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                        Chat is temporarily unavailable. Please refresh the page.
                    </div>
                ) : !channel ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-xs">Connecting to stream chat...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
                            <MessageCircle className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-semibold text-foreground">No messages yet</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Say hello to start the conversation!
                        </p>
                    </div>
                ) : (
                    messages.map((m) => {
                        const isHost = Boolean(hostId && m.user?.id === hostId)
                        const isSelf = Boolean(currentUserId && m.user?.id === currentUserId)
                        const userName = m.user?.name || (isHost ? 'Broadcaster' : 'Viewer')
                        const avatarUrl = m.user?.image as string | undefined
                        const initials = getInitials(userName)
                        const gradient = getAvatarGradient(m.user?.id)

                        return (
                            <div
                                key={m.id}
                                className={`group flex items-start gap-2.5 rounded-2xl p-2 transition-colors ${
                                    isHost
                                        ? 'bg-primary/5 border border-primary/20 shadow-xs'
                                        : 'hover:bg-muted/40'
                                }`}
                            >
                                {/* User Avatar */}
                                <div className="shrink-0 mt-0.5">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={userName}
                                            className="h-7 w-7 rounded-full object-cover ring-1 ring-border shadow-xs"
                                        />
                                    ) : (
                                        <div
                                            className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-[10px] font-bold text-white shadow-xs`}
                                        >
                                            {initials}
                                        </div>
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className="min-w-0 flex-1 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-xs font-semibold truncate ${
                                            isHost ? 'text-primary' : isSelf ? 'text-foreground font-bold' : 'text-foreground'
                                        }`}>
                                            {userName}
                                        </span>

                                        {isHost && (
                                            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary text-primary-foreground px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                                                <Crown className="h-2 w-2" />
                                                Host
                                            </span>
                                        )}

                                        <span className="text-[10px] text-muted-foreground/60 ml-auto tabular-nums">
                                            {formatMessageTime(m.created_at)}
                                        </span>
                                    </div>

                                    <p className="text-xs sm:text-[13px] text-foreground/90 leading-relaxed break-words">
                                        {m.text}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}

                {/* Floating "New Messages" pill if user scrolled up */}
                {hasUnreadBelow && (
                    <button
                        type="button"
                        onClick={scrollToBottom}
                        className="sticky bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
                    >
                        <span>New messages</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Quick Reactions Bar */}
            <div className="flex items-center gap-1 border-t border-border/50 px-3 py-1.5 bg-muted/20 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-medium text-muted-foreground mr-1 shrink-0">React:</span>
                {QUICK_REACTIONS.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        disabled={!channel || isSending}
                        onClick={() => sendReaction(emoji)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm hover:bg-muted hover:scale-110 active:scale-95 transition-all disabled:opacity-40 shrink-0"
                        title={`Send ${emoji}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Input Form */}
            <form
                onSubmit={send}
                className="flex items-center gap-2 border-t border-border/70 p-3 shrink-0 bg-card"
            >
                <div className="relative flex-1">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={300}
                        placeholder={
                            !channel
                                ? 'Connecting…'
                                : isCurrentUserHost
                                ? 'Chat with your viewers...'
                                : 'Send a message...'
                        }
                        disabled={!channel}
                        className="h-10 w-full rounded-full border border-border bg-background/80 px-4 text-xs sm:text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!channel || !text.trim() || isSending}
                    aria-label="Send message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                >
                    {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </button>
            </form>
        </div>
    )
}

