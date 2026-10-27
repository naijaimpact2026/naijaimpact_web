import NotificationSkeleton from '@/components/app/notifications/NotificationSkeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonLine, WAVE_STEP } from './primitives'

/** Mirrors app/app/notifications/page.tsx — header, notification list, preferences/summary rail. */
export default function NotificationsSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-4 sm:px-6">
                <div className="mx-auto max-w-6xl space-y-1.5">
                    <SkeletonLine width={150} height={20} />
                    <SkeletonLine width={260} height={12} delay={WAVE_STEP} />
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-0 py-6 sm:px-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <main className="min-w-0 overflow-hidden rounded-xl border border-border bg-background divide-y divide-border">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <NotificationSkeleton key={i} />
                        ))}
                    </main>

                    <aside className="hidden space-y-4 lg:block">
                        <div className="rounded-xl border border-border bg-background p-5">
                            <SkeletonLine width={140} height={13} className="mb-4" />
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <SkeletonLine width="60%" height={11} delay={i * WAVE_STEP} />
                                        <Skeleton className="h-5 w-9 rounded-full" delay={i * WAVE_STEP} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-background p-5">
                            <SkeletonLine width={120} height={13} className="mb-3" />
                            <div className="flex gap-4">
                                <SkeletonLine width={50} height={24} />
                                <SkeletonLine width={50} height={24} delay={WAVE_STEP} />
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-background p-5 space-y-2">
                            <SkeletonLine width={110} height={13} />
                            <SkeletonLine width="100%" height={11} delay={WAVE_STEP} />
                            <SkeletonLine width="80%" height={11} delay={WAVE_STEP * 2} />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
