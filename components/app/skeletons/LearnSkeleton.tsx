import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonBlock, SkeletonLine, WAVE_STEP } from './primitives'

const TABS = ['All Courses', 'My Learning', 'Career Tracks', 'Categories', 'Certificates', 'Instructors', 'My Streak']

/** Mirrors components/app/learn/LearnHubHome.tsx — hero+stats, tabs, search, course grid + right rail. */
export default function LearnSkeleton() {
    return (
        <div>
            
            {/* Hero and learning statistics skeleton */}
            <section className="relative isolate mb-6 min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#061525] text-white sm:min-h-[340px]">
                <div
                    className="absolute inset-0 -z-10 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/learn-dashboard-hero.png')",
                    }}
                />

                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#061525]/95 via-[#061525]/85 to-[#061525]/65" />

                <div className="relative grid min-h-[320px] items-center gap-7 p-5 sm:min-h-[340px] sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-9">
                    {/* Greeting, heading, description and actions */}
                    <div className="min-w-0 space-y-4">
                        <SkeletonLine
                            width={135}
                            height={12}
                            base="bg-white/15"
                        />

                        <div className="space-y-3">
                            <SkeletonLine
                                width="min(100%, 310px)"
                                height={38}
                                base="bg-white/20"
                            />
                            <SkeletonLine
                                width="min(80%, 245px)"
                                height={30}
                                base="bg-blue-400/25"
                            />
                        </div>

                        <div className="space-y-2 pt-1">
                            <SkeletonLine
                                width="min(100%, 390px)"
                                height={11}
                                base="bg-white/15"
                            />
                            <SkeletonLine
                                width="min(82%, 320px)"
                                height={11}
                                base="bg-white/15"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <SkeletonBlock
                                className="h-11 w-36 rounded-xl"
                                base="bg-blue-500/30"
                            />
                            <SkeletonBlock
                                className="h-11 w-32 rounded-xl"
                                base="bg-white/10"
                            />
                        </div>
                    </div>

                    {/* Learning overview */}
                    <div className="rounded-2xl border border-white/10 bg-[#061525]/80 p-4 shadow-2xl backdrop-blur-md sm:p-5">
                        <SkeletonLine
                            width={175}
                            height={10}
                            base="bg-blue-200/20"
                            className="mb-4"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'courses', icon: 'bg-emerald-400/25' },
                                { key: 'certificates', icon: 'bg-violet-400/25' },
                                { key: 'streak', icon: 'bg-orange-400/25' },
                                { key: 'hours', icon: 'bg-sky-400/25' },
                            ].map((stat, index) => (
                                <div
                                    key={stat.key}
                                    className="min-h-[112px] rounded-xl border border-white/10 bg-white/[0.04] p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <SkeletonBlock
                                            className={`h-8 w-8 rounded-lg ${stat.icon}`}
                                            base="bg-white/10"
                                            delay={index * WAVE_STEP}
                                        />
                                        <SkeletonBlock
                                            className="h-5 w-5 rounded-full"
                                            base="bg-white/10"
                                            delay={index * WAVE_STEP}
                                        />
                                    </div>

                                    <SkeletonLine
                                        width={44}
                                        height={22}
                                        base="bg-white/20"
                                        className="mt-3"
                                        delay={index * WAVE_STEP}
                                    />

                                    <SkeletonLine
                                        width="85%"
                                        height={9}
                                        base="bg-white/10"
                                        className="mt-2"
                                        delay={index * WAVE_STEP}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            <main className="min-h-screen bg-[#061525] px-4 py-8 text-white sm:px-6 lg:px-8">
                <div className="flex gap-6 items-start">
                    <div className="flex-1 min-w-0">
                        <div className="mb-8 flex gap-4 overflow-x-auto border-b border-border pb-3">
                            {TABS.map((label, i) => (
                                <SkeletonLine key={label} width={label.length * 6.5} height={12} delay={i * WAVE_STEP} />
                            ))}
                        </div>


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
                                <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-[#081b2f]">
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
