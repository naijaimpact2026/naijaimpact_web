'use client'

import React from 'react'
import Link from 'next/link'
import {
    Calendar,
    ChevronRight,
    Coins,
    Handshake,
    Info,
    Link2,
    ShoppingBag,
    Sparkles,
    Zap,
} from 'lucide-react'
import { DAY_ONE_EARNING_ROUTES, type EarningRouteKey } from '@/lib/creator-earnings-data'

interface EarningsRoutesBreakdownProps {
    routes: {
        tips: { gross: number; net: number; count: number; feePercent: number }
        tickets: { gross: number; net: number; count: number; feePercent: number }
        marketplace: { gross: number; net: number; count: number; feePercent: number }
        affiliates: { gross: number; net: number; count: number; feePercent: number }
        sponsorships: { gross: number; net: number; count: number; feePercent: number }
    }
}

const ROUTE_ICONS: Record<EarningRouteKey, React.ComponentType<{ className?: string }>> = {
    tips: Coins,
    tickets: Calendar,
    marketplace: ShoppingBag,
    affiliates: Link2,
    sponsorships: Handshake,
}

const ROUTE_ACTION_LINKS: Record<EarningRouteKey, { label: string; href: string }> = {
    tips: { label: 'Stream Studio', href: '/app/modushive/studio' },
    tickets: { label: 'Create Event', href: '/app/modushive/studio' },
    marketplace: { label: 'Pin Products', href: '/app/services' },
    affiliates: { label: 'Affiliate Hub', href: '/app/modushive' },
    sponsorships: { label: 'Brand Registry', href: '/app/modushive' },
}

function formatNaira(amount: number) {
    return `₦${amount.toLocaleString('en-NG')}`
}

export default function EarningsRoutesBreakdown({ routes }: EarningsRoutesBreakdownProps) {
    const totalNetAllRoutes =
        routes.tips.net +
        routes.tickets.net +
        routes.marketplace.net +
        routes.affiliates.net +
        routes.sponsorships.net

    return (
        <div className="rounded-3xl border border-border/80 bg-card/60 p-5 sm:p-6 backdrop-blur-xl shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-sm">
                            <Sparkles className="h-4 w-4" />
                        </span>
                        <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                            5 Day-One Monetization Routes
                        </h3>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Earn from day one through real customer and fan value. No arbitrary follower barriers.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-500">
                        <Zap className="h-3.5 w-3.5" />
                        Zero Follower Minimums
                    </span>
                </div>
            </div>

            {/* Visual Contribution Bar */}
            {totalNetAllRoutes > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Revenue Mix</span>
                        <span>Total Net: <strong className="text-foreground">{formatNaira(totalNetAllRoutes)}</strong></span>
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60 p-0.5">
                        {DAY_ONE_EARNING_ROUTES.map((route) => {
                            const net = routes[route.id]?.net || 0
                            const percentage = totalNetAllRoutes > 0 ? (net / totalNetAllRoutes) * 100 : 0
                            if (percentage <= 0) return null

                            const colorMap: Record<EarningRouteKey, string> = {
                                tips: 'bg-amber-500',
                                tickets: 'bg-purple-500',
                                marketplace: 'bg-blue-500',
                                affiliates: 'bg-emerald-500',
                                sponsorships: 'bg-cyan-500',
                            }

                            return (
                                <div
                                    key={route.id}
                                    style={{ width: `${percentage}%` }}
                                    className={`${colorMap[route.id]} h-full transition-all`}
                                    title={`${route.name}: ${percentage.toFixed(1)}%`}
                                />
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Grid of the 5 routes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DAY_ONE_EARNING_ROUTES.map((route) => {
                    const Icon = ROUTE_ICONS[route.id] || Coins
                    const routeStats = routes[route.id] || { gross: 0, net: 0, count: 0, feePercent: 10 }
                    const action = ROUTE_ACTION_LINKS[route.id]

                    return (
                        <div
                            key={route.id}
                            className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-background/50 p-4 transition-all hover:border-border hover:bg-card/90 hover:shadow-sm"
                        >
                            <div>
                                {/* Top route header */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${route.badgeColor}`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                                {route.name}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground">
                                                {route.whoFundsIt}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-bold text-foreground">
                                        {route.creatorSharePercent}% Creator
                                    </span>
                                </div>

                                <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                                    {route.shortDesc}
                                </p>

                                {/* Stats row */}
                                <div className="mt-4 rounded-xl border border-border/50 bg-muted/30 p-2.5 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                            Net Earned
                                        </span>
                                        <span className="text-sm font-extrabold text-foreground">
                                            {formatNaira(routeStats.net)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                            Activity
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {routeStats.count} {routeStats.count === 1 ? 'sale/tip' : 'sales/tips'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom action bar */}
                            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Info className="h-3 w-3 text-muted-foreground/60" />
                                    Fee: {route.platformFeePercent}%
                                </span>
                                <Link
                                    href={action.href}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                >
                                    {action.label}
                                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
