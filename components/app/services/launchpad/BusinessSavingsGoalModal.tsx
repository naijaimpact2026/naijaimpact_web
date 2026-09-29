'use client'

import React, { useState } from 'react'
import {
    X,
    PiggyBank,
    TrendingUp,
    ShieldCheck,
    Check,
    ArrowRight,
    Calendar,
    Wallet,
    Sparkles,
    Lock,
    Coins,
} from 'lucide-react'
import { createBusinessSavingsGoal } from '@/lib/actions/launchpad'
import type { BusinessProfile } from '@/lib/types'
import { toast } from '@/components/toast'

interface BusinessSavingsGoalModalProps {
    isOpen: boolean
    onClose: () => void
    business: BusinessProfile | null
    walletBalance?: number
    onGoalCreated?: (data: { id: string; name: string; target_amount: number }) => void
    onProceedToNext?: () => void
}

export default function BusinessSavingsGoalModal({
    isOpen,
    onClose,
    business,
    walletBalance = 0,
    onGoalCreated,
    onProceedToNext,
}: BusinessSavingsGoalModalProps) {
    const defaultName = business
        ? `${business.name} Equipment & Working Capital Seed`
        : 'Business Equipment & Expansion Seed'

    const [goalName, setGoalName] = useState(defaultName)
    const [targetAmount, setTargetAmount] = useState('250,000')
    const [monthsDuration, setMonthsDuration] = useState(6)
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'manual'>('weekly')
    const [initialDeposit, setInitialDeposit] = useState('10,000')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    if (!isOpen) return null

    const parsedTarget = Number(targetAmount.replace(/,/g, '')) || 0
    const parsedInitial = Number(initialDeposit.replace(/,/g, '')) || 0

    const targetPresets = [100000, 250000, 500000, 1000000]

    // Calculate estimated contribution
    const remainingToSave = Math.max(0, parsedTarget - parsedInitial)
    const totalDays = monthsDuration * 30
    const totalWeeks = Math.max(1, monthsDuration * 4)
    const estimatedDaily = Math.ceil(remainingToSave / totalDays)
    const estimatedWeekly = Math.ceil(remainingToSave / totalWeeks)
    const estimatedMonthly = Math.ceil(remainingToSave / monthsDuration)

    const projectedContribution =
        frequency === 'daily'
            ? `₦${estimatedDaily.toLocaleString('en-NG')} / day`
            : frequency === 'weekly'
            ? `₦${estimatedWeekly.toLocaleString('en-NG')} / week`
            : frequency === 'monthly'
            ? `₦${estimatedMonthly.toLocaleString('en-NG')} / month`
            : 'Flexible manual deposits'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!business) {
            toast.error('Business profile is required.')
            return
        }
        if (!goalName.trim()) {
            toast.error('Please enter a goal name.')
            return
        }
        if (parsedTarget <= 0) {
            toast.error('Target savings amount must be greater than zero.')
            return
        }
        if (parsedInitial > walletBalance) {
            toast.error(`Initial deposit (₦${parsedInitial.toLocaleString('en-NG')}) exceeds your wallet balance (₦${walletBalance.toLocaleString('en-NG')}).`)
            return
        }

        setIsSubmitting(true)
        try {
            const targetDate = new Date(Date.now() + monthsDuration * 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0]

            const res = await createBusinessSavingsGoal({
                business_id: business.id,
                name: goalName.trim(),
                target_amount: parsedTarget,
                target_date: targetDate,
                initial_deposit: parsedInitial,
                frequency,
            })

            if (res.success) {
                toast.success('💰 Business Savings Goal activated on Hubnovo Safe!')
                setIsSuccess(true)
                onGoalCreated?.(res.data)
            } else {
                toast.error(res.error || 'Failed to activate savings goal')
            }
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl text-foreground">
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-4 bg-card/95 backdrop-blur-md border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <PiggyBank className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                Step 4 of 7
                            </span>
                            <h2 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                                Business Seed Savings Goal
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isSuccess ? (
                    /* ── Success Screen ── */
                    <div className="p-6 sm:p-8 text-center space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/30">
                            <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-foreground">
                                Savings Target Activated!
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                                Goal for <span className="font-semibold text-foreground">{goalName}</span> is now active with target{' '}
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                    ₦{parsedTarget.toLocaleString('en-NG')}
                                </span>
                                .
                            </p>
                        </div>

                        {/* Projection card */}
                        <div className="max-w-md mx-auto p-4 rounded-2xl bg-muted/40 border border-border text-left space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Target Timeline</span>
                                <span className="font-bold text-foreground">{monthsDuration} Months</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Savings Cadence</span>
                                <span className="font-bold text-foreground capitalize">{frequency}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Annualized Return</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">14.5% p.a.</span>
                            </div>
                            <div className="pt-2 border-t border-border flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">TradeCred Boost</span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                    +125 Credit Points
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    onClose()
                                    onProceedToNext?.()
                                }}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Continue to Step 5 (Launch Broadcast)</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Form Screen ── */
                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                        {/* Incentive Callout */}
                        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                            <TrendingUp className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-bold text-foreground">SME Discipline Anchor:</span> Regular savings activity on Hubnovo Safe directly enhances your{' '}
                                <span className="font-bold text-foreground">TradeCred Rating</span>, unlocking larger formal microloan facilities up to ₦2.5M.
                            </div>
                        </div>

                        {/* Goal Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">
                                Savings Goal Name <span className="text-blue-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={goalName}
                                onChange={(e) => setGoalName(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                required
                            />
                        </div>

                        {/* Target Amount */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground">
                                Target Capital Amount (₦ NGN) <span className="text-blue-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                    ₦
                                </span>
                                <input
                                    type="text"
                                    value={targetAmount}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '')
                                        setTargetAmount(val ? Number(val).toLocaleString('en-NG') : '')
                                    }}
                                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    required
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {targetPresets.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setTargetAmount(p.toLocaleString('en-NG'))}
                                        className="text-[10px] px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground font-semibold cursor-pointer"
                                    >
                                        ₦{p >= 1000000 ? `${p / 1000000}M` : `${p / 1000}k`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration & Frequency */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Target Horizon</label>
                                <select
                                    value={monthsDuration}
                                    onChange={(e) => setMonthsDuration(Number(e.target.value))}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                                >
                                    <option value={3}>3 Months (Fast sprint)</option>
                                    <option value={6}>6 Months (Standard seed)</option>
                                    <option value={12}>12 Months (Major equipment)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Contribution Pace</label>
                                <select
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value as any)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                                >
                                    <option value="weekly">Weekly Auto-Save</option>
                                    <option value="daily">Daily Micro-Save</option>
                                    <option value="monthly">Monthly Lump-sum</option>
                                    <option value="manual">Manual Top-up Anytime</option>
                                </select>
                            </div>
                        </div>

                        {/* Initial Seed & Projection Summary */}
                        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <Coins className="w-3.5 h-3.5 text-blue-500" />
                                    Estimated Contribution
                                </span>
                                <span className="font-black text-blue-600 dark:text-blue-400">
                                    {projectedContribution}
                                </span>
                            </div>

                            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-bold text-foreground">Initial Seed Deposit</span>
                                    <p className="text-[10px] text-muted-foreground">
                                        Wallet Balance: ₦{walletBalance.toLocaleString('en-NG')}
                                    </p>
                                </div>
                                <div className="w-32 relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground">
                                        ₦
                                    </span>
                                    <input
                                        type="text"
                                        value={initialDeposit}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '')
                                            setInitialDeposit(val ? Number(val).toLocaleString('en-NG') : '0')
                                        }}
                                        className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Activating Goal...</span>
                                    </>
                                ) : (
                                    <>
                                        <PiggyBank className="w-4 h-4" />
                                        <span>Activate Savings Target</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
