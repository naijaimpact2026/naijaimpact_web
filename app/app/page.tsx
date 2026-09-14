import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchCourses } from '@/lib/actions/learn'
import HomeRightSidebar from '@/components/app/home/HomeRightSidebar'
import HeroIllustration from '@/components/illustrations/HeroIllustration'
import CourseIllustration from '@/components/illustrations/CourseIllustration'
import JobsIllustration from '@/components/illustrations/JobsIllustration'
import MarketIllustration from '@/components/illustrations/MarketIllustration'
import FundingIllustration from '@/components/illustrations/FundingIllustration'
import type { User } from '@/lib/types'
import
{
    BookOpen,
    Briefcase,
    ShoppingBag,
    Rocket,
    Wallet,
    Users,
    Wrench,
    HandCoins,
    ArrowRight,
    PlayCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const QUICK_ACTIONS = [
    { icon: BookOpen, label: 'Learn', href: '/app/learn', tint: 'bg-primary/10 text-primary' },
    { icon: Briefcase, label: 'Jobs', href: null, tint: 'bg-cyan/10 text-cyan' },
    { icon: ShoppingBag, label: 'Marketplace', href: '/app/market', tint: 'bg-amber-500/10 text-amber-600' },
    { icon: Rocket, label: 'Business LaunchPad', href: '/app/services', tint: 'bg-secondary/10 text-secondary' },
    { icon: Wallet, label: 'Save & Wallet', href: '/app/wallet', tint: 'bg-lime/20 text-emerald' },
    { icon: Users, label: 'Community', href: '/app/feed', tint: 'bg-cyan/10 text-cyan' },
    { icon: Wrench, label: 'Artisans & Services', href: '/app/services', tint: 'bg-rose-500/10 text-rose-600' },
    { icon: HandCoins, label: 'Crowdfunding', href: '/app/funding', tint: 'bg-secondary/10 text-secondary' },
]

const TODAY_CARDS = [
    { icon: BookOpen, title: 'Learn a Skill', sub: 'Access free and premium courses', href: '/app/learn', tint: 'bg-primary/10 text-primary' },
    { icon: Briefcase, title: 'Find a Job', sub: 'Explore thousands of opportunities', href: null, tint: 'bg-cyan/10 text-cyan' },
    { icon: ShoppingBag, title: 'Shop Products', sub: 'Buy from trusted sellers', href: '/app/market', tint: 'bg-amber-500/10 text-amber-600' },
    { icon: Rocket, title: 'Start a Business', sub: 'Get tools, funding and support', href: '/app/services', tint: 'bg-secondary/10 text-secondary' },
    { icon: Wrench, title: 'Hire an Artisan', sub: 'Find skilled professionals', href: '/app/services', tint: 'bg-rose-500/10 text-rose-600' },
    { icon: Wallet, title: 'Save & Grow', sub: 'Build your financial future', href: '/app/wallet', tint: 'bg-lime/20 text-emerald' },
]

function timeAgo(dateStr: string): string
{
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

export default async function HomePage()
{
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single()

    // No `users` row yet for this auth account — send them to finish onboarding
    // instead of `/auth/login` (which would just bounce them straight back here,
    // since the middleware already treats them as authenticated).
    if (!profile) redirect('/app/settings/onboarding')

    const userProfile = profile as User

    const { courses: latestCourses } = await fetchCourses(null, 1)
    const featuredCourse = latestCourses[0] ?? null

    const firstName = userProfile.display_name.split(' ')[0]

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
            <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0 space-y-6">

                    {/* Welcome hero */}
                    <section
                        className="relative overflow-hidden rounded-3xl border border-border px-6 py-8 sm:px-10 sm:py-10"
                        style={{ background: 'linear-gradient(120deg, #EAF3FE 0%, #F8FAFC 55%, #E6F7FB 100%)' }}
                    >
                        <div className="relative z-10 flex items-center justify-between gap-8">
                            <div className="max-w-sm">
                                <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight text-secondary">
                                    Welcome to Hubnovo, {firstName}
                                </h1>
                                <p className="mt-1.5 text-sm sm:text-base text-primary font-semibold">
                                    People. Opportunities. Prosperity.
                                </p>
                                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                    Learn. Earn. Save. Start. Connect. Make an impact.
                                </p>
                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <Link
                                        href="/app/feed"
                                        className="inline-flex items-center gap-1.5 bg-secondary text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-secondary/90 transition-colors"
                                    >
                                        Explore Opportunities <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <button className="inline-flex items-center gap-1.5 border border-secondary/20 text-secondary font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-secondary/5 transition-colors">
                                        <PlayCircle className="w-4 h-4" /> Watch Video
                                    </button>
                                </div>
                            </div>
                            <HeroIllustration className="hidden md:block w-72 h-56 shrink-0" />
                        </div>
                    </section>

                    {/* Quick actions row */}
                    <section className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
                        {QUICK_ACTIONS.map((item) => (
                            <QuickActionTile key={item.label} {...item} />
                        ))}
                    </section>

                    {/* What would you like to do today */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-display text-lg font-bold text-foreground">What would you like to do today?</h2>
                            <Link href="/app/services" className="text-xs font-medium text-primary hover:underline shrink-0">View All</Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TODAY_CARDS.map((card) => (
                                <TodayCard key={card.title} {...card} />
                            ))}
                        </div>
                    </section>

                    {/* Featured opportunities */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-display text-lg font-bold text-foreground">Featured Opportunities</h2>
                            <Link href="/app/feed" className="text-xs font-medium text-primary hover:underline shrink-0">See All</Link>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <OpportunityCard
                                illustration={<CourseIllustration className="w-full h-full" />}
                                tag="Trending"
                                tagClass="bg-primary text-white"
                                title={featuredCourse ? featuredCourse.title : 'Free Digital Skills Training'}
                                sub="Learn in-demand skills and boost your career."
                                meta={featuredCourse ? [`${featuredCourse.is_free ? 'Free' : 'Paid'}`, timeAgo(featuredCourse.created_at)] : ['Online', 'Free']}
                                cta="Join Now"
                                href="/app/learn"
                            />
                            <OpportunityCard
                                illustration={<JobsIllustration className="w-full h-full" />}
                                tag="Hot"
                                tagClass="bg-destructive text-white"
                                title="Remote Job Opportunities"
                                sub="Work from anywhere. Global opportunities."
                                meta={['Worldwide', 'Various']}
                                cta="Coming Soon"
                                href={null}
                            />
                            <OpportunityCard
                                illustration={<MarketIllustration className="w-full h-full" />}
                                tag="Featured"
                                tagClass="bg-cyan text-white"
                                title="Support Small Businesses"
                                sub="Shop from local entrepreneurs and make an impact."
                                meta={['Nationwide', 'Verified']}
                                cta="Shop Now"
                                href="/app/market"
                            />
                            <OpportunityCard
                                illustration={<FundingIllustration className="w-full h-full" />}
                                tag="Impact"
                                tagClass="bg-secondary text-white"
                                title="Fund a Community Project"
                                sub="Help provide clean water in rural communities."
                                meta={['Community', 'Goal-based']}
                                cta="Support Now"
                                href="/app/funding"
                            />
                        </div>
                    </section>
                </div>

                <HomeRightSidebar user={userProfile} />
            </div>
        </div>
    )
}

function QuickActionTile({ icon: Icon, label, href, tint }: { icon: typeof BookOpen; label: string; href: string | null; tint: string })
{
    const body = (
        <>
            <div className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${tint}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2">{label}</span>
        </>
    )

    if (!href)
    {
        return (
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-default">
                {body}
            </div>
        )
    }

    return (
        <Link href={href} className="flex flex-col items-center gap-1.5 group">
            {body}
        </Link>
    )
}

function TodayCard({ icon: Icon, title, sub, href, tint }: { icon: typeof BookOpen; title: string; sub: string; href: string | null; tint: string })
{
    const content = (
        <div className="h-full rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/40 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{sub}</p>
            </div>
            <span className={`mt-auto inline-flex items-center gap-1 text-xs font-semibold ${href ? 'text-primary' : 'text-muted-foreground'}`}>
                {href ? 'Get Started' : 'Coming Soon'} {href && <ArrowRight className="w-3 h-3" />}
            </span>
        </div>
    )

    if (!href) return <div className="opacity-70">{content}</div>

    return <Link href={href}>{content}</Link>
}

function OpportunityCard({
    illustration,
    tag,
    tagClass,
    title,
    sub,
    meta,
    cta,
    href,
}: {
    illustration: React.ReactNode
    tag: string
    tagClass: string
    title: string
    sub: string
    meta: string[]
    cta: string
    href: string | null
})
{
    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-32 w-full">
                {illustration}
                <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${tagClass}`}>
                    {tag}
                </span>
            </div>
            <div className="p-4">
                <h3 className="text-sm font-bold text-foreground leading-tight">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{sub}</p>
                <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
                    {meta.map((m) => <span key={m}>{m}</span>)}
                </div>
                {href ? (
                    <Link
                        href={href}
                        className="mt-3 inline-flex w-full items-center justify-center bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
                    >
                        {cta}
                    </Link>
                ) : (
                    <span className="mt-3 inline-flex w-full items-center justify-center bg-muted text-muted-foreground text-xs font-bold px-4 py-2 rounded-full cursor-default">
                        {cta}
                    </span>
                )}
            </div>
        </div>
    )
}
