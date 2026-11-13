'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
    Clapperboard,
    GraduationCap,
    Music,
    Newspaper,
    Play,
    Radio,
    Sparkles,
    Trophy,
    Video,
} from 'lucide-react'

interface StreamThumbnailProps {
    title: string
    thumbnailUrl?: string | null
    category?: string | null
    status?: 'idle' | 'live' | 'ended'
    isReplay?: boolean
    isPaid?: boolean
    ticketPrice?: number
    className?: string
}

const CATEGORY_STYLES: Record<string, { gradient: string; icon: typeof Video }> = {
    education: { gradient: 'from-emerald-600 via-teal-700 to-slate-950', icon: GraduationCap },
    music: { gradient: 'from-purple-600 via-indigo-700 to-slate-950', icon: Music },
    entertainment: { gradient: 'from-pink-600 via-rose-700 to-slate-950', icon: Clapperboard },
    sports: { gradient: 'from-amber-600 via-orange-700 to-slate-950', icon: Trophy },
    faith: { gradient: 'from-blue-600 via-sky-700 to-slate-950', icon: Sparkles },
    news: { gradient: 'from-red-600 via-rose-800 to-slate-950', icon: Newspaper },
}

const DEFAULT_STYLE = {
    gradient: 'from-slate-800 via-slate-900 to-black',
    icon: Video,
}

export default function StreamThumbnail({
    title,
    thumbnailUrl,
    category,
    status,
    isReplay,
    isPaid,
    ticketPrice,
    className = '',
}: StreamThumbnailProps) {
    const [imgError, setImgError] = useState(false)

    const catKey = (category || '').toLowerCase().trim()
    const catConfig = CATEGORY_STYLES[catKey] || DEFAULT_STYLE
    const IconComponent = catConfig.icon

    const showImage = Boolean(thumbnailUrl && !imgError)

    const getFallbackImage = () => {
        if (status === 'live') return '/images/livestream/creator-broadcasting.jpg'
        if (catKey === 'education') return '/images/livestream/stream-education.jpg'
        if (catKey === 'music') return '/images/livestream/stream-music.jpg'
        if (isReplay) return '/images/livestream/video-creator-uploading.jpg'
        return '/images/livestream/creator-broadcasting.jpg'
    }

    return (
        <div className={`relative h-full w-full overflow-hidden bg-slate-950 select-none ${className}`}>
            {showImage ? (
                <Image
                    src={thumbnailUrl!}
                    alt={title}
                    fill
                    unoptimized
                    onError={() => setImgError(true)}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="relative h-full w-full overflow-hidden bg-slate-950">
                    <Image
                        src={getFallbackImage()}
                        alt={title}
                        fill
                        className="object-cover brightness-[0.4] transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${catConfig.gradient} opacity-65 mix-blend-multiply`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/30" />

                    <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-3 text-white">
                        {/* Central Branded Card Icon */}
                        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg">
                            {status === 'live' ? (
                                <Radio className="h-5 w-5 text-red-400 animate-pulse" />
                            ) : isReplay ? (
                                <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                            ) : (
                                <IconComponent className="h-5 w-5 text-white/90" />
                            )}
                        </div>

                        {/* Monogram / Title Preview */}
                        <p className="mt-2 line-clamp-1 max-w-[85%] text-center text-[11px] font-bold tracking-tight text-white drop-shadow-sm">
                            {title}
                        </p>
                    </div>
                </div>
            )}

            {/* Subtle Gradient Shade Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Status / Badges Overlay */}
            <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                {status === 'live' && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        Live
                    </span>
                )}
                {isReplay && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-black/75 backdrop-blur-md border border-white/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                        <Play className="h-2 w-2 fill-white text-white" />
                        Replay
                    </span>
                )}
                {isPaid && ticketPrice ? (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/90 text-white px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide shadow-sm">
                        🎟️ ₦{Number(ticketPrice).toLocaleString('en-NG')}
                    </span>
                ) : null}
            </div>
        </div>
    )
}
