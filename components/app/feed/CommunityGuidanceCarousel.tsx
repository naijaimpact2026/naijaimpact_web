'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import
{
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel'
import
{
    Sparkles,
    Briefcase,
    Wrench,
    Radio,
    ArrowRight,
    Lightbulb,
    Compass,
    MessageSquare,
    Network,
    Rocket,
} from 'lucide-react'

interface GuidanceSlide
{
    id: string
    title: string
    subtitle: string
    description: string
    ctaText: string
    ctaLink: string
    icon: typeof Sparkles
    badge: string
    bgGradient: string
    featureList?: { icon: typeof Sparkles; label: string }[]
}

const GUIDANCE_SLIDES: GuidanceSlide[] = [
    {
        id: 'welcome',
        badge: 'Hubnovo Community',
        title: 'People. Ideas. Opportunities. A Brighter Tomorrow.',
        subtitle: 'Connect, share, learn and grow with a vibrant national network.',
        description: 'Share your achievements, collaborate with creators and artisans, discover verified opportunities, and shape Africa’s future together.',
        ctaText: 'Explore Ecosystem',
        ctaLink: '/app/explore',
        icon: Sparkles,
        bgGradient: 'from-blue-700 via-indigo-700 to-sky-700',
        featureList: [
            { icon: Lightbulb, label: 'Share Ideas' },
            { icon: Compass, label: 'Find Opportunities' },
            { icon: MessageSquare, label: 'Join Discussions' },
            { icon: Network, label: 'Build Networks' },
            { icon: Rocket, label: 'Create Impact' },
        ],
    },
    {
        id: 'modushive',
        badge: 'Live Audio Spaces',
        title: 'Join Live ModusHive Rooms',
        subtitle: 'Interactive voice discussions & town halls',
        description: 'Participate in audio sessions on business growth, tech careers, creative arts, and cooperative wealth building with industry leaders.',
        ctaText: 'Enter ModusHive',
        ctaLink: '/app/modushive',
        icon: Radio,
        bgGradient: 'from-purple-700 via-violet-700 to-pink-700',
        featureList: [
            { icon: Radio, label: 'Interactive Audio' },
            { icon: Lightbulb, label: 'Industry Insights' },
            { icon: Network, label: 'Cooperative Wealth' },
            { icon: MessageSquare, label: 'Live Q&A' },
            { icon: Rocket, label: 'Founder Panels' },
        ],
    },
    {
        id: 'artisans',
        badge: 'Verified Services',
        title: 'Discover Skilled Artisans & Pros',
        subtitle: 'Verified local technicians & professionals',
        description: 'Need a trusted electrician, fashion designer, plumber, or consultant? Hire vetted artisans or list your own service to start earning.',
        ctaText: 'Browse Artisans',
        ctaLink: '/app/artisans',
        icon: Wrench,
        bgGradient: 'from-amber-600 via-orange-600 to-rose-700',
        featureList: [
            { icon: Wrench, label: 'Verified Artisans' },
            { icon: Compass, label: 'Milestone Escrow' },
            { icon: MessageSquare, label: 'Direct Messaging' },
            { icon: Network, label: 'Nationwide Network' },
            { icon: Rocket, label: 'Work Guarantees' },
        ],
    },
    {
        id: 'jobs-grants',
        badge: 'Career & Grants Hub',
        title: 'Find Grants, Gigs & Career Openings',
        subtitle: 'Accelerate your career & entrepreneurial venture',
        description: 'Access curated job listings, cooperative savings, crowdfunding grants, and training academy courses designed for real impact.',
        ctaText: 'Explore Opportunities',
        ctaLink: '/app/jobs',
        icon: Briefcase,
        bgGradient: 'from-emerald-700 via-teal-700 to-cyan-800',
        featureList: [
            { icon: Briefcase, label: 'Verified Listings' },
            { icon: Compass, label: 'Micro-Grants' },
            { icon: Network, label: 'Training Academy' },
            { icon: Lightbulb, label: 'Fast Application' },
            { icon: Rocket, label: 'Direct Recruiter Chat' },
        ],
    },
]

export default function CommunityGuidanceCarousel()
{
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)

    useEffect(() =>
    {
        if (!api) return

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap())

        api.on('select', () =>
        {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])

    // Auto-scroll every 6.5 seconds with seamless loop
    useEffect(() =>
    {
        if (!api) return
        const interval = setInterval(() =>
        {
            api.scrollNext()
        }, 6500)

        return () => clearInterval(interval)
    }, [api])

    return (
        <section className="relative group rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-border bg-card [transform:translateZ(0)] [-webkit-transform:translateZ(0)] [contain:paint]">
            <Carousel
                setApi={setApi}
                opts={{
                    loop: true,
                    align: 'start',
                    skipSnaps: false,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-0">
                    {GUIDANCE_SLIDES.map((slide) =>
                    {
                        const Icon = slide.icon
                        return (
                            <CarouselItem key={slide.id} className="pl-0">
                                <div
                                    className={`relative px-5 py-6 sm:px-9 sm:py-8 bg-gradient-to-r ${slide.bgGradient} text-white flex flex-col justify-between min-h-[210px] sm:min-h-[230px] md:min-h-[240px] overflow-hidden [transform:translateZ(0)] [-webkit-transform:translateZ(0)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]`}
                                >
                                    {/* Ambient background glow & watermark */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none" />
                                    <Icon className="absolute -right-6 -bottom-6 w-48 h-48 text-white/10 pointer-events-none rotate-12" />

                                    <div className="relative z-10 flex items-start justify-between gap-8">
                                        <div className="max-w-xl">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-md border border-white/20 mb-2.5">
                                                <Icon className="w-3.5 h-3.5" />
                                                <span>{slide.badge}</span>
                                            </div>

                                            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                                                {slide.title}
                                            </h2>
                                            <p className="text-white/85 text-xs sm:text-sm mt-2 leading-relaxed line-clamp-2 max-w-lg">
                                                {slide.description}
                                            </p>
                                        </div>

                                        {/* Desktop Feature Pill Showcase */}
                                        {slide.featureList && (
                                            <div className="hidden lg:flex flex-col gap-2 shrink-0 bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
                                                <ul className="space-y-2">
                                                    {slide.featureList.slice(0, 4).map((f) => (
                                                        <li key={f.label} className="flex items-center gap-2 text-xs font-bold text-white/95">
                                                            <f.icon className="w-3.5 h-3.5 text-white/80 shrink-0" />
                                                            <span>{f.label}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer with CTA and Pagination */}
                                    <div className="relative z-10 mt-5 pt-2 flex items-center justify-between gap-4">
                                        <Link
                                            href={slide.ctaLink}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-secondary font-extrabold text-xs sm:text-sm shadow-md hover:bg-white/95 active:scale-95 transition-all animate-heartbeat group"
                                        >
                                            <span>{slide.ctaText}</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>

                                        {/* Pagination indicator dots */}
                                        <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                            {Array.from({ length: count || GUIDANCE_SLIDES.length }).map((_, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => api?.scrollTo(index)}
                                                    aria-label={`Go to slide ${index + 1}`}
                                                    className={`h-2 rounded-full transition-all duration-300 ${current === index
                                                            ? 'w-7 bg-white shadow-xs'
                                                            : 'w-2 bg-white/40 hover:bg-white/75'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>

                {/* Navigation arrows (desktop visible on hover) */}
                <CarouselPrevious className="hidden sm:flex left-3 top-1/2 -translate-y-1/2 bg-card/85 backdrop-blur-md text-foreground border-border hover:bg-card shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                <CarouselNext className="hidden sm:flex right-3 top-1/2 -translate-y-1/2 bg-card/85 backdrop-blur-md text-foreground border-border hover:bg-card shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20" />
            </Carousel>
        </section>
    )
}
