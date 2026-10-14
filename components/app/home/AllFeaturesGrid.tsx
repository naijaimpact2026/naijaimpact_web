'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    BookOpen,
    Briefcase,
    ShoppingBag,
    Rocket,
    Wallet,
    Users,
    Wrench,
    HandCoins,
    ArrowRight,
    Sparkles,
    Search,
    MessageSquare,
    Check,
} from 'lucide-react'

export interface PlatformFeature {
    id: string
    title: string
    subtitle: string
    category: 'trade' | 'skills' | 'finance' | 'community'
    categoryLabel: string
    description: string
    highlights: string[]
    href: string
    ctaText: string
    icon: typeof BookOpen
    badgeText?: string
    accentColor: string
    accentDot: string
    ctaGradient: string
    imageUrl: string
}

export const PLATFORM_FEATURES: PlatformFeature[] = [
    {
        id: 'artisans',
        title: 'Artisans & Skilled Pros',
        subtitle: 'Verified technicians & craft specialists',
        category: 'trade',
        categoryLabel: 'Verified Services',
        description: 'Connect with verified electricians, carpenters, plumbers, tech specialists, and tailoring professionals across Nigeria.',
        highlights: [
            'Identity Verified',
            'Milestone Escrow',
            'Direct Calls & Chat',
        ],
        href: '/app/artisans',
        ctaText: 'Find an Artisan',
        icon: Wrench,
        badgeText: 'High Demand',
        accentColor: '#f97316',
        accentDot: 'bg-amber-400',
        ctaGradient: 'from-orange-500 to-amber-600',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'community-feed',
        title: 'Community Feed & Topics',
        subtitle: 'Discussions, grant alerts & collaborations',
        category: 'community',
        categoryLabel: 'Networking',
        description: 'Share insights, collaborate on projects, discover verified grants, and network with Nigerian innovators in specialized topic channels.',
        highlights: [
            'Visual Media Feed',
            'Topic Channels',
            'Real-Time Alerts',
        ],
        href: '/app/feed',
        ctaText: 'Join the Conversation',
        icon: Users,
        badgeText: 'Active Hub',
        accentColor: '#3b82f6',
        accentDot: 'bg-sky-400',
        ctaGradient: 'from-blue-600 to-indigo-600',
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'marketplace',
        title: 'Marketplace & Trade',
        subtitle: 'Buy & sell with buyer escrow guarantee',
        category: 'trade',
        categoryLabel: 'E-Commerce',
        description: 'Buy and sell locally crafted goods, electronics, fashion, and services with nationwide delivery and secure buyer escrow protection.',
        highlights: [
            'Escrow Checkout',
            'Merchant Ratings',
            'Nationwide Delivery',
        ],
        href: '/app/market',
        ctaText: 'Explore Marketplace',
        icon: ShoppingBag,
        badgeText: 'Escrow Protected',
        accentColor: '#10b981',
        accentDot: 'bg-emerald-400',
        ctaGradient: 'from-emerald-500 to-teal-600',
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'learn',
        title: 'Skills Academy & Study',
        subtitle: 'Practical video courses with hover preview',
        category: 'skills',
        categoryLabel: 'Education',
        description: 'Master practical digital, vocational, and business skills with bite-sized video lessons, playable hover preview, and verified certificates.',
        highlights: [
            'Hover Video Preview',
            'Certified Courses',
            'Curriculum Assets',
        ],
        href: '/app/learn',
        ctaText: 'Start Learning',
        icon: BookOpen,
        badgeText: 'Video Preview',
        accentColor: '#8b5cf6',
        accentDot: 'bg-violet-400',
        ctaGradient: 'from-violet-600 to-purple-600',
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'jobs',
        title: 'Jobs & Career Hub',
        subtitle: 'Verified local & remote openings',
        category: 'trade',
        categoryLabel: 'Career & Work',
        description: 'Explore verified job openings, freelance contracts, and career advancement paths across high-growth industries in Nigeria.',
        highlights: [
            'Verified Employers',
            '1-Click Fast Apply',
            'Recruiter Chat',
        ],
        href: '/app/jobs',
        ctaText: 'Explore Opportunities',
        icon: Briefcase,
        badgeText: 'Hiring Now',
        accentColor: '#0284c7',
        accentDot: 'bg-sky-400',
        ctaGradient: 'from-sky-500 to-blue-600',
        imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'launchpad',
        title: 'Business LaunchPad',
        subtitle: 'CAC registration & enterprise toolkits',
        category: 'skills',
        categoryLabel: 'Business Growth',
        description: 'Register your business with CAC, access legal templates, build professional branding, and scale your Nigerian enterprise with expert guidance.',
        highlights: [
            'CAC Registration',
            'Pitch Deck Kits',
            '1-on-1 Mentors',
        ],
        href: '/app/services',
        ctaText: 'Launch Your Business',
        icon: Rocket,
        badgeText: 'CAC Support',
        accentColor: '#f43f5e',
        accentDot: 'bg-rose-400',
        ctaGradient: 'from-rose-500 to-pink-600',
        imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'wallet',
        title: 'Save & Grow Escrow',
        subtitle: 'Automated milestone wallet release',
        category: 'finance',
        categoryLabel: 'Fintech & Wallet',
        description: 'Manage your earnings securely, fund projects, lock automated target savings, and experience seamless zero-friction withdrawals.',
        highlights: [
            'Instant Funding',
            'Target Savings',
            'Milestone Escrow',
        ],
        href: '/app/wallet',
        ctaText: 'Manage Your Funds',
        icon: Wallet,
        badgeText: '0% Escrow Fee',
        accentColor: '#059669',
        accentDot: 'bg-emerald-400',
        ctaGradient: 'from-emerald-600 to-teal-600',
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'funding',
        title: 'Crowdfunding & Grants',
        subtitle: 'Community-backed micro funding',
        category: 'finance',
        categoryLabel: 'Capital',
        description: 'Raise capital for community initiatives, tech innovations, and craft workshops with transparent public tracking and milestones.',
        highlights: [
            'Community Pools',
            'Verified Audits',
            'Direct Broadcast',
        ],
        href: '/app/funding',
        ctaText: 'Discover Grants',
        icon: HandCoins,
        badgeText: 'Micro-Grants',
        accentColor: '#06b6d4',
        accentDot: 'bg-cyan-400',
        ctaGradient: 'from-cyan-500 to-blue-600',
        imageUrl: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'chat',
        title: 'Direct Messaging & Voice',
        subtitle: 'Instant audio notes & media chat',
        category: 'community',
        categoryLabel: 'Collaboration',
        description: 'Communicate in real time with clients, artisans, and fellow creators using crystal-clear audio voice notes and instant media sharing.',
        highlights: [
            'Voice Notes',
            'Media Attachments',
            'Instant Delivery',
        ],
        href: '/app/chat',
        ctaText: 'Open Messages',
        icon: MessageSquare,
        badgeText: 'Voice Notes',
        accentColor: '#6366f1',
        accentDot: 'bg-indigo-400',
        ctaGradient: 'from-indigo-500 to-purple-600',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    },
]

