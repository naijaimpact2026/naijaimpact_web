'use client'

import React from 'react'
import Link from 'next/link'
import {
    Bookmark,
    Clapperboard,
    Coins,
    Crown,
    GraduationCap,
    Home,
    Music,
    Newspaper,
    Radio,
    Sparkles,
    Trophy,
    Tv,
    Users,
    Video,
} from 'lucide-react'

export interface SidebarCategory {
    id: string
    name: string
    icon: React.ComponentType<{ className?: string }>
}

export const SIDEBAR_CATEGORIES: SidebarCategory[] = [
    { id: 'all', name: 'Home', icon: Home },
    { id: 'live-tv', name: 'Live TV', icon: Tv },
    { id: 'music', name: 'Music', icon: Music },
    { id: 'entertainment', name: 'Entertainment', icon: Clapperboard },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'sports', name: 'Sports', icon: Trophy },
    { id: 'faith', name: 'Faith', icon: Sparkles },
    { id: 'news', name: 'News', icon: Newspaper },
    { id: 'my-list', name: 'My List', icon: Bookmark },
]

export const EXPLORE_ITEMS = [
    { id: 'earnings', name: 'Creator Earnings', icon: Coins, href: '/app/modushive/earnings' },
    { id: 'creators', name: 'Creators', icon: Users, href: '/app/explore' },
    { id: 'channels', name: 'Channels', icon: Video, href: '/app/modushive' },
]

interface NovoStreamSidebarProps {
    activeCategory: string
    onSelectCategory: (id: string) => void
    isCreator?: boolean
    onOpenBecomeCreator?: () => void
    className?: string
}

export default function NovoStreamSidebar({
    activeCategory,
    onSelectCategory,
    isCreator = false,
    onOpenBecomeCreator,
    className = '',
}: NovoStreamSidebarProps) {
    const exploreItems = EXPLORE_ITEMS.filter((item) => {
        if (item.id === 'earnings' && !isCreator) return false
        return true
    })

    return (
        <aside
            className={`w-60 shrink-0 space-y-6 rounded-3xl border border-border/70 bg-card/60 p-4 backdrop-blur-xl shadow-sm ${className}`}
        >
            {/* Main Navigation Categories */}
            <nav className="space-y-1">
                {SIDEBAR_CATEGORIES.map((item) => {
                    const Icon = item.icon
                    const isActive = activeCategory === item.id
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectCategory(item.id)}
                            className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 font-bold'
                                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                            }`}
                        >
                            <Icon
                                className={`h-4 w-4 shrink-0 ${
                                    isActive ? 'text-white' : 'text-muted-foreground'
                                }`}
                            />
                            <span>{item.name}</span>
                        </button>
                    )
                })}
            </nav>

            {/* Explore Section */}
            <div className="space-y-1 pt-2 border-t border-border/50">
                <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Explore
                </p>
                {exploreItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                        >
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </div>

            {/* "Be a Creator" Gradient Card */}
            {isCreator ? (
                <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-slate-900/90 p-4 text-white shadow-lg shadow-indigo-950/40">
                    <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />
                    <div className="relative z-10 space-y-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 text-white shadow-md">
                            <Crown className="h-5 w-5" />
                        </span>
                        <div>
                            <h4 className="font-display text-sm font-bold text-white">Creator Studio</h4>
                            <p className="mt-0.5 text-[11px] leading-snug text-slate-300">
                                Go live, grow your audience, earn.
                            </p>
                        </div>
                        <div className="flex flex-col gap-1.5 pt-1">
                            <Link
                                href="/app/modushive/studio"
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
                            >
                                <Radio className="h-3.5 w-3.5 text-white animate-pulse" />
                                Go Live Now
                            </Link>
                            <Link
                                href="/app/modushive/earnings"
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white transition-all"
                            >
                                <Coins className="h-3 w-3 text-amber-400" />
                                Earnings Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/70 to-purple-950/80 p-4 text-white shadow-lg shadow-black/40">
                    <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-amber-500/20 blur-xl pointer-events-none" />
                    <div className="relative z-10 space-y-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 text-white shadow-md">
                            <Sparkles className="h-5 w-5" />
                        </span>
                        <div>
                            <h4 className="font-display text-sm font-bold text-white">Become a Creator</h4>
                            <p className="mt-0.5 text-[11px] leading-snug text-slate-300">
                                Stream live, accept fan tips & monetize Day 1.
                            </p>
                        </div>
                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={onOpenBecomeCreator}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-md hover:from-amber-400 hover:to-indigo-500 transition-all active:scale-[0.98]"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                Start as a Creator
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Platform Branding Footnote */}
            <div className="pt-2 px-2 text-center sm:text-left">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white text-[11px] font-extrabold">
                        N
                    </div>
                    <div>
                        <p className="text-xs font-bold text-foreground">NovoStream</p>
                        <p className="text-[10px] text-muted-foreground">A Hubnovo Platform</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
