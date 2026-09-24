import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonAvatar, SkeletonLine, WAVE_STEP } from './primitives'

/** Mirrors app/app/chat/page.tsx — header, search, tabs, conversation list rows. */
export default function ChatSkeleton() {
    return (
        <div className="flex flex-col bg-card" style={{ height: 'calc(100dvh - 4rem)' }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
                <div className="space-y-1.5">
                    <SkeletonLine width={90} height={16} />
                    <SkeletonLine width={140} height={10} delay={WAVE_STEP} />
                </div>
                <Skeleton className="h-9 w-9 rounded-full" delay={WAVE_STEP * 2} />
            </div>

            <div className="px-4 py-3 border-b border-border">
                <Skeleton className="h-10 w-full rounded-xl" />
            </div>

            <div className="flex items-center gap-6 px-4 border-b border-border">
                {['Chats', 'Following', 'Suggested'].map((label, i) => (
                    <div key={label} className="py-3">
                        <SkeletonLine width={label.length * 6} height={11} delay={i * WAVE_STEP} />
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-hidden">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                        <SkeletonAvatar size={48} delay={i * WAVE_STEP} />
                        <div className="flex-1 space-y-2">
                            <SkeletonLine width="45%" height={12} delay={i * WAVE_STEP} />
                            <SkeletonLine width="70%" height={10} delay={i * WAVE_STEP} />
                        </div>
                        <SkeletonLine width={30} height={9} delay={i * WAVE_STEP} />
                    </div>
                ))}
            </div>
        </div>
    )
}
