'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import {
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    Wrench,
    Briefcase,
    Store,
    ShieldCheck,
    BadgeCheck,
    Star,
    Sparkles,
    ArrowRight,
    MapPin,
    Lock,
    CheckCircle2,
    Zap,
    Users,
    ShoppingBag,
} from 'lucide-react'
import MarketHeroIllustration from '@/components/illustrations/MarketHeroIllustration'

interface MarketHeroCarouselProps {
    searchInput: string
    onSearchChange: (value: string) => void
    onSearchSubmit: (e: React.FormEvent) => void
}

export default function MarketHeroCarousel({
    searchInput,
    onSearchChange,
    onSearchSubmit,
}: MarketHeroCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: 'start',
    })
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const isInputFocusedRef = useRef(false)
    const totalSlides = 5

    useEffect(() => {
        if (!emblaApi) return
        const onSelect = () => {
            setCurrentIndex(emblaApi.selectedScrollSnap())
        }
        emblaApi.on('select', onSelect)
        onSelect()
        return () => {
            emblaApi.off('select', onSelect)
        }
    }, [emblaApi])

    // Auto-advance slides every 6 seconds unless user is hovering or interacting with search
    useEffect(() => {
        if (!emblaApi || isPaused) return
        const timer = setInterval(() => {
            if (!isInputFocusedRef.current) {
                emblaApi.scrollNext()
            }
        }, 6000)
        return () => clearInterval(timer)
    }, [emblaApi, isPaused])

    const goToPrev = useCallback(() => {
        emblaApi?.scrollPrev()
    }, [emblaApi])

    const goToNext = useCallback(() => {
        emblaApi?.scrollNext()
    }, [emblaApi])

    const goToSlide = useCallback((index: number) => {
        emblaApi?.scrollTo(index)
    }, [emblaApi])

    return (
        <section
            className="group relative overflow-hidden rounded-3xl shadow-xl select-none w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
                if (!isInputFocusedRef.current) setIsPaused(false)
            }}
            aria-roledescription="carousel"
            aria-label="Hubnovo Marketplace Highlights"
        >
            {/* Embla Viewport */}
            <div ref={emblaRef} className="overflow-hidden w-full">
                {/* Embla Container */}
                <div className="flex w-full touch-pan-y">
                    {/* ══ SLIDE 1: MAIN MARKETPLACE & SEARCH ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #102A43 0%, #0E6EDC 130%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                                        <Sparkles className="h-3.5 w-3.5" /> Hubnovo Marketplace
                                    </div>
                                    <h2 className="mt-2 font-display text-2xl font-black leading-tight text-white sm:text-3xl">
                                        Buy. Sell. Grow Together.
                                    </h2>
                                    <p className="mt-1.5 max-w-md text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Discover quality products, support local businesses, and unlock new opportunities across Nigeria.
                                    </p>

                                    <form onSubmit={onSearchSubmit} className="mt-4 flex max-w-lg gap-2">
                                        <div className="relative flex-1 min-w-0">
                                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchInput}
                                                onFocus={() => {
                                                    isInputFocusedRef.current = true
                                                    setIsPaused(true)
                                                }}
                                                onBlur={() => {
                                                    isInputFocusedRef.current = false
                                                    setIsPaused(false)
                                                }}
                                                onChange={(e) => onSearchChange(e.target.value)}
                                                placeholder="Search for products, brands or stores…"
                                                className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-gray-900 outline-none ring-0 focus:ring-2 focus:ring-cyan-300 shadow-sm"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="shrink-0 rounded-xl bg-secondary px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-secondary/90 shadow-md cursor-pointer"
                                        >
                                            Search
                                        </button>
                                    </form>

                                    <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                                        <Link
                                            href="/app/market/create"
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-black text-secondary shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Plus className="h-4 w-4" /> List Item
                                        </Link>

                                        <Link
                                            href="/app/market/stores"
                                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-white/30 bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            <Store className="h-4 w-4 text-cyan-200" /> Explore Stores
                                        </Link>
                                    </div>
                                </div>

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-6 sm:-mb-6 lg:-mb-7">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/marketplace-shopper.png"
                                            alt="Hubnovo Marketplace Shopper"
                                            width={500}
                                            height={600}
                                            priority
                                            className="h-52 sm:h-[220px] md:h-[250px] lg:h-[275px] xl:h-[295px] w-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 px-3.5 py-2.5 backdrop-blur-xl shadow-2xl text-white flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shrink-0">
                                                <ShoppingBag className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-white leading-tight">Verified Goods</p>
                                                <p className="text-[11px] text-white/80">Escrow backed trade</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 2: VERIFIED ARTISANS & SKILLED PROS ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #091E3A 0%, #0D4A68 50%, #0891B2 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                                        <Wrench className="h-3.5 w-3.5" /> Hubnovo Artisans & Pros
                                    </div>
                                    <h2 className="mt-2 font-display text-2xl font-black leading-tight text-white sm:text-3xl">
                                        Hire Verified Artisans & Technicians
                                    </h2>
                                    <p className="mt-1.5 max-w-md text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Connect with vetted electricians, plumbers, carpenters, tailors, and mechanics across Nigeria with 100% escrow protection.
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold text-white/90">
                                        {['Electricians', 'Plumbers', 'Tailoring', 'Auto Mechanics', 'AC & Solar'].map((tag) => (
                                            <span key={tag} className="rounded-lg bg-white/15 px-2.5 py-0.5 backdrop-blur-md border border-white/20 text-[11px]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                        <Link
                                            href="/app/artisans"
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-black text-cyan-900 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Wrench className="h-4 w-4 text-cyan-600" /> Hire an Artisan
                                        </Link>

                                        <Link
                                            href="/app/market/create"
                                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-white/30 bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            List Your Trade
                                        </Link>
                                    </div>
                                </div>

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-6 sm:-mb-6 lg:-mb-7">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/artisan-electrician.png"
                                            alt="Emmanuel Okon - Certified Artisan Technician"
                                            width={500}
                                            height={600}
                                            className="h-52 sm:h-[220px] md:h-[250px] lg:h-[275px] xl:h-[295px] w-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl text-white min-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                                    <Wrench className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-black text-white text-xs truncate">Emmanuel O.</span>
                                                        <BadgeCheck className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                                                    </div>
                                                    <p className="text-[11px] text-cyan-100 truncate">Certified Solar Tech</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-1.5 text-xs">
                                                <span className="text-amber-300 font-bold flex items-center gap-1">
                                                    <Star className="h-3 w-3 fill-amber-300" /> 4.9 ★
                                                </span>
                                                <span className="text-emerald-300 font-bold">100% Escrow</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 3: DIGITAL STOREFRONTS & BRANDS ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #06271C 0%, #0D4A36 50%, #059669 115%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                                        <Store className="h-3.5 w-3.5" /> Digital Merchant Hub
                                    </div>
                                    <h2 className="mt-2 font-display text-2xl font-black leading-tight text-white sm:text-3xl">
                                        Launch Your Mini-Store in 60s
                                    </h2>
                                    <p className="mt-1.5 max-w-md text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Open your branded store, showcase products, and receive direct buyer orders with zero setup fees.
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold text-white/90">
                                        <span className="rounded-lg bg-white/15 px-2.5 py-0.5 backdrop-blur-md border border-white/20 text-[11px]">Custom Store URL</span>
                                        <span className="rounded-lg bg-white/15 px-2.5 py-0.5 backdrop-blur-md border border-white/20 text-[11px]">0% Commission Starting</span>
                                        <span className="rounded-lg bg-white/15 px-2.5 py-0.5 backdrop-blur-md border border-white/20 text-[11px]">Direct Buyer Chat</span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                        <Link
                                            href="/app/market/stores"
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-black text-emerald-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Store className="h-4 w-4 text-emerald-600" /> Explore Storefronts
                                        </Link>

                                        <Link
                                            href="/app/market/stores"
                                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-white/30 bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Open Your Store
                                        </Link>
                                    </div>
                                </div>

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-6 sm:-mb-6 lg:-mb-7">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/store-merchant.png"
                                            alt="Hubnovo Digital Merchant"
                                            width={500}
                                            height={600}
                                            className="h-52 sm:h-[220px] md:h-[250px] lg:h-[275px] xl:h-[295px] w-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl text-white min-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                                    <Store className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-black text-white text-xs truncate">Live Store</span>
                                                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                                                    </div>
                                                    <p className="text-[11px] text-emerald-100 truncate">0% Setup Fee</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-1.5 text-xs">
                                                <span className="text-white/80">Setup in 60s</span>
                                                <span className="text-emerald-300 font-bold">Instant Orders</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 4: JOBS & CAREER OPPORTUNITIES ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #0B1528 0%, #1E295D 50%, #3B82F6 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-200">
                                        <Briefcase className="h-3.5 w-3.5" /> Careers & Gigs Hub
                                    </div>
                                    <h2 className="mt-2 font-display text-2xl font-black leading-tight text-white sm:text-3xl">
                                        Discover Jobs & Hire Top Talent
                                    </h2>
                                    <p className="mt-1.5 max-w-md text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Explore verified full-time roles, remote gigs, and contract projects with guaranteed escrow milestones.
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold text-white/90">
                                        <span className="rounded-lg bg-white/15 px-2.5 py-0.5 backdrop-blur-md border border-white/20 text-[11px]">Remote Work</span>
                                        <span className="rounded-lg bg-white/15 px-2.5 py-0.5 backdrop-blur-md border border-white/20 text-[11px]">Verified Employers</span>
                                        <span className="rounded-lg bg-white/15 px-2.5 py-0.5 backdrop-blur-md border border-white/20 text-[11px]">1-Click Fast Apply</span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                        <Link
                                            href="/app/jobs"
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-black text-blue-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Briefcase className="h-4 w-4 text-blue-600" /> Explore Opportunities
                                        </Link>

                                        <Link
                                            href="/app/jobs?tab=my_posts"
                                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-white/30 bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Post a Job Opening
                                        </Link>
                                    </div>
                                </div>

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-6 sm:-mb-6 lg:-mb-7">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/jobs-professional.png"
                                            alt="Top Nigerian Tech & Professional Talent"
                                            width={500}
                                            height={600}
                                            className="h-52 sm:h-[220px] md:h-[250px] lg:h-[275px] xl:h-[295px] w-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl text-white min-w-[210px]">
                                            <div className="flex items-center justify-between gap-1.5 text-xs">
                                                <span className="rounded bg-blue-500/30 px-2 py-0.5 font-bold text-blue-200 border border-blue-400/30 text-[11px]">
                                                    Verified Role
                                                </span>
                                                <span className="text-emerald-300 font-bold">₦450k - ₦750k</span>
                                            </div>
                                            <p className="mt-1 font-black text-white text-xs truncate">Software & Product Roles</p>
                                            <div className="mt-1.5 flex items-center justify-between border-t border-white/15 pt-1.5 text-[10px] text-white/80">
                                                <span>1-Click Apply</span>
                                                <span className="text-cyan-300 font-bold">Direct Chat</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 5: 100% ESCROW & SAFE TRADE ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #131233 0%, #311568 50%, #7C3AED 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-200">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Escrow Protection
                                    </div>
                                    <h2 className="mt-2 font-display text-2xl font-black leading-tight text-white sm:text-3xl">
                                        100% Protected Milestones & Escrow
                                    </h2>
                                    <p className="mt-1.5 max-w-md text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Trade with peace of mind. Buyer funds remain securely locked until orders are delivered and verified satisfactory.
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold text-white/90">
                                        <span className="rounded-lg bg-white/15 px-2.5 py-0.5 backdrop-blur-md border border-white/20 text-[11px]">Zero Fraud Guarantee</span>
                                        <span className="rounded-lg bg-white/15 px-2.5 py-0.5 backdrop-blur-md border border-white/20 text-[11px]">Automatic Release</span>
                                        <span className="rounded-lg bg-white/15 px-2.5 py-0.5 backdrop-blur-md border border-white/20 text-[11px]">24/7 Dispute Support</span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                        <Link
                                            href="/app/market/orders"
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-black text-purple-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <ShieldCheck className="h-4 w-4 text-purple-600" /> View Protected Orders
                                        </Link>

                                        <Link
                                            href="/app/wallet"
                                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-white/30 bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Escrow Wallet
                                        </Link>
                                    </div>
                                </div>

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-6 sm:-mb-6 lg:-mb-7">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/escrow-trust-agent.png"
                                            alt="100% Verified Escrow Officer"
                                            width={500}
                                            height={600}
                                            className="h-52 sm:h-[220px] md:h-[250px] lg:h-[275px] xl:h-[295px] w-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl text-white min-w-[210px]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                                    <ShieldCheck className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-black text-white text-xs truncate">100% Escrow Shield</p>
                                                    <p className="text-[11px] text-purple-200 truncate">Milestone Protected</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-1.5 text-xs">
                                                <span className="text-white/80">Zero Risk Trade</span>
                                                <span className="text-emerald-300 font-bold">Funds Safe</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ NAVIGATION ARROWS ══ */}
            <button
                type="button"
                onClick={goToPrev}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105 active:scale-95 shadow-md border border-white/20 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            <button
                type="button"
                onClick={goToNext}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105 active:scale-95 shadow-md border border-white/20 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
            >
                <ChevronRight className="h-4 w-4" />
            </button>

            {/* ══ INDICATOR DOTS ══ */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            currentIndex === idx
                                ? 'w-6 bg-white shadow-md'
                                : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                    />
                ))}
            </div>
        </section>
    )
}
