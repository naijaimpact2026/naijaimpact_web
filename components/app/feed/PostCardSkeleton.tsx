import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonAvatar, SkeletonLine, WAVE_STEP } from '@/components/app/skeletons/primitives'

// ─────────────────────────────────────────────────────────────────────────
// Previous implementation — flat animate-pulse blocks. Replaced with the
// shared shimmer-wave Skeleton primitive for a consistent feel with the
// rest of the app's loading states.
// ─────────────────────────────────────────────────────────────────────────
// export default function PostCardSkeleton() {
//   return (
//     <div className="bg-card rounded-2xl border border-border shadow-sm dark:shadow-none overflow-hidden animate-pulse">
//       <div className="flex items-center gap-3 px-4 pt-4 pb-3">
//         <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
//         <div className="flex-1 space-y-1.5">
//           <div className="h-3 w-32 bg-muted rounded-full" />
//           <div className="h-2.5 w-20 bg-muted rounded-full" />
//         </div>
//       </div>
//       <div className="px-4 pb-3 space-y-2">
//         <div className="h-3 w-full bg-muted rounded-full" />
//         <div className="h-3 w-4/5 bg-muted rounded-full" />
//         <div className="h-3 w-3/5 bg-muted rounded-full" />
//       </div>
//       <div className="mx-4 mb-3 h-48 bg-muted rounded-xl" />
//       <div className="h-px bg-border mx-4" />
//       <div className="flex items-center justify-around px-4 py-3 gap-2">
//         {[...Array(4)].map((_, i) => (
//           <div key={i} className="h-6 w-16 bg-muted rounded-full" />
//         ))}
//       </div>
//     </div>
//   )
// }

export default function PostCardSkeleton({ delay = 0 }: { delay?: number }) {
    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm dark:shadow-none overflow-hidden">
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <SkeletonAvatar size={40} delay={delay} />
                <div className="flex-1 space-y-1.5">
                    <SkeletonLine width={128} height={12} delay={delay} />
                    <SkeletonLine width={80} height={10} delay={delay + WAVE_STEP} />
                </div>
            </div>

            <div className="px-4 pb-3 space-y-2">
                <SkeletonLine width="100%" height={12} delay={delay} />
                <SkeletonLine width="80%" height={12} delay={delay + WAVE_STEP} />
                <SkeletonLine width="60%" height={12} delay={delay + WAVE_STEP * 2} />
            </div>

            <Skeleton className="mx-4 mb-3 h-48 rounded-xl" delay={delay + WAVE_STEP} style={{ width: 'calc(100% - 2rem)' }} />

            <div className="h-px bg-border mx-4" />

            <div className="flex items-center justify-around px-4 py-3 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16 rounded-full" delay={delay + i * WAVE_STEP} />
                ))}
            </div>
        </div>
    )
}
