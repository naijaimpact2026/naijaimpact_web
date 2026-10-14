import { SkeletonAvatar, SkeletonBlock, SkeletonLine, SkeletonPill, WAVE_STEP } from './primitives'

function VideoCardSkeleton({ delay }: { delay: number })
{
    return (
        <div>
            <SkeletonBlock delay={delay} className="aspect-video w-full" />
            <SkeletonLine width="85%" height={13} className="mt-3" delay={delay + WAVE_STEP} />
            <div className="flex items-center gap-2.5 mt-3">
                <SkeletonAvatar size={32} delay={delay + WAVE_STEP * 2} />
                <div className="flex-1 space-y-1.5">
                    <SkeletonLine width="50%" height={10} delay={delay + WAVE_STEP * 2} />
                    <SkeletonLine width="30%" height={9} delay={delay + WAVE_STEP * 3} />
                </div>
            </div>
        </div>
    )
}

/** Mirrors app/app/modushive/page.tsx — header row + video grid. */
export default function ModusHiveSkeleton()
{
    return (
        <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-11 w-11" />
                    <div className="space-y-2">
                        <SkeletonLine width={140} height={18} delay={WAVE_STEP} />
                        <SkeletonLine width={240} height={11} delay={WAVE_STEP * 2} />
                    </div>
                </div>
                <SkeletonPill className="h-9 w-28" delay={WAVE_STEP * 3} />
            </div>

            <div className="space-y-3">
                <SkeletonLine width={120} height={14} />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-6">
                    {Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} delay={i * WAVE_STEP} />)}
                </div>
            </div>
        </div>
    )
}

/** Mirrors the video / live player pages — player, title, byline. */
export function VideoPlayerSkeleton()
{
    return (
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
            <SkeletonLine width={110} height={14} />
            <SkeletonBlock className="aspect-video w-full" delay={WAVE_STEP} />
            <SkeletonLine width="60%" height={20} delay={WAVE_STEP * 2} />
            <div className="flex items-center gap-3">
                <SkeletonAvatar size={40} delay={WAVE_STEP * 3} />
                <div className="space-y-1.5">
                    <SkeletonLine width={140} height={12} delay={WAVE_STEP * 3} />
                    <SkeletonLine width={90} height={10} delay={WAVE_STEP * 4} />
                </div>
            </div>
            <SkeletonBlock className="h-20 w-full" delay={WAVE_STEP * 5} />
        </div>
    )
}
