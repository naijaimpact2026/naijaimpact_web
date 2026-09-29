'use client'

import React from 'react'
import { ROADMAP_STAGES, type RoadmapStage } from '@/lib/launchpad-data'
import { Check } from 'lucide-react'

interface LaunchpadRoadmapStepperProps
{
    activeStageId: number
    onSelectStage: (stage: RoadmapStage) => void
}

export default function LaunchpadRoadmapStepper({
    activeStageId,
    onSelectStage,
}: LaunchpadRoadmapStepperProps)
{
    return (
        <div className="w-full bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-4 py-1">
                {ROADMAP_STAGES.map((stage, idx) =>
                {
                    const isActive = stage.id === activeStageId
                    const isPassed = stage.id < activeStageId

                    return (
                        <React.Fragment key={stage.id}>
                            <button
                                onClick={() => onSelectStage(stage)}
                                className={`flex items-center gap-3 shrink-0 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-primary/10 border border-primary/30 shadow-xs'
                                        : 'hover:bg-muted/60 border border-transparent'
                                }`}
                                aria-label={`Stage ${stage.id}: ${stage.title}`}
                            >
                                {/* Step Circle Indicator */}
                                <div
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black transition-colors ${
                                        isPassed
                                            ? 'bg-emerald-500 text-slate-950 font-bold'
                                            : isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : stage.id}
                                </div>

                                {/* Text Content */}
                                <div className="min-w-0">
                                    <p
                                        className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                                            isActive ? 'text-primary' : 'text-foreground'
                                        }`}
                                    >
                                        {stage.title}
                                    </p>
                                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate leading-normal">
                                        {stage.subtitle}
                                    </p>
                                </div>
                            </button>

                            {/* Connecting Divider between stages */}
                            {idx < ROADMAP_STAGES.length - 1 && (
                                <div className="hidden sm:block flex-1 h-[2px] min-w-3 bg-border/80" />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
