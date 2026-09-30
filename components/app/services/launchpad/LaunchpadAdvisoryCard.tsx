'use client'

import React from 'react'
import { Rocket, ArrowRight } from 'lucide-react'

interface LaunchpadAdvisoryCardProps
{
    onBookSession: () => void
}

export default function LaunchpadAdvisoryCard({ onBookSession }: LaunchpadAdvisoryCardProps)
{
    return (
        <div className="w-full rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/25 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Rocket className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Need Guidance?
                </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-3.5">
                Book a free 1-on-1 session with our experienced business advisors to review your plan, financial model, or pitch deck.
            </p>

            <button
                onClick={onBookSession}
                className="w-full py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
                <span>Book a Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}
