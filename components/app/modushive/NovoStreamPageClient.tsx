'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    AlertCircle,
    Coins,
    Loader2,
    Radio,
    Search,
    Sparkles,
    Upload,
} from 'lucide-react'
import NovoStreamSidebar from './NovoStreamSidebar'
import NovoStreamHero from './NovoStreamHero'
import NovoStreamGrid from './NovoStreamGrid'
import NovoStreamRightRail from './NovoStreamRightRail'
import BecomeCreatorModal from './BecomeCreatorModal'
import { isCreatorOrAdmin } from '@/lib/modushive/config'
import { DeleteVideoButton } from './VideoActions'
import type { LiveStreamWithHost, Video, VideoWithOwner } from '@/lib/types'

interface NovoStreamPageClientProps {
    profile: any
    showGoLive: boolean
    liveStreams: LiveStreamWithHost[]
    replays: VideoWithOwner[]
    pendingVideos: Video[]
}

export default function NovoStreamPageClient({
    profile,
    showGoLive,
    liveStreams,
    replays,
    pendingVideos,
}: NovoStreamPageClientProps) {
    const [activeCategory, setActiveCategory] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [isBecomeCreatorOpen, setIsBecomeCreatorOpen] = useState(false)

    const isCreator = isCreatorOrAdmin(profile?.role)

    // Filter streams and replays based on category and search query dynamically
    const filterItems = <T extends { title: string; description?: string | null; host_id?: string; owner_id?: string }>(
        items: T[]
    ): T[] => {
        let result = items

        // Category filter
        if (activeCategory === 'my-list') {
            result = result.filter(
                (item) =>
                    (item.host_id && item.host_id === profile?.id) ||
                    (item.owner_id && item.owner_id === profile?.id)
            )
        } else if (activeCategory !== 'all') {
            const cat = activeCategory.toLowerCase()
            result = result.filter((item) => {
                const combined = `${item.title} ${item.description || ''}`.toLowerCase()
                return combined.includes(cat)
            })
        }

        // Search query filter
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase()
            result = result.filter((item) => {
                const combined = `${item.title} ${item.description || ''}`.toLowerCase()
                return combined.includes(query)
            })
        }

        return result
    }

    const filteredLiveStreams = filterItems(liveStreams)
    const filteredReplays = filterItems(replays)

    // First active live broadcast takes hero spotlight, or first replay video
    const featuredLiveStream = liveStreams.length > 0 ? liveStreams[0] : null
    const featuredVideo = replays.length > 0 ? replays[0] : null

    return (
        <div className="w-full space-y-6">
            {/* Top Sub-Header / Search & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/70 bg-card/60 p-3 sm:p-4 backdrop-blur-xl shadow-sm">
                {/* Dynamic Search Bar */}
                <div className="relative flex-1 min-w-[260px] max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for live streams, shows, topics..."
                        className="w-full rounded-full border border-border/70 bg-muted/60 pl-10 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {isCreator ? (
                        <Link
                            href="/app/modushive/earnings"
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all shadow-sm"
                        >
                            <Coins className="h-4 w-4 text-amber-500" />
                            <span className="hidden sm:inline">Creator</span> Earnings
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsBecomeCreatorOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 hover:from-amber-500/25 hover:to-indigo-500/25 border border-amber-500/30 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground active:scale-95 transition-all shadow-sm"
                        >
                            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                            <span>Become a Creator</span>
                        </button>
                    )}

                    {showGoLive && isCreator && (
                        <Link
                            href="/app/modushive/studio"
                            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-red-600/30 hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Radio className="h-4 w-4 animate-pulse" />
                            Go Live
                        </Link>
                    )}

                    <Link
                        href="/app/modushive/upload"
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
                    >
                        <Upload className="h-4 w-4" />
                        Upload
                    </Link>
                </div>
            </div>

            {/* Viewer's Pending Uploads Banner (if any) */}
            {pendingVideos.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">Your Uploads Processing</h3>
                    <ul className="divide-y divide-border">
                        {pendingVideos.map((v) => (
                            <li key={v.id} className="flex items-center gap-3 py-2">
                                {v.status === 'errored' ? (
                                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                                ) : (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-foreground">{v.title}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {v.status === 'errored'
                                            ? `Failed: ${v.error_message || 'Processing error'}`
                                            : 'Processing — this usually takes a minute or two'}
                                    </p>
                                </div>
                                {v.status !== 'processing' && <DeleteVideoButton videoId={v.id} />}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Main 3-Column NovoStream Experience */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left Column: Dedicated Livestream Sidebar */}
                <div className="hidden lg:block sticky top-20">
                    <NovoStreamSidebar
                        activeCategory={activeCategory}
                        onSelectCategory={setActiveCategory}
                        isCreator={isCreator}
                        onOpenBecomeCreator={() => setIsBecomeCreatorOpen(true)}
                    />
                </div>

                {/* Mobile Category Pill Scroller */}
                <div className="lg:hidden w-full flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {['all', 'music', 'education', 'entertainment', 'sports', 'faith', 'news', 'my-list'].map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap capitalize transition-all ${
                                activeCategory === cat
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-card border border-border text-muted-foreground'
                            }`}
                        >
                            {cat === 'all' ? 'All Live' : cat.replace('-', ' ')}
                        </button>
                    ))}
                </div>

                {/* Center Column: Full-width Hero Video on top + Organized Grids beneath it */}
                <main className="flex-1 min-w-0 space-y-8 w-full">
                    {/* The first video / broadcast is FULL on the UI */}
                    <NovoStreamHero
                        activeLiveStream={featuredLiveStream}
                        featuredVideo={featuredVideo}
                        showGoLive={showGoLive && isCreator}
                    />

                    {/* Other videos, streams, and categories stay under it */}
                    <NovoStreamGrid
                        liveStreams={filteredLiveStreams}
                        replays={filteredReplays}
                        selectedCategory={activeCategory}
                        onSelectCategory={setActiveCategory}
                        showGoLive={showGoLive && isCreator}
                    />
                </main>

                {/* Right Column: Live Chat & Platform Feature Guide */}
                <div className="hidden xl:block sticky top-20">
                    <NovoStreamRightRail
                        activeLiveStream={featuredLiveStream}
                        isCreator={isCreator}
                        onOpenBecomeCreator={() => setIsBecomeCreatorOpen(true)}
                    />
                </div>
            </div>

            {/* Become a Creator Activation Modal */}
            <BecomeCreatorModal
                isOpen={isBecomeCreatorOpen}
                onClose={() => setIsBecomeCreatorOpen(false)}
            />
        </div>
    )
}
