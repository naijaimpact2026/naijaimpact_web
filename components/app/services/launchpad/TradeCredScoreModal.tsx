'use client'

import React, { useState } from 'react'
import {
    X,
    Award,
    ShieldCheck,
    TrendingUp,
    Sparkles,
    Check,
    Download,
    Printer,
    Coins,
    Building2,
    CheckCircle2,
    FileCheck,
    ArrowRight,
} from 'lucide-react'
import { unlockTradeCredScore } from '@/lib/actions/launchpad'
import type { BusinessProfile, CacApplication } from '@/lib/types'
import { toast } from '@/components/toast'

interface TradeCredScoreModalProps {
    isOpen: boolean
    onClose: () => void
    business: BusinessProfile | null
    cacApplication: CacApplication | null
    onUnlocked?: () => void
}

export default function TradeCredScoreModal({
    isOpen,
    onClose,
    business,
    cacApplication,
    onUnlocked,
}: TradeCredScoreModalProps) {
    const [isUnlocking, setIsUnlocking] = useState(false)
    const [isFullyUnlocked, setIsFullyUnlocked] = useState(false)
    const [certificateId, setCertificateId] = useState('TC-SME-784920')

    if (!isOpen) return null

    const businessName = business?.name || 'Optimize Dave'
    const cacNumber = cacApplication?.cac_registration_number || 'BN 3861132'

    const milestoneAudit = [
        { name: '1. Business Profile & Identity KYC', points: '+100 pts', done: true },
        { name: '2. Hubnovo Formalization (Registration Issued)', points: '+200 pts', done: true },
        { name: '3. Digital Storefront on NaijaMarket', points: '+150 pts', done: true },
        { name: '4. Capital Discipline on Hubnovo Safe', points: '+175 pts', done: true },
        { name: '5. Community Launch Broadcast', points: '+80 pts', done: true },
        { name: '6. CommunityFund Backing', points: '+80 pts', done: true },
    ]

    const handleUnlock = async () => {
        if (!business) return
        setIsUnlocking(true)
        try {
            const res = await unlockTradeCredScore(business.id)
            if (res.success) {
                setCertificateId(res.data.certificateNumber)
                setIsFullyUnlocked(true)
                toast.success('🏆 Congratulations! TradeCred Gold Rating Unlocked with ₦2.5M Credit Access!')
                onUnlocked?.()
            } else {
                toast.error(res.error || 'Failed to unlock TradeCred score')
            }
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong')
        } finally {
            setIsUnlocking(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl text-foreground">
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-4 bg-card/95 backdrop-blur-md border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                Step 7 of 7 • Pinnacle Milestone
                            </span>
                            <h2 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                                TradeCred Formal SME Rating
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

                <div className="p-5 sm:p-6 space-y-6">
                    {/* Score & Tier Showcase Banner */}
                    <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-blue-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-5">
                        <div className="flex items-center gap-5">
                            {/* Score Ring */}
                            <div className="relative w-24 h-24 rounded-full bg-card border-4 border-amber-500 flex flex-col items-center justify-center shadow-lg shrink-0">
                                <span className="text-2xl font-black text-foreground tracking-tight">
                                    785
                                </span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                    / 1000
                                </span>
                            </div>

                            <div className="space-y-1 text-left">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-xs">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>GOLD TIER SME</span>
                                </div>
                                <h3 className="text-base sm:text-lg font-black text-foreground">
                                    {businessName}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Verified Nigerian Enterprise • {cacNumber}
                                </p>
                            </div>
                        </div>

                        {/* Credit Line Limit */}
                        <div className="sm:text-right shrink-0 p-3 sm:p-0 rounded-xl bg-card/60 sm:bg-transparent border sm:border-0 border-border w-full sm:w-auto">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Approved Credit Facility
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                ₦2,500,000
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                Collateral-free working capital
                            </span>
                        </div>
                    </div>

                    {/* Milestone Audit Breakdown */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            <span>Launchpad Milestones Contribution</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                785 / 785 Unlocked
                            </span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {milestoneAudit.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="font-semibold text-foreground text-[11px]">
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] shrink-0">
                                        {item.points}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Official TradeCred Certificate Card */}
                    <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-card to-amber-500/5 p-5 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-border/80 pb-3">
                            <div className="flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-amber-500" />
                                <div>
                                    <h5 className="text-xs font-black uppercase tracking-wider text-foreground">
                                        Official TradeCred SME Rating Certificate
                                    </h5>
                                    <p className="text-[10px] text-muted-foreground">
                                        Certificate Ref: {certificateId} • Issued 29 September 2026
                                    </p>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                                Verified
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-2.5 rounded-xl bg-background border border-border">
                                <span className="text-[10px] text-muted-foreground block">Rating Tier</span>
                                <span className="text-xs font-black text-amber-500">Gold (AAA)</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-background border border-border">
                                <span className="text-[10px] text-muted-foreground block">Score</span>
                                <span className="text-xs font-black text-foreground">785 / 1000</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-background border border-border">
                                <span className="text-[10px] text-muted-foreground block">Credit Limit</span>
                                <span className="text-xs font-black text-emerald-500">₦2,500,000</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-background border border-border">
                                <span className="text-[10px] text-muted-foreground block">Monthly Rate</span>
                                <span className="text-xs font-black text-foreground">1.2% p.m.</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    window.print?.()
                                }}
                                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[11px] font-bold text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Certificate</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    toast.success('Downloading TradeCred Rating Certificate PDF...')
                                }}
                                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-[11px] font-bold text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center sm:text-left">
                            {isFullyUnlocked
                                ? '🎉 All 7 Launchpad milestones completed! Enterprise is 100% formalized.'
                                : 'Click below to formally seal your SME credit line.'}
                        </p>
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                            >
                                Close
                            </button>
                            {!isFullyUnlocked ? (
                                <button
                                    type="button"
                                    onClick={handleUnlock}
                                    disabled={isUnlocking}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    {isUnlocking ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                            <span>Unlocking Formal Credit Limit...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Award className="w-4 h-4" />
                                            <span>Unlock ₦2.5M SME Credit Facility</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        toast.success('Navigating to Hubnovo Microloan portal...')
                                        onClose()
                                    }}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span>Apply for ₦2.5M SME Loan</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
