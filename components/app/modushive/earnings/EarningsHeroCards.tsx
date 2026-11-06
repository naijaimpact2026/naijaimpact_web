'use client'

import React from 'react'
import {
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Coins,
    HelpCircle,
    ShieldCheck,
    TrendingUp,
    Wallet,
} from 'lucide-react'

interface EarningsHeroCardsProps {
    totalNetEarnedThisMonth: number
    monthGrowthPercent: number
    availableBalance: number
    pendingBalance: number
    lifetimeGross: number
    onOpenWithdrawal: () => void
}

function formatNaira(amount: number) {
    return `₦${amount.toLocaleString('en-NG')}`
}

export default function EarningsHeroCards({
    totalNetEarnedThisMonth,
    monthGrowthPercent,
    availableBalance,
    pendingBalance,
    lifetimeGross,
    onOpenWithdrawal,
}: EarningsHeroCardsProps) {
    const netRetentionRate =
        lifetimeGross > 0
            ? Math.round((totalNetEarnedThisMonth / lifetimeGross) * 100)
            : 89

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Net Earned This Month */}
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card/90 via-card/60 to-background/80 p-5 backdrop-blur-xl shadow-sm transition-all hover:border-border hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-500 border border-emerald-500/30">
                        <Coins className="h-5 w-5" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-500">
                        {monthGrowthPercent > 0 ? (
                            <>
                                <TrendingUp className="h-3 w-3" />
                                +{monthGrowthPercent}%
                            </>
                        ) : (
                            <>
                                <Coins className="h-3 w-3" />
                                Day-One Ready
                            </>
                        )}
                    </span>
                </div>
                <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Net Earned This Month
                    </p>
                    <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
                        {formatNaira(totalNetEarnedThisMonth)}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                        Your 100% net take-home after gateway processing and platform fees.
                    </p>
                </div>
            </div>

            {/* Card 2: Available to Withdraw (Actionable) */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/40 bg-gradient-to-br from-blue-950/20 via-card/70 to-card/90 p-5 backdrop-blur-xl shadow-sm transition-all hover:border-blue-500/60 hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                        <Wallet className="h-5 w-5" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[11px] font-bold text-blue-500">
                        <CheckCircle2 className="h-3 w-3" />
                        Ready to Payout
                    </span>
                </div>
                <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Available Balance
                    </p>
                    <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
                        {formatNaira(availableBalance)}
                    </h3>
                    <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                            Instant to Hubnovo Wallet
                        </span>
                        <button
                            type="button"
                            onClick={onOpenWithdrawal}
                            disabled={availableBalance <= 0}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Withdraw
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Card 3: Pending Clearing */}
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card/90 via-card/60 to-background/80 p-5 backdrop-blur-xl shadow-sm transition-all hover:border-border hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/25">
                        <Clock className="h-5 w-5" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-500">
                        Settling
                    </span>
                </div>
                <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Pending Clearing
                    </p>
                    <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
                        {formatNaira(pendingBalance)}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                        Affiliate commissions and future event ticket funds releasing in 24h–7d.
                    </p>
                </div>
            </div>

            {/* Card 4: Lifetime Gross Volume */}
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card/90 via-card/60 to-background/80 p-5 backdrop-blur-xl shadow-sm transition-all hover:border-border hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-500 border border-purple-500/25">
                        <ShieldCheck className="h-5 w-5" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[11px] font-bold text-purple-500">
                        {lifetimeGross > 0 ? `${netRetentionRate}% Creator Retention` : '85%–95% Standard Split'}
                    </span>
                </div>
                <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Lifetime Gross Volume
                    </p>
                    <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
                        {formatNaira(lifetimeGross)}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                        Total buyer and fan value generated across all 5 Day-One monetization routes.
                    </p>
                </div>
            </div>
        </div>
    )
}
