'use client'

import React from 'react'
import { SEVEN_STEP_LAUNCH_JOURNEY } from '@/lib/launchpad-data'
import { Check, Circle, ArrowRight } from 'lucide-react'
import type { BusinessProfile, CacApplication } from '@/lib/types'

interface LaunchpadJourneyTrackerProps {
    percentage?: number
    business?: BusinessProfile | null
    cacApplication?: CacApplication | null
    onContinueSetup?: () => void
    onSelectStep?: (stepId: number) => void
    onViewAll?: () => void
}

export default function LaunchpadJourneyTracker({
    business,
    cacApplication,
    percentage: manualPercentage,
    onContinueSetup,
    onSelectStep,
    onViewAll,
}: LaunchpadJourneyTrackerProps) {
    // Determine dynamic completion based on actual user business state
    const isProfileDone = !!business
    const isCacDone = cacApplication?.status === 'approved'
    const isCacSubmitted = !!cacApplication

    const stepsStatus = [
        { id: 1, label: '1. Business Profile setup', completed: isProfileDone },
        { id: 2, label: '2. CAC Registration (₦5,000)', completed: isCacDone, inProgress: isCacSubmitted && !isCacDone },
        { id: 3, label: '3. Digital Storefront created', completed: false },
        { id: 4, label: '4. Business Savings Goal active', completed: false },
        { id: 5, label: '5. Launch Announcement broadcast', completed: false },
        { id: 6, label: '6. CommunityFund Crowdfund', completed: false },
        { id: 7, label: '7. TradeCred Credit Score unlocked', completed: false },
    ]

    const completedCount = stepsStatus.filter((s) => s.completed).length
    const computedPercentage = manualPercentage ?? (
        isCacDone ? 30 : isCacSubmitted ? 20 : isProfileDone ? 15 : 0
    )

    // SVG Circular Progress calculation
    const size = 96
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (computedPercentage / 100) * circumference

    return (
        <div className="w-full bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Your Business Journey
                </h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {completedCount} of 7 Done
                </span>
            </div>

            {/* Circular Progress & Message */}
            <div className="flex items-center gap-4 mb-4">
                {/* SVG Progress Ring */}
                <div className="relative shrink-0 w-24 h-24 flex items-center justify-center">
                    <svg width={size} height={size} className="-rotate-90">
                        {/* Background track */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            className="text-muted/60"
                        />
                        {/* Progress arc */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="url(#journeyGrad)"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                            <linearGradient id="journeyGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#00a86b" />
                                <stop offset="100%" stopColor="#0284c7" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <span className="absolute font-black text-lg text-foreground">
                        {computedPercentage}%
                    </span>
                </div>

                {/* Text & Action */}
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-foreground">
                        {computedPercentage >= 100 ? 'Fully Launched!' : 'Keep Going!'}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 mb-2.5">
                        {!isProfileDone
                            ? 'Start Step 1: Set up your business profile.'
                            : !isCacDone
                            ? 'Step 2: Formalize with CAC for ₦5,000.'
                            : 'Step 3: Create your digital storefront.'}
                    </p>
                    <button
                        onClick={onContinueSetup}
                        className="w-full py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        <span>Continue Setup</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-2 pt-2 border-t border-border/60">
                {stepsStatus.map((step) => (
                    <button
                        key={step.id}
                        type="button"
                        onClick={() => onSelectStep?.(step.id)}
                        className="w-full flex items-center gap-2.5 text-xs text-left hover:bg-muted/40 p-1 rounded-lg transition-colors cursor-pointer group"
                    >
                        {step.completed ? (
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                        ) : step.inProgress ? (
                            <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 text-[9px] font-bold">
                                •
                            </div>
                        ) : (
                            <Circle className="w-4 h-4 text-muted-foreground/60 shrink-0 group-hover:text-emerald-500 transition-colors" />
                        )}
                        <span
                            className={`truncate flex-1 ${
                                step.completed
                                    ? 'text-foreground font-medium'
                                    : step.inProgress
                                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                    : 'text-muted-foreground group-hover:text-foreground'
                            }`}
                        >
                            {step.label}
                        </span>
                        {step.inProgress && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                                In Progress
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}
