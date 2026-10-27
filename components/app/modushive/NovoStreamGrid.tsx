'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Clapperboard,
    Eye,
    GraduationCap,
    Music,
    Newspaper,
    Play,
    Radio,
    Sparkles,
    Trophy,
    Tv,
    Upload,
    Users,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDuration } from '@/lib/modushive/config'
import StreamThumbnail from '@/components/app/modushive/StreamThumbnail'
import type { LiveStreamWithHost, VideoWithOwner } from '@/lib/types'

interface NovoStreamGridProps {
    liveStreams: LiveStreamWithHost[]
    replays: VideoWithOwner[]
    selectedCategory: string
    onSelectCategory: (cat: string) => void
    showGoLive?: boolean
}

export const EXPLORE_CATEGORIES = [
    {
        id: 'music',
        title: 'Music',
        desc: 'Concerts, artists & audio sessions',
        icon: Music,
        gradient: 'from-purple-500 to-indigo-600',
    },
    {
        id: 'education',
        title: 'Education',
        desc: 'Workshops, tutorials & masterclasses',
        icon: GraduationCap,
        gradient: 'from-emerald-500 to-teal-600',
    },
    {
        id: 'entertainment',
        title: 'Entertainment',
        desc: 'Shows, lifestyle & comedy',
        icon: Clapperboard,
        gradient: 'from-pink-500 to-rose-600',
    },
    {
        id: 'sports',
        title: 'Sports',
        desc: 'Live sports & analysis',
        icon: Trophy,
        gradient: 'from-amber-500 to-orange-600',
    },
    {
        id: 'faith',
        title: 'Faith',
        desc: 'Worship, inspiration & fellowship',
        icon: Sparkles,
        gradient: 'from-blue-500 to-cyan-600',
    },
    {
        id: 'news',
        title: 'News',
        desc: 'Community updates & events',
        icon: Newspaper,
        gradient: 'from-red-500 to-rose-600',
    },
]

export default function NovoStreamGrid({
    liveStreams,
    replays,
    selectedCategory,
    onSelectCategory,
    showGoLive = false,
}: NovoStreamGridProps) {
    // Dynamic category matching: checks title, description, or tags
    const filterByCat = (title?: string, description?: string) => {
        if (selectedCategory === 'all' || selectedCategory === 'my-list') return true
        const text = `${title || ''} ${description || ''}`.toLowerCase()
        return text.includes(selectedCategory.toLowerCase())
    }

    const filteredLive = liveStreams.filter((s) => filterByCat(s.title, s.description ?? ''))
    const filteredReplays = replays.filter((v) => filterByCat(v.title, v.description ?? ''))

    return (
        <div className="space-y-8 sm:space-y-10">
            {/* ── Section 1: Live Now ── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                        </span>
                        <h2 className="font-display text-lg sm:text-xl font-black text-foreground">
                            Live Now {filteredLive.length > 0 && `(${filteredLive.length})`}
                        </h2>
                    </div>
                </div>

                {filteredLive.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredLive.map((stream) => (
                            <Link
                                key={stream.id}
                                href={`/app/modushive/live/${stream.id}`}
                                className="group block overflow-hidden rounded-2xl border border-destructive/30 bg-card/70 hover:border-destructive transition-all hover:shadow-md"
                            >
                                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                    <StreamThumbnail
                                        title={stream.title}
                                        thumbnailUrl={stream.thumbnail_url}
                                        status={stream.status}
                                        isPaid={stream.is_paid}
                                        ticketPrice={stream.ticket_price}
                                    />
                                </div>

                                <div className="p-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Avatar className="h-6 w-6 ring-1 ring-border shrink-0">
                                            <AvatarImage src={stream.host?.avatar_url ?? undefined} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">
                                                {(stream.host?.display_name ?? 'H').slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className="truncate text-xs font-semibold text-muted-foreground flex-1">
                                            {stream.host?.display_name ?? 'HubNovo Member'}
                                        </p>
                                    </div>
                                    <h3 className="line-clamp-1 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                        {stream.title}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3">
                            <Radio className="h-6 w-6" />
                        </span>
                        <h3 className="text-sm font-bold text-foreground">No active live streams right now</h3>
                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                            When creators begin broadcasting, live streams will immediately appear here with real-time video and chat.
                        </p>
                        {showGoLive && (
                            <Link
                                href="/app/modushive/studio"
                                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                            >
                                <Radio className="h-3.5 w-3.5" />
                                Go live from Studio
                            </Link>
                        )}
                    </div>
                )}
            </section>

            {/* ── Section 2: Trending Replays & Completed Livestreams ── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-display text-lg sm:text-xl font-black text-foreground">
                            Recorded Replays & Videos {filteredReplays.length > 0 && `(${filteredReplays.length})`}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Catch up on recorded live broadcasts and community video highlights.
                        </p>
                    </div>
                </div>

                {filteredReplays.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredReplays.map((video) => (
                            <Link
                                key={video.id}
                                href={`/app/modushive/${video.id}`}
                                className="group block overflow-hidden rounded-2xl border border-border/70 bg-card/70 hover:border-border transition-all hover:shadow-md"
                            >
                                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                    <StreamThumbnail
                                        title={video.title}
                                        thumbnailUrl={video.thumbnail_url}
                                        isReplay={video.kind === 'live_replay'}
                                    />
                                    {video.duration_s && (
                                        <div className="absolute bottom-2 right-2 z-10">
                                            <span className="rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                                                {formatDuration(video.duration_s)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 space-y-1">
                                    <h3 className="line-clamp-1 text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                        {video.title}
                                    </h3>
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span className="truncate">{video.owner?.display_name ?? 'HubNovo Member'}</span>
                                        <span className="text-[10px] font-semibold text-primary">
                                            {video.kind === 'live_replay' ? 'Stream Replay' : 'Watch'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                            <Clapperboard className="h-6 w-6" />
                        </span>
                        <h3 className="text-sm font-bold text-foreground">No recorded replays available</h3>
                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                            When live streams end, recordings are archived and displayed here automatically for community replay.
                        </p>
                        <Link
                            href="/app/modushive/upload"
                            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Upload a video
                        </Link>
                    </div>
                )}
            </section>

            {/* ── Section 3: Explore Categories ── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg sm:text-xl font-black text-foreground">
                        Categories
                    </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {EXPLORE_CATEGORIES.map((cat) => {
                        const Icon = cat.icon
                        const isSelected = selectedCategory === cat.id
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => onSelectCategory(isSelected ? 'all' : cat.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                                    isSelected
                                        ? 'border-indigo-500 bg-indigo-500/10 shadow-md scale-[1.02]'
                                        : 'border-border/70 bg-card/60 hover:bg-muted/60 hover:border-border'
                                }`}
                            >
                                <span
                                    className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr ${cat.gradient} text-white shadow-md mb-2`}
                                >
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-foreground">
                                    {cat.title}
                                </span>
                                <span className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                                    {cat.desc}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </section>

            {/* ── Section 4: Platform Banner ── */}
            <section className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg">
                            <Sparkles className="h-6 w-6" />
                        </span>
                        <div>
                            <h3 className="font-display text-base sm:text-lg font-black text-white">
                                Interactive Livestreaming on Hubnovo
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300">
                                Connect with your audience live, share ideas, and watch stream replays anytime.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-slate-200">
                            <Tv className="h-3.5 w-3.5 text-blue-400" /> Live Video
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-slate-200">
                            <Users className="h-3.5 w-3.5 text-amber-400" /> Community Chat
                        </span>
                    </div>
                </div>
            </section>
        </div>
    )
}
