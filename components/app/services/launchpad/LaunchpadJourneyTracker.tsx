'use client'

import React from 'react'
import { JOURNEY_CHECKLIST, type JourneyChecklistItem } from '@/lib/launchpad-data'
import { Check, Circle, ArrowRight } from 'lucide-react'

interface LaunchpadJourneyTrackerProps
{
    percentage?: number
    onContinueSetup?: () => void
    onViewAll?: () => void
}

export default function LaunchpadJourneyTracker({
    percentage = 60,
    onContinueSetup,
    onViewAll,
}: LaunchpadJourneyTrackerProps)
{
    // SVG Circular Progress calculation
    const size = 96
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
        <div className="w-full bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Your Business Journey
                </h3>
                <button
                    onClick={onViewAll}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                    View All
                </button>
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
                        {percentage}%
                    </span>
                </div>

                {/* Text & Action */}
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-foreground">
                        Keep Going!
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 mb-2.5">
                        Complete the next step to launch your business.
                    </p>
                    <button
                        onClick={onContinueSetup}
                        className="w-full py-1.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        <span>Continue Setup</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-2 pt-2 border-t border-border/60">
                {JOURNEY_CHECKLIST.map((step) => (
                    <div key={step.id} className="flex items-center gap-2.5 text-xs">
                        {step.completed ? (
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                        ) : (
                            <Circle className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                        )}
                        <span
                            className={`truncate ${
                                step.completed
                                    ? 'text-foreground font-medium'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
