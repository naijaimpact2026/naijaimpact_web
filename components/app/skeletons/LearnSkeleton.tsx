import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonBlock, SkeletonLine, WAVE_STEP } from './primitives'

const TABS = ['All Courses', 'My Learning', 'Career Tracks', 'Categories', 'Certificates', 'Instructors', 'My Streak']

/** Mirrors components/app/learn/LearnHubHome.tsx — hero+stats, tabs, search, course grid + right rail. */
export default function LearnSkeleton() {
    return (
        <div>
            <section className="border-b border-border bg-card">
                <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
                    <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
                        <div className="max-w-3xl space-y-4">
                            <Skeleton className="h-7 w-52 rounded-full" />
                            <SkeletonLine width="85%" height={32} delay={WAVE_STEP} />
                            <SkeletonLine width="60%" height={16} delay={WAVE_STEP * 2} />
                            <div className="flex gap-3 pt-3">
                                <Skeleton className="h-11 w-40 rounded-lg" delay={WAVE_STEP * 3} />
                                <Skeleton className="h-11 w-36 rounded-lg" delay={WAVE_STEP * 4} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <SkeletonBlock className="h-28 w-full" />
                            <SkeletonBlock className="h-28 w-full" delay={WAVE_STEP} />
                            <SkeletonBlock className="col-span-2 h-14 w-full" delay={WAVE_STEP * 2} />
                        </div>
                    </div>
                </div>
            </section>

            <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex gap-6 items-start">
                    <div className="flex-1 min-w-0">
                        <div className="mb-8 flex gap-4 overflow-x-auto border-b border-border pb-3">
                            {TABS.map((label, i) => (
                                <SkeletonLine key={label} width={label.length * 6.5} height={12} delay={i * WAVE_STEP} />
                            ))}
                        </div>

                        <Skeleton className="h-10 w-full max-w-md rounded-lg mb-8" />

                        <div className="flex items-end justify-between gap-4 mb-6">
                            <div className="space-y-2">
                                <SkeletonLine width={140} height={10} />
                                <SkeletonLine width={200} height={22} delay={WAVE_STEP} />
                            </div>
                        </div>

                        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" delay={i * WAVE_STEP} />
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                                    <Skeleton className="h-36 w-full rounded-none" delay={i * WAVE_STEP} />
                                    <div className="p-4 space-y-2">
                                        <SkeletonLine width={60} height={9} delay={i * WAVE_STEP} />
                                        <SkeletonLine width="90%" height={14} delay={i * WAVE_STEP} />
                                        <SkeletonLine width="70%" height={11} delay={i * WAVE_STEP} />
                                        <div className="flex items-center gap-2 pt-2">
                                            <Skeleton className="w-6 h-6 rounded-full" delay={i * WAVE_STEP} />
                                            <SkeletonLine width={60} height={9} delay={i * WAVE_STEP} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
                        <div className="rounded-2xl bg-card border border-border p-4">
                            <div className="flex items-center justify-between mb-3">
                                <SkeletonLine width={140} height={13} />
                                <SkeletonLine width={40} height={10} />
                            </div>
                            <SkeletonLine width="100%" height={11} />
                            <SkeletonLine width="70%" height={11} className="mt-1.5" delay={WAVE_STEP} />
                            <Skeleton className="h-8 w-32 rounded-full mt-3" delay={WAVE_STEP * 2} />
                        </div>

                        <div className="rounded-2xl bg-card border border-border p-4">
                            <div className="flex items-center justify-between mb-3">
                                <SkeletonLine width={140} height={13} />
                                <SkeletonLine width={40} height={10} />
                            </div>
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <Skeleton className="w-9 h-9 rounded-lg" delay={i * WAVE_STEP} />
                                        <div className="flex-1 space-y-1">
                                            <SkeletonLine width="80%" height={10} delay={i * WAVE_STEP} />
                                            <SkeletonLine width="50%" height={9} delay={i * WAVE_STEP} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    )
}
