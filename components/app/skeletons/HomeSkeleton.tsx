import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonAvatar, SkeletonBlock, SkeletonCard, SkeletonLine, WAVE_STEP } from './primitives'

/** Mirrors app/app/page.tsx — hero, quick actions row, today/opportunity grids + right rail. */
export default function HomeSkeleton() {
    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
            <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0 space-y-6">
                    {/* Welcome hero */}
                    <section className="relative overflow-hidden rounded-3xl border border-border px-6 py-8 sm:px-10 sm:py-10 bg-card">
                        <div className="flex items-center justify-between gap-8">
                            <div className="max-w-sm w-full space-y-3">
                                <SkeletonLine width="90%" height={26} />
                                <SkeletonLine width="60%" height={16} delay={WAVE_STEP} />
                                <SkeletonLine width="75%" height={13} delay={WAVE_STEP * 2} />
                                <div className="flex gap-3 pt-3">
                                    <Skeleton className="h-10 w-40 rounded-full" delay={WAVE_STEP * 3} />
                                    <Skeleton className="h-10 w-32 rounded-full" delay={WAVE_STEP * 4} />
                                </div>
                            </div>
                            <SkeletonBlock className="hidden md:block w-72 h-56 shrink-0" delay={WAVE_STEP * 2} />
                        </div>
                    </section>

                    {/* Quick actions row */}
                    <section className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <Skeleton delay={i * WAVE_STEP} className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl" />
                                <SkeletonLine width="80%" height={8} delay={i * WAVE_STEP} />
                            </div>
                        ))}
                    </section>

                    {/* Today cards */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <SkeletonLine width={180} height={18} />
                            <SkeletonLine width={50} height={12} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={i} className="flex flex-col gap-3" delay={i * WAVE_STEP}>
                                    <Skeleton delay={i * WAVE_STEP} className="w-10 h-10 rounded-xl" />
                                    <SkeletonLine width="80%" height={13} delay={i * WAVE_STEP} />
                                    <SkeletonLine width="60%" height={11} delay={i * WAVE_STEP} />
                                </SkeletonCard>
                            ))}
                        </div>
                    </section>

                    {/* Featured opportunities */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <SkeletonLine width={200} height={18} />
                            <SkeletonLine width={50} height={12} />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                                    <Skeleton delay={i * WAVE_STEP} className="h-32 w-full rounded-none" />
                                    <div className="p-4 space-y-2">
                                        <SkeletonLine width="70%" height={14} delay={i * WAVE_STEP} />
                                        <SkeletonLine width="90%" height={11} delay={i * WAVE_STEP} />
                                        <Skeleton className="h-8 w-full rounded-full mt-3" delay={i * WAVE_STEP} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <HomeRightRailSkeleton />
            </div>
        </div>
    )
}

export function HomeRightRailSkeleton() {
    return (
        <aside className="hidden xl:flex flex-col gap-4 w-80 shrink-0 pt-2">
            <div className="rounded-2xl bg-card border border-border p-4">
                <div className="flex items-center gap-3">
                    <SkeletonAvatar size={44} />
                    <div className="flex-1 space-y-1.5">
                        <SkeletonLine width="50%" height={9} />
                        <SkeletonLine width="70%" height={13} delay={WAVE_STEP} />
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <SkeletonLine width={24} height={13} delay={i * WAVE_STEP} />
                            <SkeletonLine width="80%" height={8} delay={i * WAVE_STEP} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-4">
                <SkeletonLine width={100} height={13} className="mb-3" />
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <Skeleton delay={i * WAVE_STEP} className="w-8 h-8 rounded-lg" />
                            <SkeletonLine width="70%" height={11} delay={i * WAVE_STEP} />
                        </div>
                    ))}
                </div>
            </div>

            <SkeletonBlock className="h-28 w-full" />

            <div className="rounded-2xl bg-card border border-border p-4">
                <SkeletonLine width={110} height={13} className="mb-3" />
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <Skeleton delay={i * WAVE_STEP} className="w-7 h-7 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <SkeletonLine width="90%" height={10} delay={i * WAVE_STEP} />
                                <SkeletonLine width="35%" height={8} delay={i * WAVE_STEP} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    )
}
