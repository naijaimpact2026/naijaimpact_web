'use client'

import React from 'react'
import { FUNDING_OPPORTUNITIES, type FundingOpportunity } from '@/lib/launchpad-data'
import { Landmark, Trophy, UsersRound } from 'lucide-react'

interface LaunchpadFundingOpportunitiesProps
{
    onSelectFunding: (opportunity: FundingOpportunity) => void
    onSeeAll?: () => void
}

function getFundingIcon(icon: string)
{
    switch (icon)
    {
        case 'landmark':
            return <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        case 'trophy':
            return <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        case 'users-round':
            return <UsersRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        default:
            return <Landmark className="w-4 h-4 text-primary" />
    }
}

export default function LaunchpadFundingOpportunities({
    onSelectFunding,
    onSeeAll,
}: LaunchpadFundingOpportunitiesProps)
{
    return (
        <div className="w-full bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Funding Opportunities
                </h3>
                <button
                    onClick={onSeeAll}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                    See All
                </button>
            </div>

            {/* Opportunities List */}
            <div className="space-y-2.5">
                {FUNDING_OPPORTUNITIES.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-primary/40 bg-muted/30 hover:bg-muted/60 transition-all gap-3"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.badgeBg}`}>
                                {getFundingIcon(item.icon)}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-foreground truncate">
                                    {item.title}
                                </h4>
                                <p className="text-[11px] text-muted-foreground truncate font-medium">
                                    {item.highlight}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => onSelectFunding(item)}
                            className="py-1 px-3 rounded-lg border border-border bg-card hover:bg-primary hover:border-primary hover:text-primary-foreground text-xs font-bold text-foreground transition-all cursor-pointer shrink-0 shadow-2xs"
                        >
                            {item.actionLabel}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
