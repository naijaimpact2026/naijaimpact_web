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
    headerGradient: string
    accentDot: string
    checkBg: string
    checkText: string
    ctaColor: string
    imageUrl: string
}

export const PLATFORM_FEATURES: PlatformFeature[] = [
    {
        id: 'artisans',
        title: 'Artisans & Skilled Pros',
        subtitle: 'Verified local technicians & craft specialists',
        category: 'trade',
        categoryLabel: 'Verified Services',
        description: 'Connect with verified electricians, carpenters, plumbers, tech specialists, and tailoring professionals across Nigeria.',
        highlights: [
            'Verified identity & portfolio check',
            'Direct in-app messaging & calls',
            'Milestone escrow safe payments',
        ],
        href: '/app/artisans',
        ctaText: 'Find an Artisan',
        icon: Wrench,
        badgeText: 'High Demand',
        headerGradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 45%, #dc2626 100%)',
        accentDot: 'bg-amber-400',
        checkBg: 'bg-amber-500/15 dark:bg-amber-500/25',
        checkText: 'text-amber-500 dark:text-amber-400',
        ctaColor: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950/20',
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
            'Instagram-style visual media feed',
            'Topic channels (#tech, #artisans)',
            'Real-time notifications & safety',
        ],
        href: '/app/feed',
        ctaText: 'Join the Conversation',
        icon: Users,
        badgeText: 'Active Hub',
        headerGradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0284c7 100%)',
        accentDot: 'bg-sky-400',
        checkBg: 'bg-blue-500/15 dark:bg-blue-500/25',
        checkText: 'text-blue-500 dark:text-blue-400',
        ctaColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-950/20',
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
            'Escrow-backed checkout safety',
            'Verified merchant trust ratings',
            'Instant buyer-seller direct chat',
        ],
        href: '/app/market',
        ctaText: 'Explore Marketplace',
        icon: ShoppingBag,
        badgeText: 'Escrow Protected',
        headerGradient: 'linear-gradient(135deg, #0d9488 0%, #059669 50%, #0891b2 100%)',
        accentDot: 'bg-emerald-400',
        checkBg: 'bg-teal-500/15 dark:bg-teal-500/25',
        checkText: 'text-teal-500 dark:text-teal-400',
        ctaColor: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-950/20',
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
            'Free & premium certified courses',
            'Playable live hover video previews',
            'Downloadable curriculum resources',
        ],
        href: '/app/learn',
        ctaText: 'Start Learning',
        icon: BookOpen,
        badgeText: 'Video Preview',
        headerGradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)',
        accentDot: 'bg-violet-400',
        checkBg: 'bg-violet-500/15 dark:bg-violet-500/25',
        checkText: 'text-violet-500 dark:text-violet-400',
        ctaColor: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-purple-950/20',
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
            'Verified employer job listings',
            'One-click fast application flow',
            'Direct recruiter & hiring chat',
        ],
        href: '/app/jobs',
        ctaText: 'Explore Opportunities',
        icon: Briefcase,
        badgeText: 'Hiring Now',
        headerGradient: 'linear-gradient(135deg, #0284c7 0%, #2563eb 55%, #1e40af 100%)',
        accentDot: 'bg-blue-400',
        checkBg: 'bg-sky-500/15 dark:bg-sky-500/25',
        checkText: 'text-sky-500 dark:text-sky-400',
        ctaColor: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-950/20',
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
            'CAC enterprise registration guide',
            'Brand identity & pitch deck kits',
            '1-on-1 verified mentor bookings',
        ],
        href: '/app/services',
        ctaText: 'Launch Your Business',
        icon: Rocket,
        badgeText: 'CAC Support',
        headerGradient: 'linear-gradient(135deg, #e11d48 0%, #db2777 50%, #ea580c 100%)',
        accentDot: 'bg-rose-400',
        checkBg: 'bg-rose-500/15 dark:bg-rose-500/25',
        checkText: 'text-rose-500 dark:text-rose-400',
        ctaColor: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-950/20',
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
            'Multi-channel instant funding',
            'Automated locked target savings',
            'Escrow milestone release control',
        ],
        href: '/app/wallet',
        ctaText: 'Manage Your Funds',
        icon: Wallet,
        badgeText: '0% Escrow Fee',
        headerGradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #0d9488 100%)',
        accentDot: 'bg-emerald-400',
        checkBg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
        checkText: 'text-emerald-500 dark:text-emerald-400',
        ctaColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/20',
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
            'Community-backed funding pools',
            'Verified campaign integrity audit',
            'Direct donor progress broadcast',
        ],
        href: '/app/funding',
        ctaText: 'Discover Grants',
        icon: HandCoins,
        badgeText: 'Micro-Grants',
        headerGradient: 'linear-gradient(135deg, #0891b2 0%, #0284c7 50%, #2563eb 100%)',
        accentDot: 'bg-cyan-400',
        checkBg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
        checkText: 'text-cyan-500 dark:text-cyan-400',
        ctaColor: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/20',
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
            'Instant voice notes recording',
            'High-fidelity photo attachments',
            'End-to-end delivery reliability',
        ],
        href: '/app/chat',
        ctaText: 'Open Messages',
        icon: MessageSquare,
        badgeText: 'Voice Notes',
        headerGradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #9333ea 100%)',
        accentDot: 'bg-indigo-400',
        checkBg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
        checkText: 'text-indigo-500 dark:text-indigo-400',
        ctaColor: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-950/20',
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

            {/* Premium Photographic Feature Cards Grid - 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFeatures.map((item, index) => {
                    const Icon = item.icon
                    return (
                        <div
                            key={item.id}
                            className="group relative flex flex-col rounded-3xl overflow-hidden border border-border/80 bg-card hover:border-primary/50 dark:hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl shadow-sm"
                        >
                            {/* TOP REALISTIC PHOTOGRAPHIC HEADER */}
                            <div className="relative h-56 w-full overflow-hidden text-white flex flex-col justify-between p-5">
                                {/* Realistic Background Photography */}
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    priority={index < 3}
                                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                                />

                                {/* Dual-Layer Gradient & Contrast Overlays */}
                                <div
                                    className="absolute inset-0 opacity-75 group-hover:opacity-65 transition-opacity duration-500 mix-blend-multiply"
                                    style={{ background: item.headerGradient }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25 pointer-events-none" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Top Badges Row */}
                                <div className="relative z-10 flex items-center justify-between gap-2">
                                    {/* Category Pill with Frosted Glass */}
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/50 backdrop-blur-md text-white border border-white/20 shadow-xs">
                                        {item.categoryLabel}
                                    </span>

                                    {/* Status Badge Pill */}
                                    {item.badgeText && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/95 text-slate-900 shadow-md backdrop-blur-md whitespace-nowrap">
                                            <span className={`w-2 h-2 rounded-full ${item.accentDot} animate-pulse`} />
                                            {item.badgeText}
                                        </span>
                                    )}
                                </div>

                                {/* Icon & Title Row on Background */}
                                <div className="relative z-10 flex items-center gap-3.5 mt-auto">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 group-hover:bg-white/30 transition-all duration-300">
                                        <Icon className="w-6 h-6 text-white drop-shadow-md" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-display text-[19px] sm:text-[20px] font-black text-white leading-tight tracking-tight drop-shadow-md">
                                            {item.title}
                                        </h3>
                                        <p className="text-[12px] font-medium text-white/90 truncate mt-0.5 drop-shadow-sm">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* LOWER BODY: Dark / Glass Card */}
                            <div className="flex-1 flex flex-col p-6 pt-5 bg-card/95 dark:bg-[#0c1424]/95 backdrop-blur-xl border-t border-white/10 dark:border-white/5">
                                {/* Description */}
                                <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed min-h-[38px] line-clamp-2">
                                    {item.description}
                                </p>

                                {/* Highlights Checklist with Circular Checkmarks */}
                                <ul className="mt-4 pt-4 border-t border-border/60 space-y-2.5">
                                    {item.highlights.map((h, i) => (
                                        <li key={i} className="flex items-center gap-2.5 text-xs font-semibold text-foreground/90">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.checkBg} ${item.checkText}`}>
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                            <span className="leading-tight">{h}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Themed Full-Width CTA Button with Heartbeat Animation */}
                                <div className="mt-6 pt-2 mt-auto">
                                    <Link
                                        href={item.href}
                                        style={{ animationDelay: `${(index % 3) * 0.4}s` }}
                                        className={`inline-flex items-center justify-between w-full px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 group-hover:shadow-lg active:scale-[0.98] animate-heartbeat ${item.ctaColor}`}
                                    >
                                        <span>{item.ctaText}</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
                                    </Link>
                                </div>
                            </div>
                        </div>
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
