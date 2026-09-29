'use client'

import React, { useState } from 'react'
import {
    ShieldCheck,
    CheckCircle2,
    Clock,
    FileCheck,
    Award,
    ExternalLink,
    ChevronRight,
    Sparkles,
    Building2,
    Download,
    Play,
    Loader2,
} from 'lucide-react'
import type { CacApplication, BusinessProfile, CacApplicationStatus } from '@/lib/types'
import { advanceCacApplicationStatus } from '@/lib/actions/launchpad'
import { toast } from '@/components/toast'

interface CacStatusTrackerCardProps {
    business: BusinessProfile | null
    application: CacApplication | null
    onStartCac: () => void
    onViewCertificate: () => void
    onApplicationUpdated: (app: CacApplication) => void
}

const CAC_STAGES: { id: CacApplicationStatus; title: string; desc: string }[] = [
    { id: 'submitted', title: 'Submitted & Paid', desc: 'NIN & intake verified' },
    { id: 'name_reservation', title: 'Name Reservation', desc: 'CAC registry clearance' },
    { id: 'filing', title: 'Registrar Review', desc: 'Official documentation filing' },
    { id: 'approved', title: 'Approved & Issued', desc: 'Certificate ready to download' },
]

export default function CacStatusTrackerCard({
    business,
    application,
    onStartCac,
    onViewCertificate,
    onApplicationUpdated,
}: CacStatusTrackerCardProps) {
    const [advancing, setAdvancing] = useState(false)

    // Current status step index (0 to 3)
    const currentStepIndex = application
        ? CAC_STAGES.findIndex((s) => s.id === application.status)
        : -1

    // Quick simulation advance for testing
    const handleAdvanceSimulation = async () => {
        if (!application) return
        setAdvancing(true)
        try {
            let nextStatus: CacApplicationStatus = 'name_reservation'
            if (application.status === 'submitted') nextStatus = 'name_reservation'
            else if (application.status === 'name_reservation') nextStatus = 'filing'
            else if (application.status === 'filing') nextStatus = 'approved'
            else if (application.status === 'approved') nextStatus = 'submitted'

            const res = await advanceCacApplicationStatus(application.id, nextStatus)
            if (!res.success) {
                toast.error(res.error || 'Failed to advance status')
                return
            }

            toast.success(`Application updated to: ${nextStatus.replace('_', ' ').toUpperCase()}`)
            onApplicationUpdated(res.data)
        } catch (err: any) {
            toast.error(err.message || 'Error advancing status')
        } finally {
            setAdvancing(false)
        }
    }

    // ── CASE 1: No CAC Application yet ──────────────────────────────────────────
    if (!application) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                Step 2 of 7
                            </span>
                            <span className="text-[11px] font-bold text-muted-foreground">
                                Subsidised Business Name Registration
                            </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                            Register Your Business with CAC for ₦5,000
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Facilitated in-platform. Delivered digitally within 5 working days. No queue, no middleman. Unlocks corporate bank accounts, SMEDAN grants, and TradeCred formal loans.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onStartCac}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
                    >
                        <span>Start CAC Registration</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Sub-benefits row */}
                <div className="mt-4 pt-4 border-t border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Official BN Registration Number</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Corporate Banking (GTB, Kuda, Zenith)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>SMEDAN & Federal Grant Eligibility</span>
                    </div>
                </div>
            </div>
        )
    }

    // ── CASE 2: Approved Certificate Available ────────────────────────────────
    if (application.status === 'approved') {
        const regNum = application.cac_registration_number || 'BN 3892104'
        const bName = application.proposed_name_1 || business?.name || 'REGISTERED ENTERPRISE'

        return (
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-card to-card p-5 sm:p-6 shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37] via-[#f3e5ab] to-[#aa771c] p-0.5 shadow-lg shrink-0 flex items-center justify-center">
                            <div className="w-full h-full rounded-[14px] bg-[#0c2237] flex items-center justify-center text-amber-300">
                                <Award className="w-7 h-7" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span>CAC Registered Enterprise</span>
                                </span>
                                <span className="text-xs font-mono font-bold text-foreground">
                                    {regNum}
                                </span>
                            </div>

                            <h3 className="text-base sm:text-lg font-black text-foreground mt-1 uppercase tracking-tight">
                                {bName}
                            </h3>

                            <p className="text-xs text-muted-foreground mt-0.5">
                                Official Certificate of Registration issued by Corporate Affairs Commission.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onViewCertificate}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            <span>View Certificate (PDF)</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleAdvanceSimulation}
                            disabled={advancing}
                            title="Reset / Toggle status for testing"
                            className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-medium transition-all cursor-pointer"
                        >
                            {advancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── CASE 3: Application In Progress (Submitted, Name Reservation, Filing) ──
    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            CAC Filing In Progress
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            • Est. 3–5 working days
                        </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                        {application.proposed_name_1}
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                        Fee: ₦5,000 Paid
                    </span>
                    <button
                        type="button"
                        onClick={handleAdvanceSimulation}
                        disabled={advancing}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/80 hover:bg-muted text-[11px] font-semibold text-foreground transition-all cursor-pointer"
                        title="Simulate advancing to next CAC approval stage for demo"
                    >
                        {advancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 text-emerald-500" />}
                        <span>Fast-Track (Demo)</span>
                    </button>
                </div>
            </div>

            {/* Stepper Pipeline */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {CAC_STAGES.map((st, idx) => {
                    const isDone = currentStepIndex > idx
                    const isCurrent = currentStepIndex === idx

                    return (
                        <div
                            key={st.id}
                            className={`p-3 rounded-xl border text-xs transition-all ${
                                isDone
                                    ? 'border-emerald-500/40 bg-emerald-500/5 text-foreground'
                                    : isCurrent
                                    ? 'border-amber-500/60 bg-amber-500/10 text-foreground ring-1 ring-amber-500/30'
                                    : 'border-border/60 bg-muted/20 text-muted-foreground opacity-60'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : isCurrent ? (
                                    <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center text-[10px]">
                                        {idx + 1}
                                    </div>
                                )}
                                <span className="font-bold truncate">{st.title}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                {st.desc}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Details Strip */}
            <div className="pt-3 border-t border-border/70 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                <div>
                    <span>Alternative Proposed Name: </span>
                    <strong className="text-foreground">{application.proposed_name_2}</strong>
                </div>
                <div>
                    <span>Proprietor: </span>
                    <strong className="text-foreground">{application.proprietor_full_name}</strong>
                </div>
                <div>
                    <span>State: </span>
                    <strong className="text-foreground">{application.business_state}</strong>
                </div>
            </div>
        </div>
    )
}
