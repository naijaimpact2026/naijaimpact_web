'use client'

import React, { useState } from 'react'
import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    FileText,
    HelpCircle,
    Info,
    Receipt,
    Shield,
    Sparkles,
} from 'lucide-react'

export default function FeeTransparencyCard() {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="rounded-3xl border border-border/80 bg-card/60 p-5 sm:p-6 backdrop-blur-xl shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                        <Receipt className="h-5 w-5" />
                    </span>
                    <div>
                        <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                            The Transparent Earnings Manifesto
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Honest economics. No hidden deductions, no surprise fees, and no unbacked promises.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors self-start sm:self-center"
                >
                    {isExpanded ? (
                        <>
                            <span>Hide Blueprint Example</span>
                            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        </>
                    ) : (
                        <>
                            <span>View Worked ₦85,000 Example</span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </>
                    )}
                </button>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Payment Gateway Costs
                    </span>
                    <p className="text-sm font-extrabold text-foreground">~1.5% at cost</p>
                    <p className="text-[11px] text-muted-foreground">
                        Third-party bank switch & card settlement passes directly at processing cost.
                    </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        NovoStream Platform Fee
                    </span>
                    <p className="text-sm font-extrabold text-foreground">5% – 15% clearly split</p>
                    <p className="text-[11px] text-muted-foreground">
                        Funds video streaming infrastructure, real-time chat, and escrow protections.
                    </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                        Creator Net Take-Home
                    </span>
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        85% – 95% of gross
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        Direct to your balance with clear line-item receipts for every transaction.
                    </p>
                </div>
            </div>

            {/* Expandable Section: Section 4 Worked Model */}
            {isExpanded && (
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-200">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                            Official NovoStream Blueprint Model (Section 4 Example)
                        </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        In a real scenario with 50 live viewers, here is how a creator earns{' '}
                        <strong className="text-foreground">₦75,750 net take-home</strong> from{' '}
                        <strong className="text-foreground">₦85,000 gross activity</strong> without platform subsidies:
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-border/60 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                                    <th className="pb-2.5">Route</th>
                                    <th className="pb-2.5">Gross Revenue</th>
                                    <th className="pb-2.5">Gateway (~1.5%)</th>
                                    <th className="pb-2.5">NovoStream Fee</th>
                                    <th className="pb-2.5 font-bold text-foreground">Creator Net (85%-90%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 text-foreground font-medium">
                                <tr>
                                    <td className="py-2.5">10 Workshop Tickets @ ₦2,000</td>
                                    <td className="py-2.5 font-bold">₦20,000</td>
                                    <td className="py-2.5 text-muted-foreground">₦300</td>
                                    <td className="py-2.5 text-muted-foreground">₦1,700 (8.5%)</td>
                                    <td className="py-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                                        ₦18,000 (90%)
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5">Live Shopping Products / Services</td>
                                    <td className="py-2.5 font-bold">₦50,000</td>
                                    <td className="py-2.5 text-muted-foreground">₦750</td>
                                    <td className="py-2.5 text-muted-foreground">₦4,250 (8.5%)</td>
                                    <td className="py-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                                        ₦45,000 (90%)
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5">Partner Affiliate Link Commissions</td>
                                    <td className="py-2.5 font-bold">₦10,000</td>
                                    <td className="py-2.5 text-muted-foreground">₦150</td>
                                    <td className="py-2.5 text-muted-foreground">₦1,350 (13.5%)</td>
                                    <td className="py-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                                        ₦8,500 (85%)
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5">Live Viewer Chat Tips</td>
                                    <td className="py-2.5 font-bold">₦5,000</td>
                                    <td className="py-2.5 text-muted-foreground">₦75</td>
                                    <td className="py-2.5 text-muted-foreground">₦675 (13.5%)</td>
                                    <td className="py-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                                        ₦4,250 (85%)
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-border font-bold text-xs">
                                    <td className="pt-3 uppercase tracking-wider text-foreground">
                                        Total Combined
                                    </td>
                                    <td className="pt-3 text-foreground">₦85,000</td>
                                    <td className="pt-3 text-muted-foreground">₦1,275</td>
                                    <td className="pt-3 text-muted-foreground">₦7,975</td>
                                    <td className="pt-3 text-emerald-600 dark:text-emerald-400 text-sm">
                                        ₦75,750 (89.1% net)
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                        <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>
                            Payouts are fully backed by completed buyer & attendee transactions held safely in escrow.
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
