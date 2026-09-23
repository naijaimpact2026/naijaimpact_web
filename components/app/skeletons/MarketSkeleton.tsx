import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonBlock, SkeletonLine, WAVE_STEP } from './primitives'

const ON_DARK = 'rgba(255,255,255,0.16)'

/** Mirrors components/app/market/MarketHomeClient.tsx — hero, quick nav, category strip, listing grid + rail. */
export default function MarketSkeleton() {
    return (
        <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <section
                className="relative overflow-hidden rounded-3xl"
                style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}
            >
                <div className="grid grid-cols-1 items-center gap-6 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-3 max-w-lg">
                        <Skeleton base={ON_DARK} className="h-2.5 w-40 rounded-full" />
                        <Skeleton base={ON_DARK} className="h-8 w-72 rounded-lg" delay={WAVE_STEP} />
                        <Skeleton base={ON_DARK} className="h-3.5 w-56 rounded-full" delay={WAVE_STEP * 2} />
                        <Skeleton base="rgba(255,255,255,0.9)" className="h-11 w-full max-w-md rounded-2xl mt-4" delay={WAVE_STEP * 3} />
                        <Skeleton base={ON_DARK} className="h-9 w-28 rounded-2xl mt-2" delay={WAVE_STEP * 4} />
                    </div>
                    <SkeletonBlock base={ON_DARK} className="hidden w-full max-w-sm h-48 justify-self-end sm:block" delay={WAVE_STEP * 2} />
                </div>
            </section>

            <div className="grid grid-cols-4 gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-4">
                        <Skeleton className="h-9 w-9 rounded-xl" delay={i * WAVE_STEP} />
                        <SkeletonLine width="60%" height={9} delay={i * WAVE_STEP} />
                    </div>
                ))}
            </div>

            <section className="rounded-2xl border border-border bg-card p-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex w-20 shrink-0 flex-col items-center gap-1.5 px-2 py-2.5">
                            <Skeleton className="h-9 w-9 rounded-xl" delay={i * WAVE_STEP} />
                            <SkeletonLine width="70%" height={8} delay={i * WAVE_STEP} />
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
                <section>
                    <div className="mb-3 space-y-1.5">
                        <SkeletonLine width={160} height={16} />
                        <SkeletonLine width={80} height={10} delay={WAVE_STEP} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                                <Skeleton className="aspect-square w-full rounded-none" delay={i * WAVE_STEP} />
                                <div className="space-y-2 p-3">
                                    <SkeletonLine width="85%" height={11} delay={i * WAVE_STEP} />
                                    <SkeletonLine width="50%" height={11} delay={i * WAVE_STEP} />
                                    <SkeletonLine width="40%" height={13} delay={i * WAVE_STEP} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <aside className="space-y-4">
                    <SkeletonBlock className="h-32 w-full" />
                    <SkeletonBlock className="h-24 w-full" delay={WAVE_STEP} />
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <SkeletonLine width={100} height={13} className="mb-3" />
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <Skeleton className="w-8 h-8 rounded-full" delay={i * WAVE_STEP} />
                                    <SkeletonLine width="60%" height={10} delay={i * WAVE_STEP} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <SkeletonBlock className="h-24 w-full" delay={WAVE_STEP * 2} />
                </aside>
            </div>
        </div>
    )
}