type CategoryFilter = 'all' | 'trade' | 'skills' | 'finance' | 'community'

interface AllFeaturesGridProps {
    showHeader?: boolean
    compact?: boolean
}

export default function AllFeaturesGrid({ showHeader = true }: AllFeaturesGridProps) {
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredFeatures = PLATFORM_FEATURES.filter((feature) => {
        const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory
        const matchesSearch =
            feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            feature.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            feature.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
            feature.highlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesCategory && matchesSearch
    })

    const counts = {
        all: PLATFORM_FEATURES.length,
        trade: PLATFORM_FEATURES.filter((f) => f.category === 'trade').length,
        skills: PLATFORM_FEATURES.filter((f) => f.category === 'skills').length,
        finance: PLATFORM_FEATURES.filter((f) => f.category === 'finance').length,
        community: PLATFORM_FEATURES.filter((f) => f.category === 'community').length,
    }

    return (
        <section id="all-features" className="space-y-6">
            {/* Header with Title and Search (if showHeader is true) */}
            {showHeader && (
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            <span className="text-[11px] font-extrabold uppercase tracking-wider">Platform Directory</span>
                        </div>
                        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mt-2 tracking-tight">
                            Explore Hubnovo Ecosystem
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                            Comprehensive solutions engineered for Nigerian artisans, creators, learners, and business builders.
                        </p>
                    </div>

                    {/* Modern Glass Search Bar */}
                    <div className="relative w-full sm:w-72 shrink-0">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search all features..."
                            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-card/80 border border-border/80 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-md shadow-xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer font-bold"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Filter Pills with Badge Counts */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                    { id: 'all', label: 'All Modules', count: counts.all },
                    { id: 'trade', label: 'Artisans & Trade', count: counts.trade },
                    { id: 'skills', label: 'Academy & Growth', count: counts.skills },
                    { id: 'finance', label: 'Wallet & Capital', count: counts.finance },
                    { id: 'community', label: 'Community & Chat', count: counts.community },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                            selectedCategory === tab.id
                                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]'
                                : 'bg-card/70 border border-border/70 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        }`}
                    >
                        <span>{tab.label}</span>
                        <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                selectedCategory === tab.id
                                    ? 'bg-white/20 text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Redesigned Modern Immersive Cards Grid - 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFeatures.map((item, index) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="group relative flex flex-col rounded-3xl overflow-hidden border border-border/80 dark:border-white/10 bg-card hover:border-primary/50 dark:hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_22px_45px_rgba(0,0,0,0.14)] dark:hover:shadow-[0_22px_45px_rgba(0,0,0,0.6)] cursor-pointer select-none"
                        >
                            {/* Ambient Dynamic Glow on Card Hover */}
                            <div
                                className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none"
                                style={{ background: item.accentColor }}
                            />

                            {/* TOP REALISTIC PHOTOGRAPHIC HERO SECTION */}
                            <div className="relative h-64 sm:h-72 w-full overflow-hidden text-white flex flex-col justify-between p-5 sm:p-6">
                                {/* Photographic Image with Hover Scale */}
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    priority={index < 3}
                                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                                />

                                {/* Multi-Stage Cinematic Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />
                                <div
                                    className="absolute inset-0 opacity-40 group-hover:opacity-30 transition-opacity duration-500 mix-blend-color"
                                    style={{ background: item.accentColor }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Top Floating Badges */}
                                <div className="relative z-10 flex items-center justify-between gap-2">
                                    {/* Category Pill with Frosted Glass */}
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/50 backdrop-blur-md text-white/95 border border-white/20 shadow-xs">
                                        {item.categoryLabel}
                                    </span>

                                    {/* Status Pill with Pulsing Dot */}
                                    {item.badgeText && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/95 text-slate-900 shadow-md backdrop-blur-md whitespace-nowrap">
                                            <span className={`w-2 h-2 rounded-full ${item.accentDot} animate-pulse`} />
                                            {item.badgeText}
                                        </span>
                                    )}
                                </div>

                                {/* Floating Icon Badge + Title (On Top of Photo with Crystal Clarity) */}
                                <div className="relative z-10 flex items-center gap-3.5 mt-auto">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                                        <Icon className="w-6 h-6 text-white drop-shadow-md" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-display text-[19px] sm:text-[20px] font-black text-white leading-tight tracking-tight drop-shadow-md group-hover:text-white transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-[12px] font-medium text-white/85 truncate mt-0.5 drop-shadow-sm">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* LOWER CARD BODY */}
                            <div className="flex-1 flex flex-col p-5 bg-card/95 dark:bg-[#0c1424]/95 backdrop-blur-xl border-t border-white/10 dark:border-white/5 justify-between">
                                {/* Description */}
                                <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed line-clamp-2 min-h-[38px]">
                                    {item.description}
                                </p>

                                {/* Modern Feature Micro-Chips (Scannable & Clean) */}
                                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border/60">
                                    {item.highlights.map((h, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-muted/70 dark:bg-white/5 border border-border/60 dark:border-white/10 text-foreground/80 group-hover:border-primary/30 transition-colors"
                                        >
                                            <span
                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                style={{ background: item.accentColor }}
                                            />
                                            <span className="truncate">{h}</span>
                                        </span>
                                    ))}
                                </div>

                                {/* Refined Action Footer Bar with Heartbeat Icon Pill */}
                                <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between">
                                    <span className="font-extrabold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                        <span>{item.ctaText}</span>
                                    </span>

                                    <div
                                        className={`w-9 h-9 rounded-2xl bg-gradient-to-r ${item.ctaGradient} text-white flex items-center justify-center shadow-md shadow-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:translate-x-1 animate-heartbeat shrink-0`}
                                    >
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {filteredFeatures.length === 0 && (
                <div className="py-14 text-center rounded-3xl border border-dashed border-border bg-card/50 backdrop-blur-md">
                    <p className="text-sm font-semibold text-muted-foreground">No features matched &quot;{searchQuery}&quot;</p>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCategory('all')
                            setSearchQuery('')
                        }}
                        className="mt-3 text-xs text-primary font-bold hover:underline cursor-pointer"
                    >
                        Reset filters
                    </button>
                </div>
            )}
        </section>
    )
}
