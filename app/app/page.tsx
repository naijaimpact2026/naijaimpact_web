import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { fetchCourses } from '@/lib/actions/learn'
import HomeRightSidebar from '@/components/app/home/HomeRightSidebar'
import HeroIllustration from '@/components/illustrations/HeroIllustration'
import EcosystemTeaserBanner from '@/components/app/home/EcosystemTeaserBanner'
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
    { icon: Briefcase, label: 'Jobs', href: '/app/jobs', tint: 'bg-cyan/10 text-cyan' },
    { icon: ShoppingBag, label: 'Marketplace', href: '/app/market', tint: 'bg-amber-500/10 text-amber-600' },
    { icon: Rocket, label: 'Business LaunchPad', href: '/app/services', tint: 'bg-secondary/10 text-secondary' },
    { icon: Wallet, label: 'Save & Wallet', href: '/app/wallet', tint: 'bg-lime/20 text-emerald' },
    { icon: Users, label: 'Community', href: '/app/feed', tint: 'bg-cyan/10 text-cyan' },
    { icon: Wrench, label: 'Artisans & Services', href: '/app/artisans', tint: 'bg-rose-500/10 text-rose-600' },
    { icon: HandCoins, label: 'Crowdfunding', href: '/app/funding', tint: 'bg-secondary/10 text-secondary' },
]

