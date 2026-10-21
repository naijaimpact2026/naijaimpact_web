'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    Circle,
    Coins,
    ExternalLink,
    Link2,
    Radio,
    ShoppingBag,
    Sparkles,
} from 'lucide-react'

interface SetupStep {
    id: string
    title: string
    description: string
    route: string
    actionLabel: string
    href: string
    completed: boolean
    icon: React.ComponentType<{ className?: string }>
}

export default function DayOneSetupChecklist() {
    const [steps, setSteps] = useState<SetupStep[]>([
        {
            id: 'studio-ready',
            title: 'Live Broadcast Studio Configured',
            description: 'Your browser microphone, webcam, and chat streaming connection are ready.',
            route: 'Core Infrastructure',
            actionLabel: 'Open Studio',
            href: '/app/modushive/studio',
            completed: true,
            icon: Radio,
        },
        {
            id: 'wallet-linked',
            title: 'Hubnovo Wallet & Bank Account Connected',
            description: 'Instant zero-fee earnings transfer to your wallet or Nigerian bank account.',
            route: 'Payout Settlement',
            actionLabel: 'View Wallet',
            href: '/app/wallet',
            completed: true,
            icon: Coins,
        },
        {
            id: 'ticket-workshop',
            title: 'Schedule a Paid Workshop or Masterclass',
            description: 'Set a ticket price (e.g. ₦2,000) for your next livestream to earn 90% net pass-through.',
            route: 'Ticketed Events',
            actionLabel: 'Schedule Workshop',
            href: '/app/modushive/studio',
            completed: false,
            icon: Calendar,
        },
        {
            id: 'storefront-pinned',
            title: 'Connect Live Shopping Storefront',
            description: 'Pin high-demand services or physical goods from your catalogue for instant checkout in chat.',
            route: 'Live Shopping',
            actionLabel: 'Catalogue Setup',
            href: '/app/services',
            completed: false,
            icon: ShoppingBag,
        },
        {
            id: 'affiliate-partner',
            title: 'Activate Affiliate & Partner Commissions',
            description: 'Pick recommended tools, hosting, or courses to share with live viewers for 15% revenue share.',
            route: 'Affiliate Marketing',
            actionLabel: 'Explore Offers',
            href: '/app/modushive',
            completed: false,
            icon: Link2,
        },
    ])

    const completedCount = steps.filter((s) => s.completed).length
    const progressPercent = Math.round((completedCount / steps.length) * 100)

    const toggleStep = (id: string) => {
        setSteps((prev) =>
            prev.map((step) =>
                step.id === id ? { ...step, completed: !step.completed } : step
            )
        )
    }

    return (
        <div className="rounded-3xl border border-border/80 bg-card/60 p-5 sm:p-6 backdrop-blur-xl shadow-sm space-y-6">
            {/* Header & Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                            <Sparkles className="h-4 w-4" />
                        </span>
                        <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                            Day-One Monetization Launch Checklist
                        </h3>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Activate your 5 earning channels. Every route is live and un-gated from your very first stream.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Readiness
                        </span>
                        <span className="text-sm font-extrabold text-foreground">
                            {completedCount} of {steps.length} ({progressPercent}%)
                        </span>
                    </div>
                    <div className="h-10 w-10 relative flex items-center justify-center">
                        <svg className="h-10 w-10 -rotate-90 transform" viewBox="0 0 36 36">
                            <path
                                className="text-muted/40"
                                strokeWidth="3"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className="text-primary transition-all duration-500 ease-out"
                                strokeDasharray={`${progressPercent}, 100`}
                                strokeWidth="3"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <span className="absolute text-[10px] font-extrabold text-foreground">
                            {progressPercent}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Steps list */}
            <div className="space-y-3">
                {steps.map((step) => {
                    const Icon = step.icon
                    return (
                        <div
                            key={step.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                                step.completed
                                    ? 'border-border/50 bg-background/40 opacity-80'
                                    : 'border-border/80 bg-background/70 hover:border-border'
                            }`}
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <button
                                    type="button"
                                    onClick={() => toggleStep(step.id)}
                                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                                    title={step.completed ? 'Mark incomplete' : 'Mark completed'}
                                >
                                    {step.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground/60" />
                                    )}
                                </button>

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4
                                            className={`text-xs sm:text-sm font-bold ${
                                                step.completed
                                                    ? 'line-through text-muted-foreground'
                                                    : 'text-foreground'
                                            }`}
                                        >
                                            {step.title}
                                        </h4>
                                        <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                            {step.route}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <Link
                                    href={step.href}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                                >
                                    <span>{step.actionLabel}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
