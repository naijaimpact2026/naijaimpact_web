'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    CheckCircle2,
    Coins,
    ExternalLink,
    Radio,
    ShieldCheck,
    Sparkles,
    Wallet,
} from 'lucide-react'
import type { CreatorEarningsSummary } from '@/lib/creator-earnings-data'
import EarningsHeroCards from './EarningsHeroCards'
import EarningsRoutesBreakdown from './EarningsRoutesBreakdown'
import FeeTransparencyCard from './FeeTransparencyCard'
import AudienceQualityCard from './AudienceQualityCard'
import DayOneSetupChecklist from './DayOneSetupChecklist'
import CreatorTransactionsLedger from './CreatorTransactionsLedger'
import CreatorWithdrawalModal from './CreatorWithdrawalModal'

interface CreatorEarningsDashboardProps {
    initialSummary: CreatorEarningsSummary
    profile: any
}

export default function CreatorEarningsDashboard({
    initialSummary,
    profile,
}: CreatorEarningsDashboardProps) {
    const [summary, setSummary] = useState<CreatorEarningsSummary>(initialSummary)
    const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    const handleWithdrawalSuccess = (transferredAmount: number, newBalance: number) => {
        setSummary((prev) => ({
            ...prev,
            availableBalance: newBalance,
            totalWithdrawn: prev.totalWithdrawn + transferredAmount,
            transactions: [
                {
                    id: `payout-${Date.now()}`,
                    created_at: new Date().toISOString(),
                    title: 'Creator Earnings Payout',
                    route_key: 'payout',
                    type: 'withdrawal',
                    gross_amount: transferredAmount,
                    payment_cost: 0,
                    platform_fee: 0,
                    net_amount: transferredAmount,
                    status: 'completed',
                    notes: 'Withdrawal completed successfully',
                },
                ...prev.transactions,
            ],
        }))

        setToastMessage(`₦${transferredAmount.toLocaleString('en-NG')} successfully withdrawn!`)
        setTimeout(() => setToastMessage(null), 5000)
    }

    return (
        <div className="w-full space-y-6 sm:space-y-8">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-card p-4 text-xs font-bold text-emerald-500 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Breadcrumb & Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/70 bg-card/60 p-4 backdrop-blur-xl shadow-sm">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Link
                        href="/app/modushive"
                        className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> NovoStream
                    </Link>
                    <span>/</span>
                    <span className="font-bold text-foreground">Creator Earnings & Monetization Hub</span>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                        <Sparkles className="h-3 w-3" />
                        Day-One Active
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/app/wallet"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/60 px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                    >
                        <Wallet className="h-3.5 w-3.5 text-primary" />
                        Hubnovo Wallet
                    </Link>

                    <Link
                        href="/app/modushive/studio"
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:brightness-110 active:scale-95 transition-all"
                    >
                        <Radio className="h-3.5 w-3.5 animate-pulse" />
                        Live Studio
                    </Link>
                </div>
            </div>

            {/* Title & Introduction */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                        Creator Earnings Command Center
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        Monitor earnings across tips, tickets, live shopping, and affiliate commissions.
                        Every Naira is funded by genuine fan and buyer value with 100% transparent fee breakdowns.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsWithdrawalOpen(true)}
                    disabled={summary.availableBalance <= 0}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all self-start md:self-auto"
                >
                    <Wallet className="h-4 w-4" />
                    Withdraw Available (₦{summary.availableBalance.toLocaleString('en-NG')})
                </button>
            </div>

            {/* 1. Hero KPI Cards */}
            <EarningsHeroCards
                totalNetEarnedThisMonth={summary.totalNetEarnedThisMonth}
                monthGrowthPercent={summary.monthGrowthPercent}
                availableBalance={summary.availableBalance}
                pendingBalance={summary.pendingBalance}
                lifetimeGross={summary.lifetimeGross}
                onOpenWithdrawal={() => setIsWithdrawalOpen(true)}
            />

            {/* 2. Visual Breakdown across 5 Day-One Routes */}
            <EarningsRoutesBreakdown routes={summary.routes} />

            {/* 3. Two-Column Layout: Fee Transparency & Quality Score + Day-One Checklist */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7 2xl:col-span-8 space-y-6">
                    {/* Honest Fee Transparency & Section 4 Blueprint Breakdown */}
                    <FeeTransparencyCard />

                    {/* Audience Quality & Retention Analytics (Section 6) */}
                    <AudienceQualityCard audienceQuality={summary.audienceQuality} />
                </div>

                <div className="xl:col-span-5 2xl:col-span-4 space-y-6">
                    {/* Day-One Onboarding & Feature Activation Checklist */}
                    <DayOneSetupChecklist />
                </div>
            </div>

            {/* 4. Complete Itemized Transaction Ledger */}
            <CreatorTransactionsLedger transactions={summary.transactions} />

            {/* Withdrawal Modal */}
            <CreatorWithdrawalModal
                isOpen={isWithdrawalOpen}
                availableBalance={summary.availableBalance}
                onClose={() => setIsWithdrawalOpen(false)}
                onSuccess={handleWithdrawalSuccess}
            />
        </div>
    )
}
