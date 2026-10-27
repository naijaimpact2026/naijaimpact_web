'use client'

import Link from 'next/link'
import {
    Wallet,
    PiggyBank,
    Users,
    CreditCard,
    ShieldCheck,
    Clock,
    Lock,
    ArrowLeft,
    Sparkles,
    CheckCircle2,
    TrendingUp,
} from 'lucide-react'
import Image from 'next/image'
import FeatureInterestForm from './FeatureInterestForm'
import type { User as UserType } from '@/lib/types'

interface SavingWalletComingSoonProps {
    userProfile?: UserType | null
    userEmail?: string
}

export default function SavingWalletComingSoon({
    userProfile,
    userEmail,
}: SavingWalletComingSoonProps) {
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
                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10"
                style={{
                    background:
                        'linear-gradient(135deg, #0A1E33 0%, #102A43 55%, #0B4A6F 100%)',
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

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2.5 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/10 border border-white/15 text-cyan-300 text-xs font-extrabold uppercase tracking-wider backdrop-blur-sm">
                            <Wallet className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Hubnovo Financial Engine &bull; Coming Soon</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white">
                            Saving &amp; Wallet
                        </h1>

                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                            We are building automated group Ajo savings, high-yield SafeLock vaults, virtual payment cards, and TradeCred business micro-loans — built specifically for Nigerian merchants, artisans, and communities.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                        <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-left">
                            <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">
                                Launch Target
                            </span>
                            <span className="text-lg font-black text-white">
                                Q1 Private Beta
                            </span>
                        </div>

                        {/* Human Social Proof Stack */}
                        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                            <div className="flex -space-x-2 shrink-0">
                                <Image
                                    src="/images/testimonials/aisha-musa.jpg"
                                    alt="Aisha Musa"
                                    width={30}
                                    height={30}
                                    className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-400"
                                />
                                <Image
                                    src="/images/testimonials/adebayo-oluwaseun.jpg"
                                    alt="Adebayo Oluwaseun"
                                    width={30}
                                    height={30}
                                    className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-400"
                                />
                                <Image
                                    src="/images/avatars/chioma.jpg"
                                    alt="Chioma Okafor"
                                    width={30}
                                    height={30}
                                    className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-400"
                                />
                            </div>
                            <div className="text-left text-xs leading-tight">
                                <span className="font-extrabold text-white block">1,200+ Waitlisted</span>
                                <span className="text-[10px] text-emerald-300 font-medium">Merchants &amp; Savers</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Core Propositions Strip */}
                <div
                    className="relative z-10 mt-6 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300"
                    style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}
                >
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>NDIC Insured Partner Banks</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-cyan-300 shrink-0" />
                        <span>Bank-Grade Escrow Security</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Automated Cooperative Ajo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-300 shrink-0" />
                        <span>Daily High-Yield Returns</span>
                    </div>
                </div>
            </div>

            {/* Feature Teaser Cards Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">Digital NaijaAjo</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Form or join automated rotational thrift groups with your circle or marketplace sellers. Transparent member tracking, zero defaults, and automated cycle payouts.
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <PiggyBank className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">SafeLock Vaults</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Lock away business capital or personal savings away from impulse spending. Earn competitive daily interest with automated target milestone debits.
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">Virtual Cards &amp; Wallet</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Generate instant Naira virtual cards for online business subscriptions, ad spend, and supplier settlements directly from your Hubnovo balance.
                    </p>
                </div>
            </div>

            {/* Community Spotlight Banner */}
            <div className="rounded-2xl border border-border bg-gradient-to-r from-emerald-500/5 via-card to-cyan-500/5 p-5 sm:p-6 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    <div className="relative md:col-span-4 h-48 sm:h-52 w-full rounded-xl overflow-hidden border border-border/80 shadow-sm">
                        <Image
                            src="/images/people/nigerian-community-collaborating.jpg"
                            alt="Nigerian entrepreneurs collaborating on thrift savings"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                            <span className="text-[11px] font-bold text-white bg-emerald-600/90 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                Verified Pilot Group &bull; Kano &amp; Lagos
                            </span>
                        </div>
                    </div>

                    <div className="md:col-span-8 space-y-3">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Community Thrift in Practice</span>
                        </div>
                        <blockquote className="text-sm sm:text-base font-semibold text-foreground italic leading-relaxed">
                            &ldquo;Moving our weekly &#8358;50,000 thrift contribution from paper ledger books to Hubnovo automated Ajo means zero missed payments and NDIC-backed security for all 12 members in our Kasuwar Kurmi circle.&rdquo;
                        </blockquote>
                        <div className="flex items-center gap-3 pt-1">
                            <Image
                                src="/images/testimonials/aisha-musa.jpg"
                                alt="Aisha Musa"
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                            />
                            <div>
                                <p className="text-xs font-extrabold text-foreground">Aisha Musa</p>
                                <p className="text-[11px] text-muted-foreground">Kasuwar Kurmi Market Cooperative Lead &bull; Kano</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Analytics & Feature Demand Survey Form */}
            <FeatureInterestForm userEmail={email} userId={userId} />
        </div>
    )
}
