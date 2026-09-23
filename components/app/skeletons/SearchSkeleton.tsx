import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonLine, WAVE_STEP } from './primitives'

const PILLS = ['All', 'People', 'Posts', 'Courses']

/** Mirrors app/app/search/page.tsx — heading, search input, category pills, result grid. */
export default function SearchSkeleton() {
    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0 space-y-5">
                    <div className="space-y-1.5">
                        <SkeletonLine width={100} height={26} />
                        <SkeletonLine width={280} height={12} delay={WAVE_STEP} />
                    </div>

                    <Skeleton className="h-12 w-full rounded-xl lg:hidden" />

                    <div className="flex gap-2">
                        {PILLS.map((label, i) => (
                            <Skeleton key={label} className="h-9 w-20 rounded-full" delay={i * WAVE_STEP} />
                        ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
                                <Skeleton className="h-24 w-full rounded-none" delay={i * WAVE_STEP} />
                                <div className="p-3 space-y-2">
                                    <SkeletonLine width="65%" height={12} delay={i * WAVE_STEP} />
                                    <SkeletonLine width="45%" height={10} delay={i * WAVE_STEP} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
