import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
    SkeletonBlock,
    SkeletonCard,
    SkeletonLine,
    WAVE_STEP,
} from './primitives'

export default function BusinessLaunchpadSkeleton()
{
    return (
        <div className="w-full min-h-[calc(100dvh-4rem)] bg-background text-foreground pb-12 overflow-x-hidden">
            <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
                {/* ── 1. Hero Banner Skeleton ── */}
                <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 lg:p-10 shadow-xs">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        {/* Left Column: Headlines & CTA */}
                        <div className="flex-1 max-w-xl w-full space-y-3">
                            <Skeleton className="h-6 w-36 rounded-full" />
                            <SkeletonLine width="80%" height={38} delay={WAVE_STEP} className="rounded-xl" />
                            <SkeletonLine width="55%" height={24} delay={WAVE_STEP * 2} className="rounded-lg mt-1" />
                            <div className="space-y-2 pt-2">
                                <SkeletonLine width="95%" height={14} delay={WAVE_STEP * 3} />
                                <SkeletonLine width="85%" height={14} delay={WAVE_STEP * 4} />
                            </div>
                            <div className="pt-4">
                                <Skeleton className="h-12 w-56 rounded-xl shadow-xs" delay={WAVE_STEP * 5} />
                            </div>
                        </div>

                        {/* Right Column: Hero Photo Placeholder */}
                        <div className="shrink-0 w-full sm:w-auto flex justify-center lg:justify-end">
                            <SkeletonBlock
                                className="w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-2xl"
                                delay={WAVE_STEP * 3}
                            />
                        </div>
                    </div>

                    {/* Bottom 4 Value Proposition Chips */}
                    <div className="mt-8 pt-4 border-t border-border/70 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                                <Skeleton className="w-6 h-6 rounded-full shrink-0" delay={i * WAVE_STEP} />
                                <SkeletonLine width="75%" height={12} delay={i * WAVE_STEP} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 2. Main 2-Column Grid (Feed + Sidebar Rail) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px] gap-6 items-start">
                    {/* ── LEFT / MAIN COLUMN ── */}
                    <div className="min-w-0 space-y-6">
                        {/* 5-Stage Lifecycle Stepper */}
                        <section className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                            <div className="flex items-center justify-between gap-3 overflow-x-hidden">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <React.Fragment key={i}>
                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <Skeleton className="w-8 h-8 rounded-full shrink-0" delay={i * WAVE_STEP} />
                                            <div className="space-y-1.5 hidden sm:block">
                                                <SkeletonLine width={55} height={12} delay={i * WAVE_STEP} />
                                                <SkeletonLine width={75} height={9} delay={i * WAVE_STEP} />
                                            </div>
                                        </div>
                                        {i < 4 && <Skeleton className="hidden sm:block flex-1 h-[2px] min-w-3" delay={i * WAVE_STEP} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </section>

                        {/* 5 Core Action Cards */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonCard key={i} className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl h-36" delay={i * WAVE_STEP}>
                                    <Skeleton className="w-10 h-10 rounded-xl" delay={i * WAVE_STEP} />
                                    <div className="space-y-2 mt-auto">
                                        <SkeletonLine width="80%" height={14} delay={i * WAVE_STEP} />
                                        <SkeletonLine width="60%" height={10} delay={i * WAVE_STEP} />
                                    </div>
                                </SkeletonCard>
                            ))}
                        </section>

                        {/* Business Templates Section */}
                        <section className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <SkeletonLine width={160} height={18} />
                                <SkeletonLine width={45} height={12} />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex flex-col items-center justify-between p-4 rounded-2xl border border-border/60 bg-muted/20 text-center gap-3">
                                        <Skeleton className="w-12 h-12 rounded-2xl" delay={i * WAVE_STEP} />
                                        <SkeletonLine width="85%" height={12} delay={i * WAVE_STEP} />
                                        <Skeleton className="h-7 w-full rounded-xl" delay={i * WAVE_STEP} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Tools & Resources Section */}
                        <section className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <SkeletonLine width={150} height={18} />
                                <SkeletonLine width={45} height={12} />
                            </div>
                            <div className="divide-y divide-border/60">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between py-2.5 px-1">
                                        <div className="flex items-center gap-3 w-3/4">
                                            <Skeleton className="w-7 h-7 rounded-lg shrink-0" delay={i * WAVE_STEP} />
                                            <SkeletonLine width="70%" height={13} delay={i * WAVE_STEP} />
                                        </div>
                                        <Skeleton className="w-4 h-4 rounded-md" delay={i * WAVE_STEP} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Featured Business Sectors */}
                        <section className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <SkeletonLine width={190} height={18} />
                                <SkeletonLine width={45} height={12} />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <SkeletonBlock className="w-full aspect-4/3 rounded-xl" delay={i * WAVE_STEP} />
                                        <SkeletonLine width="70%" height={11} delay={i * WAVE_STEP} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Bottom Banner Skeleton */}
                        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="w-full sm:max-w-md space-y-2">
                                <Skeleton className="h-5 w-40 rounded-full" />
                                <SkeletonLine width="90%" height={18} delay={WAVE_STEP} />
                                <SkeletonLine width="75%" height={12} delay={WAVE_STEP * 2} />
                            </div>
                            <Skeleton className="h-10 w-32 rounded-xl shrink-0" delay={WAVE_STEP * 3} />
                        </section>
                    </div>

                    {/* ── RIGHT COLUMN / SIDEBAR RAIL ── */}
                    <div className="w-full space-y-5">
                        {/* 1. Your Business Journey Tracker */}
                        <section className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <SkeletonLine width={150} height={16} />
                                <SkeletonLine width={45} height={12} />
                            </div>
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-24 h-24 rounded-full shrink-0" delay={WAVE_STEP} />
                                <div className="space-y-2 flex-1 min-w-0">
                                    <SkeletonLine width="60%" height={14} delay={WAVE_STEP * 2} />
                                    <SkeletonLine width="90%" height={11} delay={WAVE_STEP * 3} />
                                    <Skeleton className="h-8 w-full rounded-xl mt-2" delay={WAVE_STEP * 4} />
                                </div>
                            </div>
                            <div className="space-y-2.5 pt-3 border-t border-border/60">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <Skeleton className="w-4 h-4 rounded-full shrink-0" delay={i * WAVE_STEP} />
                                        <SkeletonLine width="75%" height={12} delay={i * WAVE_STEP} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 2. Funding Opportunities */}
                        <section className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <SkeletonLine width={160} height={16} />
                                <SkeletonLine width={45} height={12} />
                            </div>
                            <div className="space-y-2.5">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <Skeleton className="w-8 h-8 rounded-xl shrink-0" delay={i * WAVE_STEP} />
                                            <div className="space-y-1.5 min-w-0 flex-1">
                                                <SkeletonLine width="80%" height={12} delay={i * WAVE_STEP} />
                                                <SkeletonLine width="60%" height={10} delay={i * WAVE_STEP} />
                                            </div>
                                        </div>
                                        <Skeleton className="w-14 h-7 rounded-lg shrink-0" delay={i * WAVE_STEP} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. Success Stories */}
                        <section className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <SkeletonLine width={120} height={16} />
                                <SkeletonLine width={45} height={12} />
                            </div>
                            <div className="flex gap-3 items-center">
                                <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0" delay={WAVE_STEP} />
                                <div className="space-y-2 flex-1 min-w-0">
                                    <SkeletonLine width="95%" height={12} delay={WAVE_STEP * 2} />
                                    <SkeletonLine width="85%" height={12} delay={WAVE_STEP * 3} />
                                    <SkeletonLine width="45%" height={10} delay={WAVE_STEP * 4} className="mt-1" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-border/60">
                                <div className="flex gap-1">
                                    <Skeleton className="w-4 h-1.5 rounded-full" delay={WAVE_STEP} />
                                    <Skeleton className="w-1.5 h-1.5 rounded-full" delay={WAVE_STEP} />
                                </div>
                                <div className="flex gap-1">
                                    <Skeleton className="w-5 h-5 rounded-md" delay={WAVE_STEP} />
                                    <Skeleton className="w-5 h-5 rounded-md" delay={WAVE_STEP} />
                                </div>
                            </div>
                        </section>

                        {/* 4. Need Guidance? Advisory Card */}
                        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-2.5">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-7 h-7 rounded-lg" delay={WAVE_STEP} />
                                <SkeletonLine width={110} height={16} delay={WAVE_STEP} />
                            </div>
                            <SkeletonLine width="90%" height={11} delay={WAVE_STEP * 2} />
                            <SkeletonLine width="80%" height={11} delay={WAVE_STEP * 3} />
                            <Skeleton className="h-9 w-full rounded-xl mt-1" delay={WAVE_STEP * 4} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
