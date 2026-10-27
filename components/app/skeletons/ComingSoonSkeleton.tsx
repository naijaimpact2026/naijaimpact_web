import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonLine, WAVE_STEP } from './primitives'

/**
 * Mirrors the centered "Coming Soon" placeholder shared by
 * app/app/funding/page.tsx and components/app/services/BusinessLaunchHome.tsx —
 * both currently render an icon + heading + copy + status pill, no data grid.
 */
export default function ComingSoonSkeleton() {
    return (
        <main className="min-h-screen bg-background">
            <div className="flex min-h-screen items-center justify-center px-6">
                <div className="w-full max-w-lg text-center flex flex-col items-center">
                    <Skeleton className="mb-8 h-28 w-28 rounded-full" />
                    <SkeletonLine width="80%" height={30} />
                    <SkeletonLine width="60%" height={30} className="mt-2" delay={WAVE_STEP} />
                    <div className="mt-5 w-full space-y-2 flex flex-col items-center">
                        <SkeletonLine width="90%" height={12} delay={WAVE_STEP * 2} />
                        <SkeletonLine width="75%" height={12} delay={WAVE_STEP * 3} />
                    </div>
                    <Skeleton className="mt-8 h-9 w-32 rounded-full" delay={WAVE_STEP * 4} />
                </div>
            </div>
        </main>
    )
}
