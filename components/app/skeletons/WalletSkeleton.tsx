import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonLine, WAVE_STEP } from './primitives'

const ON_DARK = 'rgba(255,255,255,0.14)'

/** Mirrors components/app/wallet/WalletPanel.tsx — dark green balance hero + light content section. */
export default function WalletSkeleton() {
    return (
        <>
            <div
                className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}
            >
                <div className="relative z-10 px-5 pt-6 pb-8 max-w-2xl mx-auto space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <Skeleton base={ON_DARK} className="h-2.5 w-28 rounded-full" />
                            <Skeleton base={ON_DARK} className="h-3.5 w-24 rounded-full" delay={WAVE_STEP} />
                        </div>
                        <Skeleton base={ON_DARK} className="w-9 h-9 rounded-2xl" delay={WAVE_STEP * 2} />
                    </div>

                    <div className="space-y-2">
                        <Skeleton base={ON_DARK} className="h-3 w-24 rounded-full" />
                        <Skeleton base={ON_DARK} className="h-10 w-48 rounded-lg" delay={WAVE_STEP} />
                    </div>

                    <Skeleton base="rgba(255,255,255,0.18)" className="h-16 w-full rounded-2xl" delay={WAVE_STEP * 2} />

                    <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} base={ON_DARK} className="h-12 w-full rounded-2xl" delay={i * WAVE_STEP} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#f0f2f5] dark:bg-muted px-4 py-5 max-w-2xl mx-auto space-y-5">
                <section>
                    <SkeletonLine width={110} height={10} className="mb-3" />
                    <div className="grid grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <Skeleton className="w-11 h-11 rounded-2xl" delay={i * WAVE_STEP} />
                                <SkeletonLine width="80%" height={8} delay={i * WAVE_STEP} />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border">
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
                        <div className="space-y-1.5">
                            <SkeletonLine width={150} height={14} />
                            <SkeletonLine width={100} height={10} delay={WAVE_STEP} />
                        </div>
                        <SkeletonLine width={50} height={10} />
                    </div>
                    <div className="divide-y divide-border">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                                <Skeleton className="w-9 h-9 rounded-full shrink-0" delay={i * WAVE_STEP} />
                                <div className="flex-1 space-y-1.5">
                                    <SkeletonLine width="55%" height={11} delay={i * WAVE_STEP} />
                                    <SkeletonLine width="35%" height={9} delay={i * WAVE_STEP} />
                                </div>
                                <SkeletonLine width={50} height={11} delay={i * WAVE_STEP} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    )
}
