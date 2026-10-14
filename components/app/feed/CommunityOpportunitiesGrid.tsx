'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import
{
    Briefcase,
    GraduationCap,
    Coins,
    Building2,
    Calendar,
    MapPin,
    ArrowUpRight,
    Sparkles,
    BadgeCheck,
    Search,
    Clock,
    Filter,
    Plus,
} from 'lucide-react'

interface Opportunity
{
    id: string
    title: string
    organization: string
    isVerified: boolean
    category: 'grant' | 'job' | 'training' | 'partnership'
    categoryLabel: string
    categoryColor: string
    location: string
    rewardOrSalary: string
    deadline: string
    deadlineTag: string
    description: string
    link: string
    ctaText: string
}

const OPPORTUNITIES_DATA: Opportunity[] = [
    {
        id: 'grant-tech-1',
        title: 'Naija Impact Innovation Grant 2026',
        organization: 'Hubnovo Impact Foundation',
        isVerified: true,
        category: 'grant',
        categoryLabel: 'Equity-Free Grant',
        categoryColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        location: 'Nationwide (Nigeria)',
        rewardOrSalary: '₦2,500,000 Non-Dilutive',
        deadline: 'Nov 15, 2026',
        deadlineTag: 'Ending soon',
        description: 'Empowering Nigerian grassroots tech solutions and micro-enterprises tackling youth employment and local supply chains.',
        link: '/app/funding',
        ctaText: 'Apply for Grant',
    },
    {
        id: 'job-dev-1',
        title: 'Full-Stack Next.js & React Native Lead',
        organization: 'Apex Fintech Solutions',
        isVerified: true,
        category: 'job',
        categoryLabel: 'Remote Full-Time',
        categoryColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        location: 'Remote (Lagos / Abuja)',
        rewardOrSalary: '₦850,000 - ₦1,200,000 / mo',
        deadline: 'Nov 02, 2026',
        deadlineTag: 'Active Hiring',
        description: 'Seeking a senior engineer to drive high-throughput mobile and web interfaces with real-time financial transaction streams.',
        link: '/app/market/jobs',
        ctaText: 'View Job Details',
    },
    {
        id: 'training-ai-1',
        title: 'Applied AI & Cloud Automation Fellowship',
        organization: 'Hubnovo Academy & Partners',
        isVerified: true,
        category: 'training',
        categoryLabel: 'Full Scholarship',
        categoryColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        location: 'Online Cohort',
        rewardOrSalary: '100% Free Scholarship',
        deadline: 'Oct 30, 2026',
        deadlineTag: 'Last 12 slots',
        description: 'Hands-on 10-week intensive program training Nigerian developers in generative models, cloud architecture, and client engineering.',
        link: '/app/learn',
        ctaText: 'Enroll Now',
    },
    {
        id: 'partnership-cac-1',
        title: 'CAC SME Formalization & Tax Incentive Subsidy',
        organization: 'Corporate Affairs & Hubnovo Launchpad',
        isVerified: true,
        category: 'partnership',
        categoryLabel: 'Business Subsidy',
        categoryColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        location: 'All 36 States & FCT',
        rewardOrSalary: '50% Govt Registration Subsidy',
        deadline: 'Dec 31, 2026',
        deadlineTag: 'Open Enrolment',
        description: 'Get your business name or limited company officially registered with TIN, bank opening support, and free escrow protections.',
        link: '/app/services',
        ctaText: 'Register Business',
    },
    {
        id: 'job-design-1',
        title: 'Senior Product & Brand Identity Designer',
        organization: 'Kreative Guild Studios',
        isVerified: true,
        category: 'job',
        categoryLabel: 'Contract Gig',
        categoryColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        location: 'Hybrid (Lagos Island)',
        rewardOrSalary: '₦450,000 - ₦600,000 / project',
        deadline: 'Nov 08, 2026',
        deadlineTag: 'Urgent',
        description: 'Revamping enterprise customer experiences and brand assets for emerging pan-African agro-processing and logistics hubs.',
        link: '/app/market/jobs',
        ctaText: 'Submit Portfolio',
    },
    {
        id: 'grant-agri-1',
        title: 'Agro-Innovators Cold Chain Micro-Fund',
        organization: 'AgriGrowth Trust Nigeria',
        isVerified: true,
        category: 'grant',
        categoryLabel: 'Equipment Grant',
        categoryColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        location: 'North & South-West Nigeria',
        rewardOrSalary: '₦1,800,000 In-Kind Equipment',
        deadline: 'Nov 20, 2026',
        deadlineTag: 'New Call',
        description: 'Providing solar-powered storage and processing refrigeration for smallholder farming collectives and food markets.',
        link: '/app/funding',
        ctaText: 'Submit Application',
    },
]

