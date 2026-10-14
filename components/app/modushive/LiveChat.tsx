'use client'

import { useEffect, useRef, useState } from 'react'
import type { Channel, LocalMessage } from 'stream-chat'
import { Loader2, MessageCircle, Send } from 'lucide-react'
import { useChatClient } from '@/components/app/ChatProvider'

/**
 * Lightweight live chat on a Stream `livestream` channel (created by the
 * server when the host sets the stream up). That channel type lets any
 * signed-in user read and post without being a member.
 */
export default function LiveChat({ channelId }: { channelId: string })
{
    const { client, isReady } = useChatClient()
    const [channel, setChannel] = useState<Channel | null>(null)
    const [messages, setMessages] = useState<LocalMessage[]>([])
    const [text, setText] = useState('')
    const [failed, setFailed] = useState(false)
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() =>
    {
        if (!client || !isReady) return
        let cancelled = false
        const ch = client.channel('livestream', channelId)

        ch.watch({ messages: { limit: 50 } })
            .then(() =>
            {
                if (cancelled) return
                setChannel(ch)
                setMessages([...ch.state.messages])
            })
            .catch(() => { if (!cancelled) setFailed(true) })

        const sub = ch.on('message.new', () => setMessages([...ch.state.messages]))
        return () =>
        {
            cancelled = true
            sub.unsubscribe()
            ch.stopWatching().catch(() => {})
        }
    }, [client, isReady, channelId])

    useEffect(() =>
    {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    }, [messages])

    async function send(e: React.FormEvent)
    {
        e.preventDefault()
        const body = text.trim()
        if (!body || !channel) return
        setText('')
        try { await channel.sendMessage({ text: body }) } catch { setText(body) }
    }

    return (
        <div className="flex h-[420px] lg:h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Live chat</h2>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {failed ? (
                    <p className="text-center text-xs text-muted-foreground pt-8">Chat is unavailable right now.</p>
                ) : !channel ? (
                    <div className="flex justify-center pt-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : messages.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground pt-8">Say hello 👋</p>
                ) : messages.map((m) => (
                    <p key={m.id} className="text-sm leading-snug break-words">
                        <span className="font-semibold text-foreground mr-1.5">{m.user?.name ?? 'Member'}</span>
                        <span className="text-muted-foreground">{m.text}</span>
                    </p>
                ))}
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={300}
                    placeholder={channel ? 'Send a message' : 'Connecting…'}
                    disabled={!channel}
                    className="h-9 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-60"
                />
                <button type="submit" disabled={!channel || !text.trim()} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
                    <Send className="h-4 w-4" />
                </button>
            </form>
        </div>
    )
}
