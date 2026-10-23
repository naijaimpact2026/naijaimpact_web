'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Bell,
    Check,
    Clock,
    Eye,
    Play,
    Radio,
    Sparkles,
    Video as VideoIcon,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDuration } from '@/lib/modushive/config'
import type { LiveStreamWithHost, VideoWithOwner } from '@/lib/types'

interface NovoStreamHeroProps {
    activeLiveStream?: LiveStreamWithHost | null
    featuredVideo?: VideoWithOwner | null
    showGoLive?: boolean
    className?: string
}

export default function NovoStreamHero({
    activeLiveStream,
    featuredVideo,
    showGoLive = false,
    className = '',
}: NovoStreamHeroProps) {
    const [isReminded, setIsReminded] = useState(false)

    // ── Case 1: An active live broadcast exists in the database ──
    if (activeLiveStream) {
        const host = activeLiveStream.host
        const startTime = activeLiveStream.started_at
            ? formatDistanceToNow(new Date(activeLiveStream.started_at), { addSuffix: true })
            : 'Just started'

        return (
            <section
                className={`group relative overflow-hidden rounded-3xl border border-destructive/40 bg-slate-950 text-white shadow-2xl ${className}`}
            >
                {/* Background image if thumbnail is available, otherwise dynamic gradient */}
                <div className="absolute inset-0 z-0">
                    {activeLiveStream.thumbnail_url ? (
                        <Image
                            src={activeLiveStream.thumbnail_url}
                            alt={activeLiveStream.title}
                            fill
                            unoptimized
                            priority
                            className="object-cover object-center brightness-[0.4] transition-all duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-950 via-purple-950/60 to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                    <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8 md:p-10 lg:p-12 min-h-[340px] sm:min-h-[400px] max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/40">
                            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                            Live Now
                        </span>
                        {activeLiveStream.is_paid ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 backdrop-blur-md border border-amber-400/40 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-amber-500/30">
                                🎟️ Masterclass • ₦{Number(activeLiveStream.ticket_price).toLocaleString('en-NG')}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-semibold text-slate-200">
                                <Radio className="h-3.5 w-3.5 text-red-400" />
                                Active Broadcast
                            </span>
                        )}
                    </div>

                    <div className="space-y-2 sm:space-y-3 my-4 sm:my-6">
                        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
                            {activeLiveStream.title}
                        </h1>

                        {host && (
                            <div className="flex items-center gap-2.5 pt-1">
                                <Avatar className="h-7 w-7 ring-1 ring-white/30">
                                    <AvatarImage src={host.avatar_url ?? undefined} />
                                    <AvatarFallback className="bg-primary/30 text-white text-[10px] font-bold">
                                        {(host.display_name ?? 'H').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs sm:text-sm font-bold text-slate-200">
                                    {host.display_name ?? 'HubNovo Streamer'}
                                </span>
                            </div>
                        )}

                        {activeLiveStream.description && (
                            <p className="text-xs sm:text-sm text-slate-300 max-w-xl line-clamp-2 leading-relaxed">
                                {activeLiveStream.description}
                            </p>
                        )}

                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 pt-1">
                            <Clock className="h-4 w-4 text-purple-400" />
                            <span>Started {startTime}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Link
                            href={`/app/modushive/live/${activeLiveStream.id}`}
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-red-600/35 hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Play className="h-4 w-4 fill-white" />
                            {activeLiveStream.is_paid ? 'Get Ticket & Join' : 'Watch Live'}
                        </Link>
                    </div>
                </div>
            </section>
        )
    }

    // ── Case 2: No active live stream, but recorded replays/videos exist ──
    if (featuredVideo) {
        const owner = featuredVideo.owner
        const isReplay = featuredVideo.kind === 'live_replay'

        return (
            <section
                className={`group relative overflow-hidden rounded-3xl border border-border/80 bg-slate-950 text-white shadow-xl ${className}`}
            >
                <div className="absolute inset-0 z-0">
                    {featuredVideo.thumbnail_url ? (
                        <Image
                            src={featuredVideo.thumbnail_url}
                            alt={featuredVideo.title}
                            fill
                            unoptimized
                            priority
                            className="object-cover object-center brightness-[0.4] transition-all duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                    <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8 md:p-10 lg:p-12 min-h-[340px] sm:min-h-[400px] max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                            <Sparkles className="h-3.5 w-3.5" />
                            {isReplay ? 'Stream Replay' : 'Featured Video'}
                        </span>
                        {featuredVideo.duration_s && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-semibold text-slate-200">
                                <Clock className="h-3.5 w-3.5 text-blue-400" />
                                {formatDuration(featuredVideo.duration_s)}
                            </span>
                        )}
                    </div>

                    <div className="space-y-2 sm:space-y-3 my-4 sm:my-6">
                        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
                            {featuredVideo.title}
                        </h1>

                        {owner && (
                            <div className="flex items-center gap-2.5 pt-1">
                                <Avatar className="h-7 w-7 ring-1 ring-white/30">
                                    <AvatarImage src={owner.avatar_url ?? undefined} />
                                    <AvatarFallback className="bg-primary/30 text-white text-[10px] font-bold">
                                        {(owner.display_name ?? 'U').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs sm:text-sm font-bold text-slate-200">
                                    {owner.display_name ?? 'HubNovo Member'}
                                </span>
                            </div>
                        )}

                        {featuredVideo.description && (
                            <p className="text-xs sm:text-sm text-slate-300 max-w-xl line-clamp-2 leading-relaxed">
                                {featuredVideo.description}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Link
                            href={`/app/modushive/${featuredVideo.id}`}
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-indigo-600/35 hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Play className="h-4 w-4 fill-white" />
                            {isReplay ? 'Watch Replay' : 'Watch Video'}
                        </Link>
                    </div>
                </div>
            </section>
        )
    }

    // ── Case 3: Empty state when database has zero live streams and zero videos ──
    return (
        <section
            className={`relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-2xl ${className}`}
        >
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-between min-h-[300px] sm:min-h-[340px] max-w-2xl">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md">
                        <Radio className="h-3.5 w-3.5" />
                        Livestream Hub
                    </span>
                </div>

                <div className="space-y-3 my-4">
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white">
                        Welcome to NovoStream
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Interactive live broadcasts, real-time community engagement, floating emoji reactions, and video replays on Hubnovo.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    {showGoLive ? (
                        <Link
                            href="/app/modushive/studio"
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Radio className="h-4 w-4" />
                            Start Your First Stream
                        </Link>
                    ) : (
                        <Link
                            href="/app/modushive/upload"
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
                        >
                            <VideoIcon className="h-4 w-4" />
                            Upload a Video
                        </Link>
                    )}
                </div>
            </div>
        </section>
    )
}
