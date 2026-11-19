'use client'

import Link from 'next/link'
import {
    ArrowRight,
    Award,
    CheckCircle2,
    Crown,
    Gift,
    Lock,
    Medal,
    ShieldCheck,
    Sparkles,
    Trophy,
    Wallet,
    Zap,
} from 'lucide-react'
import { LEVELS, getLevel } from '@/lib/competitions/config'

interface RewardsHubProps
{
    xp: number
    themeColor: string
    prizeNote: string | null
}

const LEVEL_PERKS: Record<number, string> = {
    1: 'Basic seller storefront',
    2: 'Custom store banner & Rising Star badge',
    3: 'Priority marketplace search placement',
    4: 'Reduced 2% escrow transaction fees',
    5: 'Official Verified Vendor checkmark',
    6: 'Permanent Marketplace Legend Hall of Fame',
}

export default function RewardsHub({ xp, themeColor, prizeNote }: RewardsHubProps)
{
    const current = getLevel(xp)

    return (
        <div className="space-y-6">
            {/* ── Season 1 Prize Pool Showcase ── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span>Season 1 Prize Pool & Grants</span>
                    </h4>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                        ₦850,000+ Total Pool
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1st Place */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-card to-card p-4 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                                <Crown className="h-5 w-5" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                1st Place
                            </span>
                        </div>
                        <div>
                            <p className="text-xl font-black text-foreground">₦500,000</p>
                            <p className="text-[11px] font-semibold text-muted-foreground">Cash Grant</p>
                        </div>
                        <ul className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border/70">
                            <li className="flex items-center gap-1.5">• Marketplace Legend Trophy</li>
                            <li className="flex items-center gap-1.5">• Verified Seller Gold Check</li>
                            <li className="flex items-center gap-1.5">• 3-Month Homepage Feature</li>
                        </ul>
                    </div>

                    {/* 2nd Place */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-400/40 bg-gradient-to-b from-slate-400/10 via-card to-card p-4 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-400 text-white shadow-md">
                                <Medal className="h-5 w-5" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                2nd Place
                            </span>
                        </div>
                        <div>
                            <p className="text-xl font-black text-foreground">₦250,000</p>
                            <p className="text-[11px] font-semibold text-muted-foreground">Cash Grant</p>
                        </div>
                        <ul className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border/70">
                            <li className="flex items-center gap-1.5">• Marketplace Champion Badge</li>
                            <li className="flex items-center gap-1.5">• 1-Month Store Spotlight</li>
                            <li className="flex items-center gap-1.5">• Hubnovo Seller Pack</li>
                        </ul>
                    </div>

                    {/* 3rd Place */}
                    <div className="relative overflow-hidden rounded-2xl border border-orange-500/40 bg-gradient-to-b from-orange-500/10 via-card to-card p-4 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md">
                                <Medal className="h-5 w-5" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                                3rd Place
                            </span>
                        </div>
                        <div>
                            <p className="text-xl font-black text-foreground">₦100,000</p>
                            <p className="text-[11px] font-semibold text-muted-foreground">Cash Grant</p>
                        </div>
                        <ul className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border/70">
                            <li className="flex items-center gap-1.5">• Marketplace Elite Badge</li>
                            <li className="flex items-center gap-1.5">• Promo Marketing Boost</li>
                            <li className="flex items-center gap-1.5">• Zero Listing Fees</li>
                        </ul>
                    </div>
                </div>

                {/* Top 10 & Category Bonus */}
                <div className="rounded-2xl border border-border bg-card/60 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="font-bold text-foreground">Top 10 Finalists & Category Winners</p>
                            <p className="text-muted-foreground text-[11px]">
                                ₦25,000 Ad Credits + Hubnovo Creator Swag + Early access to wholesale supplier tools.
                            </p>
                        </div>
                    </div>
                    {prizeNote && (
                        <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                            {prizeNote}
                        </span>
                    )}
                </div>

                {/* Where the money goes */}
                <Link
                    href="/app/wallet"
                    className="flex items-center gap-2.5 rounded-2xl border border-border bg-card/60 p-3.5 text-xs transition-colors hover:bg-muted"
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${themeColor}22`, color: themeColor }}>
                        <Wallet className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground">Cash prizes go to your Hubnovo Wallet</p>
                        <p className="text-[11px] text-muted-foreground">Set a wallet PIN now so you can withdraw your winnings to your bank.</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
            </div>

            {/* ── Level Ladder & Milestone Perks ── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground">
                        <Award className="h-4 w-4 text-primary" />
                        <span>Seller Level Milestones & Perks</span>
                    </h4>
                    <span className="text-xs font-semibold text-muted-foreground">
                        Level {current.level} · <strong style={{ color: themeColor }}>{current.name}</strong> ({xp} XP)
                    </span>
                </div>

                <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {LEVELS.map((l) =>
                    {
                        const unlocked = xp >= l.minXp
                        const isCurrent = current.level === l.level

                        return (
                            <li
                                key={l.level}
                                className={`flex flex-col justify-between rounded-2xl p-3 border transition-all ${
                                    isCurrent
                                        ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-sm'
                                        : unlocked
                                        ? 'border-border bg-card ring-1 ring-border'
                                        : 'border-border/60 bg-muted/40 opacity-70'
                                }`}
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                                            style={unlocked ? { backgroundColor: `${themeColor}22`, color: themeColor } : undefined}
                                        >
                                            {unlocked ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                                        </span>
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground">
                                            <Zap className="h-2.5 w-2.5" />{l.minXp} XP
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-foreground leading-tight pt-1">
                                        {l.name}
                                    </p>
                                </div>
                                <p className="text-[10px] text-muted-foreground line-clamp-2 pt-2 mt-2 border-t border-border/50">
                                    {LEVEL_PERKS[l.level] ?? 'Milestone unlocked'}
                                </p>
                            </li>
                        )
                    })}
                </ol>
            </div>
        </div>
    )
}
