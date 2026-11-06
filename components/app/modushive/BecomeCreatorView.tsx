'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowRight,
    CheckCircle2,
    Coins,
    Crown,
    GraduationCap,
    HeartHandshake,
    HelpCircle,
    Loader2,
    Radio,
    ShieldAlert,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react'
import { becomeCreatorAction } from '@/lib/actions/creator-earnings'
import { toast } from '@/components/toast'

interface BecomeCreatorViewProps {
    profile: any
}

export default function BecomeCreatorView({ profile }: BecomeCreatorViewProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleActivate = async () => {
        setIsSubmitting(true)
        try {
            const res = await becomeCreatorAction()
            if (!res.success) {
                toast.error(res.error || 'Failed to activate creator account.')
                setIsSubmitting(false)
                return
            }

            toast.success('🎉 Welcome to NovoStream Creators! Unlocking your earnings hub...')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="w-full space-y-10 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
            {/* ── Breadcrumb & Top Indicator ── */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Link href="/app/modushive" className="hover:text-foreground transition-colors">
                    NovoStream
                </Link>
                <span>/</span>
                <span className="font-semibold text-foreground">Creator Program</span>
            </div>

            {/* ── Hero Section ── */}
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 via-purple-950/40 to-slate-900/90 p-6 sm:p-10 md:p-12 text-white shadow-2xl">
                {/* Background ambient lighting */}
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-600/30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
                        <Crown className="h-3.5 w-3.5" />
                        <span>Day-One Creator Monetization Loop</span>
                    </div>

                    <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
                        Turn Your Knowledge, Craft, and Passion Into{' '}
                        <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                            Day-One Income
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                        NovoStream eliminates artificial barriers. No 1,000 follower hurdles, no multi-month qualification reviews. Go live, build your audience, and start earning from your very first broadcast.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleActivate}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 px-6 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-indigo-600/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Activating Creator Account...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5 text-amber-300" />
                                    <span>Activate Creator Account (Instant & Free)</span>
                                </>
                            )}
                        </button>

                        <Link
                            href="/app/modushive"
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition-colors"
                        >
                            <span>Browse Live Streams</span>
                        </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>100% Free to Join</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Zero Follower Requirements</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Instant Nigerian Bank Payouts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 4 Day-One Earning Routes Grid ── */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                        4 Ways to Earn on NovoStream From Day One
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Hubnovo supplies the broadcast technology — your audience and customers fund the income.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Route 1 */}
                    <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-xl shadow-sm space-y-3 hover:border-amber-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 shadow-sm">
                                <Coins className="h-5 w-5" />
                            </span>
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                90% Pass-Through
                            </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-foreground">
                            Live Tipping & Animated Fan Gifts
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Fans send direct tips and animated badges (⭐, 🚀, 👑, 🔥, 💖) while you broadcast. Tips settle directly into your wallet with instant celebration animations on screen.
                        </p>
                    </div>

                    {/* Route 2 */}
                    <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-xl shadow-sm space-y-3 hover:border-purple-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-500 shadow-sm">
                                <GraduationCap className="h-5 w-5" />
                            </span>
                            <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                                Keep 85% - 90%
                            </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-foreground">
                            Paid Mini-Classes & Workshops
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Teach live cooking, coding, business, beauty, or tailoring. Charge ₦1,000–₦5,000 per ticket for small group masterclasses of 10 to 50 active learners.
                        </p>
                    </div>

                    {/* Route 3 */}
                    <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-xl shadow-sm space-y-3 hover:border-blue-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-500 shadow-sm">
                                <ShoppingBag className="h-5 w-5" />
                            </span>
                            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                                92% Payout
                            </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-foreground">
                            Live Commerce & Artisan Showcases
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Demonstrate physical handmade items, fashion pieces, farm produce, or digital guides right in your stream. Viewers purchase directly with in-stream 1-click checkout.
                        </p>
                    </div>

                    {/* Route 4 */}
                    <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-xl shadow-sm space-y-3 hover:border-emerald-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 shadow-sm">
                                <HeartHandshake className="h-5 w-5" />
                            </span>
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                88% Share
                            </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-foreground">
                            Community Sponsorships & Affiliates
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Partner with verified brands and services across Hubnovo. Display clickable sponsor banners and earn commission on every sale or referral generated.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Transparent Comparison Table ── */}
            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-6">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                        <ShieldCheck className="h-4 w-4" />
                        <span>The NovoStream Advantage</span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                        Why Creators Choose Hubnovo Over Legacy Platforms
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border/80 text-muted-foreground">
                                <th className="py-3 px-4 font-semibold">Feature</th>
                                <th className="py-3 px-4 font-semibold text-muted-foreground/60">Legacy Platforms (YouTube / Twitch / TikTok)</th>
                                <th className="py-3 px-4 font-bold text-primary">NovoStream (Hubnovo)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            <tr>
                                <td className="py-3.5 px-4 font-semibold text-foreground">Eligibility Requirements</td>
                                <td className="py-3.5 px-4 text-muted-foreground">1,000+ followers & 4,000 watch hours</td>
                                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                    Day 1 (0 follower minimum)
                                </td>
                            </tr>
                            <tr>
                                <td className="py-3.5 px-4 font-semibold text-foreground">Platform Cut on Tips</td>
                                <td className="py-3.5 px-4 text-muted-foreground">30% to 50% retained by platform</td>
                                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                    10% transparent platform fee (90% to creator)
                                </td>
                            </tr>
                            <tr>
                                <td className="py-3.5 px-4 font-semibold text-foreground">Withdrawal Threshold</td>
                                <td className="py-3.5 px-4 text-muted-foreground">$50 to $100 min threshold + monthly delay</td>
                                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                    ₦0 threshold, instant wallet transfer
                                </td>
                            </tr>
                            <tr>
                                <td className="py-3.5 px-4 font-semibold text-foreground">Local African Bank Support</td>
                                <td className="py-3.5 px-4 text-muted-foreground">High foreign conversion & wire fees</td>
                                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                    Direct NGN transfer to all Nigerian commercial banks
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Bottom Call To Action ── */}
            <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-purple-500/10 to-amber-500/10 p-6 sm:p-10 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                    <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1.5 max-w-xl mx-auto">
                    <h3 className="font-display text-xl sm:text-2xl font-black text-foreground">
                        Ready to Start Streaming & Earning?
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Join hundreds of Nigerian educators, artisans, and entertainers monetizing on NovoStream today.
                    </p>
                </div>

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleActivate}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm sm:text-base font-bold text-primary-foreground shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Activating Creator Account...</span>
                            </>
                        ) : (
                            <>
                                <Crown className="h-5 w-5 text-amber-300" />
                                <span>Activate Creator Account Now</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
