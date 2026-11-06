import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonLine, WAVE_STEP } from './primitives'

const ON_DARK = 'rgba(255,255,255,0.14)'

/** Mirrors app/app/fintech/page.tsx — dark green hero+stats, 5-col quick access, product detail cards. */
export default function FintechSkeleton() {
    return (
        <>
            <div
                className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}
            >
                <div className="relative z-10 px-5 pt-7 pb-8 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-5">
                        <div className="space-y-1.5">
                            <Skeleton base={ON_DARK} className="h-2.5 w-16 rounded-full" />
                            <Skeleton base={ON_DARK} className="h-7 w-40 rounded-lg" delay={WAVE_STEP} />
                            <Skeleton base={ON_DARK} className="h-3 w-44 rounded-full" delay={WAVE_STEP * 2} />
                        </div>
                        <Skeleton base={ON_DARK} className="w-12 h-12 rounded-2xl" delay={WAVE_STEP * 3} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-1.5">
                                <Skeleton base={ON_DARK} className="h-7 w-20 rounded-lg" delay={i * WAVE_STEP} />
                                <Skeleton base={ON_DARK} className="h-2.5 w-16 rounded-full" delay={i * WAVE_STEP} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-4 py-5 max-w-5xl mx-auto space-y-5">
                <section>
                    <SkeletonLine width={90} height={10} className="mb-3" />
                    <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl bg-card border border-border">
                                <Skeleton className="w-12 h-12 rounded-2xl" delay={i * WAVE_STEP} />
                                <SkeletonLine width="80%" height={8} delay={i * WAVE_STEP} />
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <SkeletonLine width={100} height={10} className="mb-3" />
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-card rounded-3xl border border-border overflow-hidden">
                                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-10 h-10 rounded-2xl" delay={i * WAVE_STEP} />
                                        <div className="space-y-1.5">
                                            <SkeletonLine width={90} height={12} delay={i * WAVE_STEP} />
                                            <SkeletonLine width={110} height={9} delay={i * WAVE_STEP} />
                                        </div>
                                    </div>
                                    <Skeleton className="h-7 w-16 rounded-xl" delay={i * WAVE_STEP} />
                                </div>
                                <div className="px-5 py-4 grid grid-cols-3 gap-4">
                                    {Array.from({ length: 3 }).map((_, j) => (
                                        <div key={j} className="space-y-1.5">
                                            <SkeletonLine width={50} height={16} delay={i * WAVE_STEP + j * 20} />
                                            <SkeletonLine width={70} height={9} delay={i * WAVE_STEP + j * 20} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    )
}
