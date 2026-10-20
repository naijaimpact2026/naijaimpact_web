'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import LiveChat from '@/components/app/modushive/LiveChat'
import FloatingReactions from '@/components/app/modushive/FloatingReactions'

interface LiveStreamLayoutProps
{
    backLink: React.ReactNode
    videoSlot: React.ReactNode
    infoSlot: React.ReactNode
    chatChannelId?: string | null
    hostId?: string | null
}

export default function LiveStreamLayout({
    backLink,
    videoSlot,
    infoSlot,
    chatChannelId,
    hostId,
}: LiveStreamLayoutProps)
{
    const [isChatOpen, setIsChatOpen] = useState(true)
    const hasChat = Boolean(chatChannelId)

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between gap-4">
                {backLink}
                {hasChat && !isChatOpen && (
                    <button
                        type="button"
                        onClick={() => setIsChatOpen(true)}
                        className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                        aria-label="Show live chat"
                    >
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        <span>Show chat</span>
                    </button>
                )}
            </div>

            {/* Main Responsive Grid */}
            <div
                className={`grid gap-4 ${hasChat && isChatOpen
                    ? 'lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]'
                    : 'grid-cols-1'
                    }`}
            >
                {/* Video & Info Column */}
                <div className="space-y-4 min-w-0">
                    <div className="relative overflow-hidden rounded-2xl">
                        {videoSlot}
                        <FloatingReactions channelId={chatChannelId} />
                    </div>
                    {infoSlot}
                </div>

                {/* Live Chat Column */}
                {hasChat && isChatOpen && (
                    <aside className="lg:sticky lg:top-20 lg:h-[calc(100dvh-8.5rem)]">
                        <LiveChat
                            channelId={chatChannelId!}
                            hostId={hostId ?? undefined}
                            onCollapse={() => setIsChatOpen(false)}
                        />
                    </aside>
                )}
            </div>
        </div>
    )
}
