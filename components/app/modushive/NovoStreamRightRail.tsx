'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Channel, LocalMessage } from 'stream-chat'
import {
    Calendar,
    Coins,
    Crown,
    Loader2,
    MessageCircle,
    Radio,
    Rocket,
    Send,
    ShoppingBag,
    Sparkles,
    Users,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useChatClient } from '@/components/app/ChatProvider'
import LiveTipModal from './LiveTipModal'
import type { LiveStreamWithHost } from '@/lib/types'

interface NovoStreamRightRailProps {
    activeLiveStream?: LiveStreamWithHost | null
    isCreator?: boolean
    onOpenBecomeCreator?: () => void
    className?: string
}

function formatMsgTime(createdAt?: string | Date) {
    if (!createdAt) return ''
    try {
        const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } catch {
        return ''
    }
}

export default function NovoStreamRightRail({
    activeLiveStream,
    isCreator = false,
    onOpenBecomeCreator,
    className = '',
}: NovoStreamRightRailProps) {
    const { client, isReady } = useChatClient()
    const [channel, setChannel] = useState<Channel | null>(null)
    const [messages, setMessages] = useState<LocalMessage[]>([])
    const [watcherCount, setWatcherCount] = useState(0)
    const [text, setText] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isTipModalOpen, setIsTipModalOpen] = useState(false)
    const listRef = useRef<HTMLDivElement>(null)

    const channelId = activeLiveStream?.chat_channel_id
    const hostId = activeLiveStream?.host_id

    const handleTipSuccess = async (tip: {
        amount: number
        giftBadge: string
        senderName: string
        message?: string
    }) => {
        if (!channel) return
        try {
            await channel.sendMessage({
                text: tip.message ? `"${tip.message}"` : `Sent a ${tip.giftBadge} to support the host!`,
                is_tip: true,
                tip_amount: tip.amount,
                gift_badge: tip.giftBadge,
                tip_message: tip.message,
            } as any)

            await channel.sendEvent({
                type: 'live_reaction',
                emoji: '🪙',
            } as any)
        } catch (err) {
            console.error('Failed to broadcast tip message to chat:', err)
        }
    }

    useEffect(() => {
        if (!client || !isReady || !channelId) {
            setChannel(null)
            setMessages([])
            return
        }

        let cancelled = false
        const ch = client.channel('livestream', channelId)

        ch.watch({ messages: { limit: 50 } })
            .then(() => {
                if (cancelled) return
                setChannel(ch)
                setMessages([...ch.state.messages])
                setWatcherCount(ch.state.watcher_count ?? 0)
            })
            .catch(() => {
                // Channel watching failed or not configured
            })

        const handleNewMessage = () => {
            setMessages([...ch.state.messages])
        }

        const handleWatchers = () => {
            setWatcherCount(ch.state.watcher_count ?? 0)
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
    }, [client, isReady, channelId])

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        const body = text.trim()
        if (!body || !channel || isSending) return

        setText('')
        setIsSending(true)
        try {
            await channel.sendMessage({ text: body })
        } catch (err) {
            console.error('[LiveChat] send failed:', err)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <aside className={`w-80 shrink-0 space-y-6 ${className}`}>
            {/* Live Chat Box */}
            <div className="flex flex-col rounded-3xl border border-border/70 bg-card/60 p-4 backdrop-blur-xl shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary" />
                        <h3 className="font-display text-sm font-bold text-foreground">Live Chat</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {channel && hostId && client?.userID !== hostId && (
                            <button
                                type="button"
                                onClick={() => setIsTipModalOpen(true)}
                                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition-all"
                            >
                                <Coins className="h-3 w-3" />
                                Tip
                            </button>
                        )}
                        {channel && watcherCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
                                {watcherCount} watching
                            </span>
                        )}
                    </div>
                </div>

                {channel ? (
                    <>
                        {/* Messages List */}
                        <div ref={listRef} className="h-72 overflow-y-auto space-y-3 py-3 pr-1">
                            {messages.length > 0 ? (
                                messages.map((msg) => {
                                    const sender = msg.user?.name || msg.user?.id || 'Viewer'
                                    const initials = sender.slice(0, 2).toUpperCase()
                                    const isTip = Boolean((msg as any).is_tip)

                                    if (isTip) {
                                        return (
                                            <div
                                                key={msg.id}
                                                className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 p-2.5 shadow-xs space-y-1 animate-in zoom-in-95"
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white">
                                                            <Sparkles className="h-2.5 w-2.5" />
                                                        </span>
                                                        <span className="text-[11px] font-bold text-amber-500 truncate max-w-[90px]">
                                                            {sender}
                                                        </span>
                                                        <span className="text-[11px] font-extrabold text-foreground">
                                                            tipped ₦{Number((msg as any).tip_amount || 0).toLocaleString('en-NG')}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-muted-foreground shrink-0">
                                                        {formatMsgTime(msg.created_at)}
                                                    </span>
                                                </div>
                                                {msg.text && (
                                                    <p className="text-[11px] text-foreground/90 pl-5 italic break-words">
                                                        {msg.text}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    }

                                    return (
                                        <div key={msg.id} className="flex items-start gap-2.5">
                                            <Avatar className="h-6 w-6 ring-1 ring-border shrink-0">
                                                <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className="truncate text-xs font-bold text-foreground">
                                                        {sender}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                                        {formatMsgTime(msg.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed break-words mt-0.5">
                                                    {msg.text}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center p-4">
                                    <p className="text-xs font-semibold text-foreground">No messages yet</p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        Be the first to say hello to the host and fellow viewers!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Input composer */}
                        <form
                            onSubmit={handleSend}
                            className="relative flex items-center pt-2 border-t border-border/50"
                        >
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Send a message..."
                                className="w-full rounded-full border border-border/70 bg-muted/60 pl-4 pr-11 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                                type="submit"
                                disabled={!text.trim() || isSending}
                                aria-label="Send message"
                                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md disabled:opacity-40 transition-transform active:scale-95"
                            >
                                {isSending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Send className="h-3.5 w-3.5" />
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                            <Radio className="h-5 w-5" />
                        </span>
                        <h4 className="text-xs font-bold text-foreground">Chat is available during live streams</h4>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                            When a broadcast is active, you can join the live conversation and interact with creators in real-time.
                        </p>
                        {isCreator ? (
                            <Link
                                href="/app/modushive/studio"
                                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold transition-colors"
                            >
                                <Radio className="h-3.5 w-3.5" />
                                Studio Broadcast
                            </Link>
                        ) : onOpenBecomeCreator ? (
                            <button
                                type="button"
                                onClick={onOpenBecomeCreator}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 hover:from-amber-500/25 hover:to-indigo-500/25 border border-amber-500/30 text-foreground px-3.5 py-1.5 text-xs font-bold transition-colors"
                            >
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                Become a Creator
                            </button>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Platform Roadmap / Upcoming Features Card */}
            <div className="rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600">
                        <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="font-display text-sm font-bold text-foreground">
                        Platform Features
                    </h4>
                </div>

                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-blue-500 bg-blue-500/10">
                            <ShoppingBag className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground">Live Shopping</p>
                            <p className="text-[11px] text-muted-foreground">Showcase products during broadcasts</p>
                        </div>
                    </div>

                    {isCreator ? (
                        <Link
                            href="/app/modushive/earnings"
                            className="group flex items-start gap-3 rounded-2xl p-2 -mx-2 hover:bg-muted/50 transition-colors"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-amber-500 bg-amber-500/10 group-hover:scale-105 transition-transform">
                                <Coins className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                        Creator Monetization
                                    </p>
                                    <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-500">
                                        Live Hub
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">Tips, tickets & shopping dashboard</p>
                            </div>
                        </Link>
                    ) : onOpenBecomeCreator ? (
                        <button
                            type="button"
                            onClick={onOpenBecomeCreator}
                            className="w-full text-left group flex items-start gap-3 rounded-2xl p-2 -mx-2 hover:bg-muted/50 transition-colors"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-amber-500 bg-amber-500/10 group-hover:scale-105 transition-transform">
                                <Crown className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                        Creator Program
                                    </p>
                                    <span className="rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-500">
                                        Join Free
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">Start streaming & Day-One monetization</p>
                            </div>
                        </button>
                    ) : null}

                    <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-purple-500 bg-purple-500/10">
                            <Calendar className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground">Scheduled Live Events</p>
                            <p className="text-[11px] text-muted-foreground">Concerts, webinars, and conferences</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-emerald-500 bg-emerald-500/10">
                            <Users className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground">Community & Spaces</p>
                            <p className="text-[11px] text-muted-foreground">Connect with verified members</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Tipping Modal */}
            {activeLiveStream && hostId && (
                <LiveTipModal
                    isOpen={isTipModalOpen}
                    onClose={() => setIsTipModalOpen(false)}
                    liveStreamId={activeLiveStream.id}
                    creatorId={hostId}
                    creatorName={activeLiveStream.host?.display_name || 'Creator'}
                    creatorAvatar={activeLiveStream.host?.avatar_url || undefined}
                    onTipSuccess={handleTipSuccess}
                />
            )}
        </aside>
    )
}
