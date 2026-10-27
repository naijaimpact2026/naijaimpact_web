import { Skeleton } from '@/components/ui/skeleton'
import PostCardSkeleton from '@/components/app/feed/PostCardSkeleton'
import { SkeletonBlock, SkeletonLine, WAVE_STEP } from './primitives'

/** Mirrors app/app/feed/page.tsx — hero + 3-column (discover rail / posts / trending rail). */
export default function FeedSkeleton() {
    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
            <section className="relative overflow-hidden rounded-3xl border border-border px-6 py-7 sm:px-9 sm:py-8 bg-card">
                <div className="flex items-center justify-between gap-8">
                    <div className="max-w-md w-full space-y-3">
                        <SkeletonLine width={90} height={10} />
                        <SkeletonLine width="95%" height={24} delay={WAVE_STEP} />
                        <SkeletonLine width="70%" height={13} delay={WAVE_STEP * 2} />
                    </div>
                    <SkeletonBlock className="hidden md:block w-52 h-40 shrink-0" delay={WAVE_STEP * 2} />
                </div>
            </section>

            <div className="flex gap-6 items-start">
                {/* Discover rail */}
                <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
                    <div className="rounded-2xl bg-card border border-border p-4">
                        <SkeletonLine width={140} height={13} className="mb-3" />
                        <div className="space-y-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <Skeleton delay={i * WAVE_STEP} className="w-8 h-8 rounded-lg" />
                                    <SkeletonLine width="65%" height={11} delay={i * WAVE_STEP} />
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Posts */}
                <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <PostCardSkeleton key={i} delay={i * 100} />
                    ))}
                </div>

                {/* Trending rail */}
                <aside className="hidden xl:flex flex-col gap-4 w-72 shrink-0">
                    <div className="rounded-2xl bg-card border border-border p-4">
                        <SkeletonLine width={110} height={13} className="mb-3" />
                        <div className="space-y-2.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <SkeletonLine width={12} height={12} delay={i * WAVE_STEP} />
                                    <div className="flex-1 space-y-1">
                                        <SkeletonLine width="60%" height={11} delay={i * WAVE_STEP} />
                                        <SkeletonLine width="35%" height={9} delay={i * WAVE_STEP} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <SkeletonBlock className="h-24 w-full" />
                    <SkeletonBlock className="h-28 w-full" delay={WAVE_STEP} />
                </aside>
            </div>
        </div>
    )
}
