'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Wallet, Lock, Target, PiggyBank } from 'lucide-react'
import FlexibleTab from './FlexibleTab'
import LockedTab from './LockedTab'
import GoalsTab from './GoalsTab'
import type { SafeFlexibleAccount, SafeLockedSavings, SafeGoalSavings } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SafeDashboardClientProps
{
    flexibleAccounts: SafeFlexibleAccount[]
    lockedSavings: SafeLockedSavings[]
    goalSavings: SafeGoalSavings[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SafeDashboardClient({
    flexibleAccounts,
    lockedSavings,
    goalSavings,
}: SafeDashboardClientProps)
{
    const flexibleTotal = flexibleAccounts.reduce((sum, a) => sum + a.balance, 0)
    const lockedTotal = lockedSavings
        .filter((s) => s.status !== 'withdrawn')
        .reduce((sum, s) => sum + s.amount, 0)
    const goalTotal = goalSavings.reduce((sum, g) => sum + g.current_amount, 0)
    const grandTotal = flexibleTotal + lockedTotal + goalTotal

    return (
        <div className="space-y-8">
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">NaijaSafe</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Personal savings — flexible, locked, and goal-based
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2.5">
                    <PiggyBank className="h-5 w-5 text-primary" />
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Savings</p>
                        <p className="text-lg font-bold text-primary leading-tight">{formatNGN(grandTotal)}</p>
                    </div>
                </div>
            </div>

            {/* ── Summary bar ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bento-card noise-bg p-4 text-center space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mb-1">
                        <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Flexible</p>
                    <p className="text-sm font-bold">{formatNGN(flexibleTotal)}</p>
                </div>
                <div className="bento-card noise-bg p-4 text-center space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-1">
                        <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Locked</p>
                    <p className="text-sm font-bold">{formatNGN(lockedTotal)}</p>
                </div>
                <div className="bento-card noise-bg p-4 text-center space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 mb-1">
                        <Target className="h-4 w-4 text-secondary" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Goals</p>
                    <p className="text-sm font-bold">{formatNGN(goalTotal)}</p>
                </div>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────────────── */}
            <Tabs defaultValue="flexible">
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="flexible" className="flex-1 sm:flex-none gap-1.5">
                        <Wallet className="h-3.5 w-3.5" />
                        Flexible
                        {flexibleAccounts.length > 0 && (
                            <span className="ml-1 text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-semibold">
                                {flexibleAccounts.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="locked" className="flex-1 sm:flex-none gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        Locked
                        {lockedSavings.length > 0 && (
                            <span className="ml-1 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full px-1.5 py-0.5 font-semibold">
                                {lockedSavings.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="goals" className="flex-1 sm:flex-none gap-1.5">
                        <Target className="h-3.5 w-3.5" />
                        Goals
                        {goalSavings.length > 0 && (
                            <span className="ml-1 text-[10px] bg-secondary/15 text-secondary rounded-full px-1.5 py-0.5 font-semibold">
                                {goalSavings.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="flexible" className="mt-6">
                    <FlexibleTab accounts={flexibleAccounts} />
                </TabsContent>

                <TabsContent value="locked" className="mt-6">
                    <LockedTab savings={lockedSavings} />
                </TabsContent>

                <TabsContent value="goals" className="mt-6">
                    <GoalsTab goals={goalSavings} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
