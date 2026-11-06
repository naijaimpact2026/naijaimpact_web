import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonLine, WAVE_STEP } from './primitives'

/** Generic auth-page skeleton — split brand panel + form card, used for login/signup/reset. */
export default function AuthSkeleton() {
    return (
        <div className="min-h-screen w-full flex bg-background">
            <div
                className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
                style={{ background: 'linear-gradient(150deg, #0a1e33 0%, #102a43 55%, #00688a 130%)' }}
            >
                <div className="relative z-10 max-w-md px-10 space-y-5 w-full">
                    <Skeleton base="rgba(255,255,255,0.14)" className="w-14 h-14 rounded-2xl" />
                    <Skeleton base="rgba(255,255,255,0.14)" className="h-10 w-3/4 rounded-lg" delay={WAVE_STEP} />
                    <Skeleton base="rgba(255,255,255,0.14)" className="h-10 w-1/2 rounded-lg" delay={WAVE_STEP * 2} />
                    <div className="space-y-4 pt-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton base="rgba(255,255,255,0.14)" className="w-11 h-11 rounded-xl" delay={i * WAVE_STEP} />
                                <Skeleton base="rgba(255,255,255,0.14)" className="h-3 w-40 rounded-full" delay={i * WAVE_STEP} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm space-y-5">
                    <Skeleton className="w-12 h-12 rounded-2xl mx-auto lg:hidden" />
                    <div className="space-y-2 text-center">
                        <SkeletonLine width="60%" height={22} className="mx-auto" />
                        <SkeletonLine width="80%" height={12} className="mx-auto" delay={WAVE_STEP} />
                    </div>
                    <div className="space-y-4 pt-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="space-y-1.5">
                                <SkeletonLine width={70} height={9} delay={i * WAVE_STEP} />
                                <Skeleton className="h-11 w-full rounded-lg" delay={i * WAVE_STEP} />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-11 w-full rounded-lg" delay={WAVE_STEP * 3} />
                    <SkeletonLine width="50%" height={11} className="mx-auto" delay={WAVE_STEP * 4} />
                </div>
            </div>
        </div>
    )
}
