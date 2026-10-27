'use client'

import React from 'react'
import { useChannelStateContext } from 'stream-chat-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sparkles, ShieldCheck, MessageCircle } from 'lucide-react'
import { playSendMessageSound } from '@/lib/chat-sound'

export default function ChatEmptyStateIndicator()
{
    const { channel } = useChannelStateContext()

    const members = Object.values(channel?.state?.members || {})
    const currentUserId = channel?._client?.userID
    const otherMembers = members.filter((m) => m.user?.id !== currentUserId)
    const isGroup =
        (channel?.id ?? '').startsWith('group_') ||
        Boolean((channel?.data as any)?.custom?.isGroup) ||
        otherMembers.length > 1
    const otherMember = otherMembers[0]

    const title = isGroup
        ? ((channel?.data as any)?.name || 'Group Conversation')
        : (otherMember?.user?.name || otherMember?.user?.id || 'this user')
    const avatarUrl = isGroup
        ? ((channel?.data as any)?.image as string | undefined)
        : (otherMember?.user?.image as string | undefined)
    const isOnline = !isGroup && Boolean(otherMember?.user?.online)

    const initials = title
        .split(' ')
        .map((p: string) => p[0] ?? '')
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const icebreakers = isGroup
        ? [
            '👋 Hello everyone!',
            '🚀 Excited to be part of this group!',
            '💬 What is everyone working on today?',
        ]
        : [
            `👋 Hello ${title.split(' ')[0]}! How are you?`,
            '✨ Great to connect with you!',
            "🤝 Hi, I'd love to ask about your work on Hubnovo.",
        ]

    const handleSelectIcebreaker = (text: string) =>
    {
        // Populate composer textarea so user can edit or send
        const textarea = document.querySelector<HTMLTextAreaElement>(
            '.str-chat .str-chat__textarea textarea, .str-chat textarea'
        )
        if (textarea)
        {
            const nativeSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value'
            )?.set
            nativeSetter?.call(textarea, text)
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
            textarea.focus()
        } else if (channel)
        {
            channel
                .sendMessage({ text })
                .then(() => playSendMessageSound())
                .catch((err) => console.error('Failed to send quick message', err))
        }
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 my-auto select-none pointer-events-auto">
            <div className="relative max-w-sm w-full mx-auto px-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Avatar with Glow and Online Dot */}
                <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-500/25 via-emerald-500/25 to-indigo-500/25 animate-pulse blur-md" />
                    <Avatar className="relative w-full h-full rounded-2xl border-2 border-white dark:border-slate-800 shadow-md">
                        <AvatarImage src={avatarUrl} alt={title} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-primary/15 via-sky-500/20 to-emerald-500/20 text-primary font-bold text-lg sm:text-xl">
                            {initials || <MessageCircle className="w-6 h-6" />}
                        </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                        <span
                            title="Online now"
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background ring-2 ring-emerald-500/30 flex items-center justify-center shadow-sm"
                        >
                            <span className="w-2 h-2 rounded-full bg-white animate-ping opacity-75" />
                        </span>
                    )}
                </div>

                {/* Title & Description */}
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 mb-1">
                        <Sparkles className="w-3 h-3" />
                        {isGroup ? 'Group Conversation' : isOnline ? 'Active Now' : 'Direct Conversation'}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight line-clamp-1">
                        {isGroup ? `Welcome to ${title}` : `Say hello to ${title}`}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed px-2">
                        {isGroup
                            ? 'No messages here yet. Break the ice and kick off the group conversation!'
                            : `This is the very beginning of your direct conversation with ${title}. Break the ice below!`}
                    </p>
                </div>

                {/* Quick Icebreakers */}
                <div className="pt-2 space-y-2 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-center">
                        Quick Icebreakers
                    </p>
                    <div className="flex flex-col gap-1.5">
                        {icebreakers.map((msg, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleSelectIcebreaker(msg)}
                                className="group flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-border/70 bg-background/70 hover:bg-primary/10 hover:border-primary/30 text-xs font-medium text-foreground transition-all duration-150 text-left active:scale-[0.99] cursor-pointer"
                            >
                                <span className="truncate">{msg}</span>
                                <span className="text-muted-foreground group-hover:text-primary transition-colors text-[10px] shrink-0 font-semibold">
                                    Use ↵
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Privacy Badge */}
                <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/75">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>End-to-end encrypted & direct</span>
                </div>
            </div>
        </div>
    )
}
