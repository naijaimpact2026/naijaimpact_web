'use client'

import React, { useState } from 'react'
import {
    X,
    HeartHandshake,
    Rocket,
    Check,
    ArrowRight,
    ShieldCheck,
    Sparkles,
    Target,
    Clock,
    DollarSign,
    Users,
} from 'lucide-react'
import { createBusinessCrowdfund } from '@/lib/actions/launchpad'
import type { BusinessProfile } from '@/lib/types'
import { toast } from '@/components/toast'

interface CommunityFundModalProps {
    isOpen: boolean
    onClose: () => void
    business: BusinessProfile | null
    onCreated?: (data: { id: string; title: string; goal_amount: number }) => void
    onProceedToNext?: () => void
}

export default function CommunityFundModal({
    isOpen,
    onClose,
    business,
    onCreated,
    onProceedToNext,
}: CommunityFundModalProps) {
    const defaultTitle = `Seed Expansion & Tech Equipment Fund for ${business?.name || 'Our Venture'}`
    const [title, setTitle] = useState(defaultTitle)
    const [goalAmount, setGoalAmount] = useState('1,000,000')
    const [durationDays, setDurationDays] = useState(60)
    const [campaignType, setCampaignType] = useState('Seed & Equipment Expansion')
    const [description, setDescription] = useState(
        `We are raising community backing to scale operations at ${business?.name || 'our enterprise'}. Funds will be deployed directly towards procuring workstation hardware, cloud infrastructure, and onboarding local apprentices in Ikeja, Lagos.`
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    if (!isOpen) return null

    const parsedGoal = Number(goalAmount.replace(/,/g, '')) || 0
    const goalPresets = [500000, 1000000, 2500000, 5000000]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!business) {
            toast.error('Business profile is required.')
            return
        }
        if (!title.trim()) {
            toast.error('Campaign title is required.')
            return
        }
        if (parsedGoal <= 0) {
            toast.error('Target funding amount must be greater than zero.')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await createBusinessCrowdfund({
                business_id: business.id,
                title: title.trim(),
                description: description.trim(),
                goal_amount: parsedGoal,
                duration_days: durationDays,
                category: business.category,
            })

            if (res.success) {
                toast.success('🚀 CommunityFund campaign launched successfully!')
                setIsSuccess(true)
                onCreated?.(res.data)
            } else {
                toast.error(res.error || 'Failed to launch campaign')
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
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <HeartHandshake className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                Step 6 of 7
                            </span>
                            <h2 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                                Launch CommunityFund Campaign
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
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
                            <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-foreground">
                                Crowdfund Campaign Live!
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                                <span className="font-semibold text-foreground">{title}</span> is now active on CommunityFund with target{' '}
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                    ₦{parsedGoal.toLocaleString('en-NG')}
                                </span>
                                .
                            </p>
                        </div>

                        {/* Campaign preview */}
                        <div className="max-w-md mx-auto p-4 rounded-2xl bg-muted/40 border border-border text-left space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground line-clamp-1">{title}</span>
                                <span className="text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                                    {durationDays} Days Left
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full w-[4%]" />
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-muted-foreground">Raised: ₦0</span>
                                <span className="font-bold text-foreground">
                                    Target: ₦{parsedGoal.toLocaleString('en-NG')}
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
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Continue to Step 7 (TradeCred Score)</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Form Screen ── */
                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                        {/* Callout */}
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-bold text-foreground">Zero Equity Dilution:</span> Raise seed backing from patrons, community believers, and diaspora supporters without sacrificing equity or debt ownership.
                            </div>
                        </div>

                        {/* Campaign Title */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">
                                Campaign Headline <span className="text-amber-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                required
                            />
                        </div>

                        {/* Goal Amount & Presets */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground">
                                Funding Target (₦ NGN) <span className="text-amber-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                    ₦
                                </span>
                                <input
                                    type="text"
                                    value={goalAmount}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '')
                                        setGoalAmount(val ? Number(val).toLocaleString('en-NG') : '')
                                    }}
                                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                    required
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {goalPresets.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setGoalAmount(p.toLocaleString('en-NG'))}
                                        className="text-[10px] px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground font-semibold cursor-pointer"
                                    >
                                        ₦{p >= 1000000 ? `${p / 1000000}M` : `${p / 1000}k`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Campaign Duration</label>
                                <select
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(Number(e.target.value))}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                                >
                                    <option value={30}>30 Days (Quick push)</option>
                                    <option value={60}>60 Days (Recommended)</option>
                                    <option value={90}>90 Days (Extended round)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Campaign Purpose</label>
                                <select
                                    value={campaignType}
                                    onChange={(e) => setCampaignType(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                                >
                                    <option value="Seed & Equipment Expansion">Seed & Equipment Expansion</option>
                                    <option value="Product Launch & Inventory">Product Launch & Inventory</option>
                                    <option value="Working Capital & Operations">Working Capital & Operations</option>
                                </select>
                            </div>
                        </div>

                        {/* Story & Pitch */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">
                                Campaign Pitch & Use of Funds
                            </label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                placeholder="Explain why supporters should back your venture..."
                            />
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
                                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                        <span>Publishing Campaign...</span>
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-4 h-4" />
                                        <span>Launch CommunityFund Campaign</span>
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