type CategoryFilter = 'all' | 'grant' | 'job' | 'training' | 'partnership'

interface CommunityOpportunitiesGridProps
{
    onOpenComposer?: () => void
}

export default function CommunityOpportunitiesGrid({ onOpenComposer }: CommunityOpportunitiesGridProps = {})
{
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredOpportunities = useMemo(() =>
    {
        return OPPORTUNITIES_DATA.filter((opp) =>
        {
            if (selectedCategory !== 'all' && opp.category !== selectedCategory) return false
            if (searchQuery.trim())
            {
                const q = searchQuery.toLowerCase()
                return (
                    opp.title.toLowerCase().includes(q) ||
                    opp.organization.toLowerCase().includes(q) ||
                    opp.description.toLowerCase().includes(q) ||
                    opp.location.toLowerCase().includes(q)
                )
            }
            return true
        })
    }, [selectedCategory, searchQuery])

    return (
        <div className="space-y-4">
            {/* Header banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-secondary via-secondary/95 to-primary text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="max-w-md">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-md mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Curated Opportunities</span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight leading-tight">
                        Grants, Jobs & Platform Upgrades
                    </h2>
                    <p className="text-white/80 text-xs sm:text-sm mt-1 leading-relaxed">
                        Verified funding calls, tech gigs, artisan opportunities, and subsidies across Nigeria.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {onOpenComposer && (
                        <button
                            type="button"
                            onClick={onOpenComposer}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white text-secondary font-bold text-xs sm:text-sm shadow-md hover:bg-white/90 active:scale-95 transition-all animate-heartbeat cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Post Opportunity</span>
                        </button>
                    )}
                    <Link
                        href="/app/explore"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-sm active:scale-95 transition-all"
                    >
                        <span>All Features</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Controls: Search and category filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                    {[
                        { id: 'all', label: 'All Opportunities' },
                        { id: 'grant', label: 'Grants & Capital' },
                        { id: 'job', label: 'Jobs & Gigs' },
                        { id: 'training', label: 'Skills & Academy' },
                        { id: 'partnership', label: 'Subsidies' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === tab.id
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search opportunities…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                    />
                </div>
            </div>

            {/* Opportunities cards grid */}
            {filteredOpportunities.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-3xl border border-border bg-card">
                    <p className="font-bold text-sm text-foreground">No matching opportunities found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or category filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredOpportunities.map((opp) => (
                        <div
                            key={opp.id}
                            className="bg-card rounded-3xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-2.5">
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${opp.categoryColor}`}
                                    >
                                        {opp.categoryLabel}
                                    </span>

                                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                        <Clock className="w-3 h-3" />
                                        <span>{opp.deadlineTag}</span>
                                    </div>
                                </div>

                                <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                                    {opp.title}
                                </h3>

                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                                    <span className="font-medium text-foreground/90">{opp.organization}</span>
                                    {opp.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5 text-[11px]">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        {opp.location}
                                    </span>
                                </div>

                                <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">
                                    {opp.description}
                                </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-border/80 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        Value / Compensation
                                    </p>
                                    <p className="text-xs font-black text-foreground mt-0.5">
                                        {opp.rewardOrSalary}
                                    </p>
                                </div>

                                <Link
                                    href={opp.link}
                                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-xs animate-heartbeat"
                                >
                                    <span>{opp.ctaText}</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
