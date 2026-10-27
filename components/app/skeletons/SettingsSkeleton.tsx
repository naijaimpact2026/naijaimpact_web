import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonAvatar, SkeletonLine, WAVE_STEP } from './primitives'

const TABS = ['Profile', 'Security', 'Privacy', 'Alerts', 'Theme', 'Danger']

/** Mirrors app/app/settings/page.tsx + SettingsTabs — header, tab strip, profile form fields. */
export default function SettingsSkeleton() {
    return (
        <div className="container-gutter max-w-2xl mx-auto py-8 space-y-6">
            <div className="space-y-2">
                <SkeletonLine width={110} height={22} />
                <SkeletonLine width={280} height={12} delay={WAVE_STEP} />
            </div>

            <div className="grid grid-cols-6 gap-2">
                {TABS.map((label, i) => (
                    <Skeleton key={label} className="h-9 w-full rounded-md" delay={i * WAVE_STEP} />
                ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
                <div className="flex items-center gap-4">
                    <SkeletonAvatar size={72} />
                    <Skeleton className="h-9 w-28 rounded-md" delay={WAVE_STEP} />
                </div>

                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <SkeletonLine width={90} height={10} delay={i * WAVE_STEP} />
                        <Skeleton className="h-10 w-full rounded-md" delay={i * WAVE_STEP} />
                    </div>
                ))}

                <div className="space-y-2">
                    <SkeletonLine width={90} height={10} />
                    <Skeleton className="h-20 w-full rounded-md" delay={WAVE_STEP} />
                </div>

                <Skeleton className="h-10 w-32 rounded-md" />
            </div>
        </div>
    )
}
