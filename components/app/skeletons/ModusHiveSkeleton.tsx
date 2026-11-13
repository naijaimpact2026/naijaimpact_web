import {
    SkeletonAvatar,
    SkeletonBlock,
    SkeletonLine,
    SkeletonPill,
    WAVE_STEP,
} from './primitives'

function VideoCardSkeleton({ delay }: { delay: number }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-3 space-y-3">
            <SkeletonBlock delay={delay} className="aspect-video w-full rounded-xl" />
            <div className="flex items-center gap-2">
                <SkeletonAvatar size={24} delay={delay + WAVE_STEP} />
                <SkeletonLine width="60%" height={10} delay={delay + WAVE_STEP * 2} />
            </div>
            <SkeletonLine width="85%" height={13} delay={delay + WAVE_STEP * 3} />
        </div>
    )
}

/**
 * Skeleton loader matching the 3-column NovoStream livestream layout:
 * - Top Search & Action Bar
 * - Left Sidebar (Categories, Explore, Be a Creator card)
 * - Center Column (Hero Video Banner, Live Now, Replays, Categories, Bottom Banner)
 * - Right Rail (Live Chat, Platform Features)
 */
export default function ModusHiveSkeleton() {
    return (
        <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
            {/* 1. Top Sub-Header & Search Bar Skeleton */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/70 bg-card/60 p-3 sm:p-4">
                <SkeletonPill className="h-10 w-full max-w-md rounded-full" delay={0} />
                <div className="flex items-center gap-3">
                    <SkeletonPill className="h-9 w-24 rounded-full" delay={WAVE_STEP} />
                    <SkeletonPill className="h-9 w-24 rounded-full" delay={WAVE_STEP * 2} />
                </div>
            </div>

            {/* 2. Main 3-Column Layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left Column: Dedicated Livestream Sidebar */}
                <aside className="hidden lg:block w-60 shrink-0 space-y-6 rounded-3xl border border-border/70 bg-card/60 p-4">
                    {/* Navigation Categories */}
                    <div className="space-y-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2">
                                <SkeletonBlock className="h-4 w-4 rounded-md" delay={i * WAVE_STEP} />
                                <SkeletonLine width="60%" height={12} delay={i * WAVE_STEP + WAVE_STEP} />
                            </div>
                        ))}
                    </div>

                    {/* Explore */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                        <SkeletonLine width="40%" height={10} delay={WAVE_STEP * 6} />
                        <div className="flex items-center gap-3 px-3 py-1.5">
                            <SkeletonBlock className="h-4 w-4 rounded-md" delay={WAVE_STEP * 7} />
                            <SkeletonLine width="50%" height={12} delay={WAVE_STEP * 8} />
                        </div>
                    </div>

                    {/* "Be a Creator" Box */}
                    <SkeletonBlock className="h-36 w-full rounded-2xl" delay={WAVE_STEP * 9} />
                </aside>

                {/* Center Main Column */}
                <main className="flex-1 min-w-0 space-y-8 w-full">
                    {/* Full Hero Video Banner Skeleton */}
                    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/50 p-6 sm:p-10 min-h-[340px] sm:min-h-[400px] flex flex-col justify-between">
                        <div className="flex items-center gap-2.5">
                            <SkeletonPill className="h-6 w-20 rounded-full" delay={WAVE_STEP} />
                            <SkeletonPill className="h-6 w-24 rounded-full" delay={WAVE_STEP * 2} />
                        </div>

                        <div className="space-y-3 my-6 max-w-xl">
                            <SkeletonLine width="75%" height={32} delay={WAVE_STEP * 3} />
                            <SkeletonLine width="45%" height={18} delay={WAVE_STEP * 4} />
                            <SkeletonLine width="90%" height={12} delay={WAVE_STEP * 5} />
                        </div>

                        <div className="flex items-center gap-3">
                            <SkeletonPill className="h-11 w-32 rounded-full" delay={WAVE_STEP * 6} />
                            <SkeletonPill className="h-11 w-28 rounded-full" delay={WAVE_STEP * 7} />
                        </div>
                    </div>

                    {/* "Live Now" Grid Skeleton */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <SkeletonLine width={140} height={18} delay={WAVE_STEP * 4} />
                            <SkeletonLine width={60} height={12} delay={WAVE_STEP * 5} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <VideoCardSkeleton key={i} delay={i * WAVE_STEP + WAVE_STEP * 6} />
                            ))}
                        </div>
                    </div>

                    {/* "Trending Replays" Grid Skeleton */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <SkeletonLine width={180} height={18} delay={WAVE_STEP * 5} />
                                <SkeletonLine width={240} height={11} delay={WAVE_STEP * 6} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <VideoCardSkeleton key={i} delay={i * WAVE_STEP + WAVE_STEP * 7} />
                            ))}
                        </div>
                    </div>

                    {/* Categories Bento Grid Skeleton */}
                    <div className="space-y-4">
                        <SkeletonLine width={140} height={18} delay={WAVE_STEP * 8} />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonBlock key={i} className="h-24 w-full rounded-2xl" delay={i * WAVE_STEP + WAVE_STEP * 9} />
                            ))}
                        </div>
                    </div>
                </main>

                {/* Right Column: Live Chat & Roadmap */}
                <aside className="hidden xl:block w-80 shrink-0 space-y-6">
                    {/* Live Chat Box Skeleton */}
                    <div className="rounded-3xl border border-border/70 bg-card/60 p-4 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50">
                            <SkeletonLine width={100} height={16} delay={WAVE_STEP} />
                            <SkeletonPill className="h-5 w-16 rounded-full" delay={WAVE_STEP * 2} />
                        </div>
                        <div className="h-64 space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <SkeletonAvatar size={24} delay={i * WAVE_STEP + WAVE_STEP * 2} />
                                    <div className="flex-1 space-y-1">
                                        <SkeletonLine width="40%" height={10} delay={i * WAVE_STEP + WAVE_STEP * 3} />
                                        <SkeletonLine width="80%" height={10} delay={i * WAVE_STEP + WAVE_STEP * 4} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <SkeletonPill className="h-9 w-full rounded-full" delay={WAVE_STEP * 5} />
                    </div>

                    {/* Platform Features Card Skeleton */}
                    <div className="rounded-3xl border border-border/70 bg-card/60 p-5 space-y-4">
                        <SkeletonLine width={140} height={16} delay={WAVE_STEP * 6} />
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <SkeletonBlock className="h-8 w-8 rounded-xl shrink-0" delay={i * WAVE_STEP + WAVE_STEP * 7} />
                                    <div className="flex-1 space-y-1">
                                        <SkeletonLine width="50%" height={11} delay={i * WAVE_STEP + WAVE_STEP * 8} />
                                        <SkeletonLine width="70%" height={9} delay={i * WAVE_STEP + WAVE_STEP * 9} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

/** Mirrors the video / live player pages — player, title, byline. */
export function VideoPlayerSkeleton() {
    return (
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
            <SkeletonLine width={110} height={14} />
            <SkeletonBlock className="aspect-video w-full" delay={WAVE_STEP} />
            <SkeletonLine width="60%" height={20} delay={WAVE_STEP * 2} />
            <div className="flex items-center gap-3">
                <SkeletonAvatar size={40} delay={WAVE_STEP * 3} />
                <div className="space-y-1.5">
                    <SkeletonLine width={140} height={12} delay={WAVE_STEP * 3} />
                    <SkeletonLine width={90} height={10} delay={WAVE_STEP * 4} />
                </div>
            </div>
        </div>
    )
}
