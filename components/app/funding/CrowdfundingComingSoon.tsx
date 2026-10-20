'use client'

import Link from 'next/link'
import {
    HandCoins,
    HeartHandshake,
    Rocket,
    ShieldCheck,
    Clock,
    Lock,
    ArrowLeft,
    Sparkles,
    CheckCircle2,
    Users,
} from 'lucide-react'
import CrowdfundingInterestForm from './CrowdfundingInterestForm'
import type { User as UserType } from '@/lib/types'

interface CrowdfundingComingSoonProps {
    userProfile?: UserType | null
    userEmail?: string
}

export default function CrowdfundingComingSoon({
    userProfile,
    userEmail,
}: CrowdfundingComingSoonProps) {
    const email = userEmail || userProfile?.email || ''
    const userId = userProfile?.id || ''

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
            {/* Top Navigation */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <Link
                    href="/app"
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                </Link>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        <span>Private Beta in Development</span>
                    </span>
                </div>
            </div>

            {/* Compact Hero Banner (Aligned with New Proportional Banner Height) */}
            <div
                className="relative overflow-hidden rounded-3xl p-5 sm:p-6 lg:p-7 text-white shadow-xl border border-white/10"
                style={{
                    background:
                        'linear-gradient(135deg, #0A1E33 0%, #102A43 55%, #004D73 100%)',
                }}
            >
                {/* Ambient Decorative Blurs */}
                <div
                    className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-25 blur-3xl"
                    style={{
                        background: 'radial-gradient(circle, #00B8D9 0%, transparent 70%)',
                    }}
                />
                <div
                    className="pointer-events-none absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-20 blur-3xl"
                    style={{
                        background: 'radial-gradient(circle, #00A86B 0%, transparent 70%)',
                    }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div className="space-y-2.5 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/10 border border-white/15 text-cyan-300 text-xs font-extrabold uppercase tracking-wider backdrop-blur-sm">
                            <HandCoins className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Hubnovo Impact Engine &bull; Coming Soon</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white">
                            Crowdfunding &amp; Community Backing
                        </h1>

                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                            A next-generation crowdfunding engine engineered for Nigeria. Back grassroots social impact campaigns, fund innovative startup ventures, and enjoy milestone-based escrow release protections with complete transparency.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                        <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-left">
                            <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">
                                Launch Target
                            </span>
                            <span className="text-lg font-black text-white">
                                Private Beta Soon
                            </span>
                        </div>
                    </div>
                </div>

                {/* Core Propositions Strip */}
                <div
                    className="relative z-10 mt-5 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300"
                    style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}
                >
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Milestone Escrow Payouts</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-cyan-300 shrink-0" />
                        <span>Identity-Verified Organizers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Community-Driven Projects</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
                        <span>Corporate Match Giving</span>
                    </div>
                </div>
            </div>

            {/* Feature Teaser Cards Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                        <HeartHandshake className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">Grassroots Community Causes</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Back verified social initiatives — from solar power for rural health centers and clean water boreholes to youth education scholarships across Nigerian states.
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Rocket className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">Innovators &amp; Startups</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Help homegrown Nigerian founders, artisans, and product creators finance inventory and technology production with backer rewards and product perks.
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">100% Escrow Protection</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Zero fraud risk. Donated funds are locked safely in escrow and disbursed incrementally only as campaign organizers verify milestones and real deliverables.
                    </p>
                </div>
            </div>

            {/* Interactive Analytics & Feature Demand Survey Form */}
            <CrowdfundingInterestForm userEmail={email} userId={userId} />
        </div>
    )
}
