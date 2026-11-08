import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonLine, WAVE_STEP } from './primitives'

const ON_PRIMARY = 'rgba(255,255,255,0.16)'

/** Mirrors components/app/wallet/WalletPanel.tsx: full-width page, balance card left, transactions right on desktop. */
export default function WalletSkeleton() {
    return (
        <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <SkeletonLine width={110} height={22} />

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="space-y-4 rounded-3xl bg-primary p-5 sm:p-6">
                    <Skeleton base={ON_PRIMARY} className="h-3.5 w-28 rounded-full" />
                    <Skeleton base={ON_PRIMARY} className="h-10 w-52 rounded-lg" delay={WAVE_STEP} />
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} base={ON_PRIMARY} className="h-12 w-full rounded-2xl" delay={(i + 2) * WAVE_STEP} />
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <SkeletonLine width={100} height={12} />
                        <Skeleton className="h-7 w-44 rounded-xl" />
                    </div>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
                            <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" delay={i * WAVE_STEP} />
                            <div className="flex-1 space-y-1.5">
                                <SkeletonLine width={130} height={10} />
                                <SkeletonLine width={90} height={8} />
                            </div>
                            <SkeletonLine width={70} height={10} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