const TODAY_CARDS = [
    { icon: BookOpen, title: 'Learn a Skill', sub: 'Access free and premium courses', href: '/app/learn', tint: 'bg-primary/10 text-primary', bannerGradient: 'from-blue-600/20 via-indigo-600/10 to-transparent' },
    { icon: Briefcase, title: 'Find a Job', sub: 'Explore thousands of opportunities', href: '/app/jobs', tint: 'bg-cyan/10 text-cyan', bannerGradient: 'from-cyan-600/20 via-sky-600/10 to-transparent' },
    { icon: ShoppingBag, title: 'Shop Products', sub: 'Buy from trusted sellers', href: '/app/market', tint: 'bg-amber-500/10 text-amber-600', bannerGradient: 'from-amber-600/20 via-orange-600/10 to-transparent' },
    { icon: Rocket, title: 'Start a Business', sub: 'Get tools, funding and support', href: '/app/services', tint: 'bg-secondary/10 text-secondary', bannerGradient: 'from-purple-600/20 via-pink-600/10 to-transparent' },
    { icon: Wrench, title: 'Hire an Artisan', sub: 'Find skilled professionals', href: '/app/artisans', tint: 'bg-rose-500/10 text-rose-600', bannerGradient: 'from-rose-600/20 via-orange-600/10 to-transparent' },
    { icon: Wallet, title: 'Save & Grow', sub: 'Build your financial future', href: '/app/wallet', tint: 'bg-lime/20 text-emerald', bannerGradient: 'from-emerald-600/20 via-teal-600/10 to-transparent' },
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
    const { authUser, profile } = await getCurrentUser()

    if (!authUser) redirect('/auth/login')

    // No `users` row yet for this auth account — send them to finish onboarding
    // instead of `/auth/login` (which would just bounce them straight back here,
    // since the middleware already treats them as authenticated).
    if (!profile) redirect('/app/settings/onboarding')

    const userProfile = profile

    const { courses: latestCourses } = await fetchCourses(null, 1)
    const featuredCourse = latestCourses[0] ?? null

    const firstName = userProfile.display_name.split(' ')[0]

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
            <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0 space-y-6">

                    {/* Welcome hero */}
                    <section
                        className="relative overflow-hidden rounded-3xl border border-border px-6 py-5 sm:px-8 sm:py-6"
                        style={{ background: 'linear-gradient(120deg, #EAF3FE 0%, #F8FAFC 55%, #E6F7FB 100%)' }}
                    >
                        <div className="relative z-10 flex items-center justify-between gap-6">
                            <div className="max-w-sm">
                                <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight text-secondary">
                                    Welcome to Hubnovo, {firstName}
                                </h1>
                                <p className="mt-1 text-xs sm:text-sm text-primary font-semibold">
                                    People. Opportunities. Prosperity.
                                </p>
                                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    Learn. Earn. Save. Start. Connect. Make an impact.
                                </p>
                                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                    <Link
                                        href="/app/explore"
                                        className="inline-flex items-center gap-1.5 bg-secondary text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full hover:bg-secondary/90 transition-all shadow-xs animate-heartbeat"
                                    >
                                        Explore Opportunities <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <button className="inline-flex items-center gap-1.5 border border-secondary/20 text-secondary font-semibold text-xs sm:text-sm px-4 py-2 rounded-full hover:bg-secondary/5 transition-colors">
                                        <PlayCircle className="w-4 h-4" /> Watch Video
                                    </button>
                                </div>
                            </div>

                            <HeroIllustration className="hidden md:block w-56 h-40 shrink-0" />
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
                            <Link href="/app/explore" className="text-xs font-semibold text-primary hover:underline shrink-0">View All</Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TODAY_CARDS.map((card) => (
                                <TodayCard key={card.title} {...card} />
                            ))}
                        </div>
                    </section>

                    {/* Featured opportunities with authentic African photography */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-display text-lg font-bold text-foreground">Featured Opportunities</h2>
                            <Link href="/app/explore" className="text-xs font-semibold text-primary hover:underline shrink-0">See All</Link>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <OpportunityCard
                                imageUrl="/images/people/african-skills-student.jpg"
                                tag="Trending"
                                tagClass="bg-primary text-white"
                                title={featuredCourse ? featuredCourse.title : 'Free Digital Skills Training'}
                                sub="Master in-demand digital and vocational skills from top African instructors."
                                meta={featuredCourse ? [`${featuredCourse.is_free ? 'Free' : 'Paid'}`, timeAgo(featuredCourse.created_at)] : ['Online', 'Free']}
                                cta="Join Now"
                                href="/app/learn"
                            />
                            <OpportunityCard
                                imageUrl="/images/people/african-jobs-executive.jpg"
                                tag="Hiring"
                                tagClass="bg-blue-600 text-white"
                                title="Verified Career Opportunities"
                                sub="Discover verified tech, remote, and artisan openings across Nigeria with escrow protection."
                                meta={['Lagos · Remote', 'Verified Employers']}
                                cta="Explore Jobs"
                                href="/app/jobs"
                            />
                            <OpportunityCard
                                imageUrl="/images/people/african-market-merchant.jpg"
                                tag="Featured Trade"
                                tagClass="bg-emerald-600 text-white"
                                title="Support Small Businesses"
                                sub="Shop directly from verified local Nigerian artisans, boutiques and merchants."
                                meta={['Nationwide Delivery', '100% Escrow Safe']}
                                cta="Shop Now"
                                href="/app/market"
                            />
                            <OpportunityCard
                                imageUrl="/images/people/nigerian-community-collaborating.jpg"
                                tag="Community Impact"
                                tagClass="bg-rose-600 text-white"
                                title="Fund a Community Project"
                                sub="Back grassroots educational, clean water, and solar tech initiatives across Nigeria."
                                meta={['36 States', 'Goal-based Audit']}
                                cta="Discover Campaigns"
                                href="/app/funding"
                            />
                        </div>
                    </section>

                    {/* Ecosystem Discovery Section linking to /app/explore */}
                    <EcosystemTeaserBanner />
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

function TodayCard({
    icon: Icon,
    title,
    sub,
    href,
    tint,
    bannerGradient,
}: {
    icon: typeof BookOpen
    title: string
    sub: string
    href: string | null
    tint: string
    bannerGradient?: string
})
{
    const content = (
        <div className="group relative h-full rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/50 hover:shadow-md transition-all overflow-hidden">
            {/* Background subtle gradient banner */}
            {bannerGradient && (
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${bannerGradient.replace('/20', '/80').replace('/10', '/60')}`} />
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint} transition-transform group-hover:scale-105`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{sub}</p>
            </div>
            <span className={`mt-auto inline-flex items-center gap-1 text-xs font-semibold ${href ? 'text-primary' : 'text-muted-foreground'}`}>
                {href ? 'Get Started' : 'Coming Soon'} {href && <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />}
            </span>
        </div>
    )

    if (!href) return <div className="opacity-70">{content}</div>

    return <Link href={href}>{content}</Link>
}

function OpportunityCard({
    imageUrl,
    illustration,
    bannerGradient,
    tag,
    tagClass,
    title,
    sub,
    meta,
    cta,
    href,
}: {
    imageUrl?: string
    illustration?: React.ReactNode
    bannerGradient?: string
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
        <div className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300">
            {/* Graphic or Photographic Background Banner */}
            <div className={`relative h-44 w-full overflow-hidden ${!imageUrl ? (bannerGradient || 'bg-slate-900') : 'bg-slate-900'}`}>
                {imageUrl ? (
                    <>
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 pointer-events-none" />
                    </>
                ) : (
                    <>
                        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                        <div className="relative w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                            {illustration}
                        </div>
                    </>
                )}
                <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md ${tagClass}`}>
                    {tag}
                </span>
            </div>
            <div className="p-4">
                <h3 className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{sub}</p>
                <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
                    {meta.map((m) => <span key={m}>{m}</span>)}
                </div>
                {href ? (
                    <Link
                        href={href}
                        className="mt-3 inline-flex w-full items-center justify-center bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-xs group-hover:shadow-md animate-heartbeat"
                    >
                        {cta}
                    </Link>
                ) : (
                    <span className="mt-3 inline-flex w-full items-center justify-center bg-muted text-muted-foreground text-xs font-bold px-4 py-2.5 rounded-xl cursor-default">
                        {cta}
                    </span>
                )}
            </div>
        </div>
    )
}
