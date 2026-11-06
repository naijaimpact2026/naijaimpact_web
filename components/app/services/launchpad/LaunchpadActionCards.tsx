'use client'

import React from 'react'
import { QUICK_ACTIONS, type QuickActionCard } from '@/lib/launchpad-data'
import {
    Lightbulb,
    FileText,
    Wallet,
    Briefcase,
    TrendingUp,
    ArrowRight,
} from 'lucide-react'

interface LaunchpadActionCardsProps
{
    onSelectAction: (actionKey: string) => void
}

function getActionIcon(icon: string)
{
    switch (icon)
    {
        case 'lightbulb':
            return <Lightbulb className="w-5 h-5 text-emerald-500" />
        case 'file-text':
            return <FileText className="w-5 h-5 text-blue-500" />
        case 'wallet':
            return <Wallet className="w-5 h-5 text-purple-500" />
        case 'briefcase':
            return <Briefcase className="w-5 h-5 text-amber-500" />
        case 'trending-up':
            return <TrendingUp className="w-5 h-5 text-teal-500" />
        default:
            return <Lightbulb className="w-5 h-5 text-primary" />
    }
}

export default function LaunchpadActionCards({ onSelectAction }: LaunchpadActionCardsProps)
{
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {QUICK_ACTIONS.map((card) =>
            {
                return (
                    <div
                        key={card.id}
                        onClick={() => onSelectAction(card.actionKey)}
                        className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden`}
                    >
                        {/* Top decorative accent pill */}
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mb-3.5 ${card.bgColor} ${card.darkBgColor} group-hover:scale-105 transition-transform`}
                        >
                            {getActionIcon(card.icon)}
                        </div>

                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                                {card.title}
                            </h3>
                            <div className="mt-1 flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                                <span className="truncate">{card.subtitle}</span>
                                <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
