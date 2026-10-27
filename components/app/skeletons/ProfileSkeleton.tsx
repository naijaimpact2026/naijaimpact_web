import { Skeleton } from '@/components/ui/skeleton'
import PostCardSkeleton from '@/components/app/feed/PostCardSkeleton'
import { SkeletonAvatar, SkeletonBlock, SkeletonLine, WAVE_STEP } from './primitives'

/** Mirrors app/app/profile/[username]/page.tsx — cover/avatar header + 3-col (about / tabs+posts / stats). */
export default function ProfileSkeleton() {
    return (
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <Skeleton className="h-32 sm:h-40 w-full rounded-none" />
                <div className="px-4 sm:px-6 pb-5">
                    <div className="-mt-10 flex items-end justify-between">
                        <SkeletonAvatar size={88} className="ring-4 ring-card" />
                        <Skeleton className="h-9 w-28 rounded-full mb-1" delay={WAVE_STEP} />
                    </div>
                    <div className="mt-3 space-y-2">
                        <SkeletonLine width={160} height={18} />
                        <SkeletonLine width={100} height={12} delay={WAVE_STEP} />
                        <SkeletonLine width="70%" height={12} delay={WAVE_STEP * 2} />
                    </div>
                    <div className="flex gap-4 mt-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <SkeletonLine key={i} width={70} height={12} delay={i * WAVE_STEP} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_280px] gap-5 items-start">
                <div className="hidden lg:flex flex-col gap-4">
                    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                        <SkeletonLine width={100} height={13} />
                        <SkeletonLine width="100%" height={11} delay={WAVE_STEP} />
                        <SkeletonLine width="80%" height={11} delay={WAVE_STEP * 2} />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-6 w-16 rounded-full" delay={i * WAVE_STEP} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="flex gap-4 border-b border-border px-4">
                        {['Posts', 'About', 'Impact'].map((label, i) => (
                            <div key={label} className="py-3">
                                <SkeletonLine width={label.length * 6.5} height={11} delay={i * WAVE_STEP} />
                            </div>
                        ))}
                    </div>
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <PostCardSkeleton key={i} delay={i * 100} />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <SkeletonBlock className="h-28 w-full" />
                    <SkeletonBlock className="h-20 w-full" delay={WAVE_STEP} />
                    <SkeletonBlock className="h-16 w-full" delay={WAVE_STEP * 2} />
                </div>
            </div>
        </main>
    )
}
