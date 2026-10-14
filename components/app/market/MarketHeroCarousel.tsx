'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
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
                            className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #102A43 0%, #0E6EDC 130%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                                        <Sparkles className="h-3.5 w-3.5" /> Hubnovo Marketplace
                                    </div>
                                    <h2 className="mt-2 font-display text-3xl font-black leading-tight text-white sm:text-4xl">
                                        Buy. Sell. Grow Together.
                                    </h2>
                                    <p className="mt-2 max-w-md text-sm text-white/80">
                                        Discover quality products, support local businesses, and unlock new opportunities across Nigeria.
                                    </p>

                                    <form onSubmit={onSearchSubmit} className="mt-5 flex max-w-lg gap-2">
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
                                                className="w-full rounded-2xl border-0 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none ring-0 focus:ring-2 focus:ring-cyan-300 shadow-sm"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="shrink-0 rounded-2xl bg-secondary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-secondary/90 shadow-md cursor-pointer"
                                        >
                                            Search
                                        </button>
                                    </form>

                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                        <Link
                                            href="/app/market/create"
                                            className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-secondary shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Plus className="h-4 w-4" /> List Item
                                        </Link>

                                        <Link
                                            href="/app/market/stores"
                                            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            <Store className="h-4 w-4 text-cyan-200" /> Explore Stores
                                        </Link>
                                    </div>
                                </div>

                                <div className="hidden sm:flex justify-self-end w-full max-w-sm justify-end min-w-0">
                                    <MarketHeroIllustration className="w-full max-w-sm drop-shadow-lg" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 2: VERIFIED ARTISANS & SKILLED PROS ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #091E3A 0%, #0D4A68 50%, #0891B2 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                                        <Wrench className="h-3.5 w-3.5" /> Hubnovo Artisans & Pros
                                    </div>
                                    <h2 className="mt-2 font-display text-3xl font-black leading-tight text-white sm:text-4xl">
                                        Hire Verified Artisans & Technicians
                                    </h2>
                                    <p className="mt-2 max-w-md text-sm text-white/80">
                                        Connect with vetted electricians, plumbers, carpenters, tailors, and mechanics across Nigeria with 100% escrow protection.
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/90">
                                        {['Electricians', 'Plumbers', 'Fashion & Tailoring', 'Auto Mechanics', 'AC & Solar'].map((tag) => (
                                            <span key={tag} className="rounded-xl bg-white/15 px-3 py-1 backdrop-blur-md border border-white/20">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <Link
                                            href="/app/artisans"
                                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-cyan-900 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Wrench className="h-4 w-4 text-cyan-600" /> Hire an Artisan
                                        </Link>

                                        <Link
                                            href="/app/market/create"
                                            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            List Your Trade
                                        </Link>
                                    </div>
                                </div>

                                {/* Artisan Badge Visual Card */}
                                <div className="hidden sm:flex justify-self-end w-full max-w-sm flex-col gap-3 min-w-0">
                                    <div className="rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl shadow-xl text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-lg font-black text-white shadow-md shrink-0">
                                                EO
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-black text-white text-base truncate">Emmanuel Okon</h4>
                                                    <BadgeCheck className="h-4 w-4 text-cyan-300 shrink-0" />
                                                </div>
                                                <p className="text-xs text-cyan-100 truncate">Certified Solar & Electrical Engineer</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-3 text-xs">
                                            <div className="flex items-center gap-1 text-amber-300 font-bold">
                                                <Star className="h-3.5 w-3.5 fill-amber-300" />
                                                <span>4.9 (68 jobs completed)</span>
                                            </div>
                                            <span className="rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 text-[11px] font-bold">
                                                Escrow Verified
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 rounded-xl bg-black/20 p-3 text-xs text-white/90 border border-white/10 backdrop-blur-md">
                                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                                        <span>Zero risk milestone releases on all verified artisan contracts.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 3: DIGITAL STOREFRONTS & BRANDS ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #06271C 0%, #0D4A36 50%, #059669 115%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                                        <Store className="h-3.5 w-3.5" /> Digital Merchant Hub
                                    </div>
                                    <h2 className="mt-2 font-display text-3xl font-black leading-tight text-white sm:text-4xl">
                                        Launch Your Mini-Store in 60s
                                    </h2>
                                    <p className="mt-2 max-w-md text-sm text-white/80">
                                        Open your branded store, showcase products, and receive direct buyer orders with zero setup fees.
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/90">
                                        <span className="rounded-xl bg-white/15 px-3 py-1 backdrop-blur-md border border-white/20">Custom Store URL</span>
                                        <span className="rounded-xl bg-white/15 px-3 py-1 backdrop-blur-md border border-white/20">0% Commission Starting</span>
                                        <span className="rounded-xl bg-white/15 px-3 py-1 backdrop-blur-md border border-white/20">Direct Buyer Chat</span>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <Link
                                            href="/app/market/stores"
                                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-emerald-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Store className="h-4 w-4 text-emerald-600" /> Explore Storefronts
                                        </Link>

                                        <Link
                                            href="/app/market/stores"
                                            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Open Your Store
                                        </Link>
                                    </div>
                                </div>

                                {/* Storefront Visual Showcase */}
                                <div className="hidden sm:flex justify-self-end w-full max-w-sm flex-col gap-3 min-w-0">
                                    <div className="rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl shadow-xl text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shrink-0">
                                                <Store className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-black text-white text-base truncate">Lagos Artisan Leather</h4>
                                                    <BadgeCheck className="h-4 w-4 text-emerald-300 shrink-0" />
                                                </div>
                                                <p className="text-xs text-emerald-100 truncate">Handcrafted Bags & Footwear</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/15 pt-3 text-center text-xs">
                                            <div className="rounded-lg bg-black/20 p-2">
                                                <p className="font-black text-white">48</p>
                                                <p className="text-[10px] text-white/70">Products</p>
                                            </div>
                                            <div className="rounded-lg bg-black/20 p-2">
                                                <p className="font-black text-amber-300">4.9 ★</p>
                                                <p className="text-[10px] text-white/70">Rating</p>
                                            </div>
                                            <div className="rounded-lg bg-black/20 p-2">
                                                <p className="font-black text-emerald-300">120+</p>
                                                <p className="text-[10px] text-white/70">Orders</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 rounded-xl bg-black/20 p-3 text-xs text-white/90 border border-white/10 backdrop-blur-md">
                                        <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                                        <span>Get indexed in Nigeria’s fastest growing merchant ecosystem.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 4: JOBS & CAREER OPPORTUNITIES ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #0B1528 0%, #1E295D 50%, #3B82F6 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-200">
                                        <Briefcase className="h-3.5 w-3.5" /> Careers & Gigs Hub
                                    </div>
                                    <h2 className="mt-2 font-display text-3xl font-black leading-tight text-white sm:text-4xl">
                                        Discover Jobs & Hire Top Talent
                                    </h2>
                                    <p className="mt-2 max-w-md text-sm text-white/80">
                                        Explore verified full-time roles, remote gigs, and contract projects with guaranteed escrow milestones.
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/90">
                                        <span className="rounded-xl bg-white/15 px-3 py-1 backdrop-blur-md border border-white/20">Remote Work</span>
                                        <span className="rounded-xl bg-white/15 px-3 py-1 backdrop-blur-md border border-white/20">Verified Employers</span>
                                        <span className="rounded-xl bg-white/15 px-3 py-1 backdrop-blur-md border border-white/20">1-Click Fast Apply</span>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <Link
                                            href="/app/jobs"
                                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-blue-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Briefcase className="h-4 w-4 text-blue-600" /> Explore Opportunities
                                        </Link>

                                        <Link
                                            href="/app/jobs?tab=my_posts"
                                            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Post a Job Opening
                                        </Link>
                                    </div>
                                </div>

                                {/* Opportunity Card Visual */}
                                <div className="hidden sm:flex justify-self-end w-full max-w-sm flex-col gap-3 min-w-0">
                                    <div className="rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl shadow-xl text-white">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="rounded-lg bg-blue-500/30 px-2.5 py-1 text-[11px] font-black text-blue-200 border border-blue-400/30">
                                                Full-Time / Remote
                                            </span>
                                            <span className="text-xs font-bold text-emerald-300">₦450,000 / mo</span>
                                        </div>
                                        <h4 className="mt-3 font-black text-white text-lg">Senior Product Designer</h4>
                                        <p className="mt-0.5 text-xs text-blue-100 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Lagos (Hybrid or Remote)
                                        </p>
                                        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs">
                                            <span className="text-white/80">Posted by Verified Tech Hub</span>
                                            <span className="font-bold text-cyan-300 flex items-center gap-1">
                                                Apply Now <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 rounded-xl bg-black/20 p-3 text-xs text-white/90 border border-white/10 backdrop-blur-md">
                                        <Users className="h-4 w-4 text-cyan-300 shrink-0" />
                                        <span>Direct recruiter and candidate chat on every job posting.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 5: 100% ESCROW & SAFE TRADE ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #131233 0%, #311568 50%, #7C3AED 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-200">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Escrow Protection
                                    </div>
                                    <h2 className="mt-2 font-display text-3xl font-black leading-tight text-white sm:text-4xl">
                                        100% Protected Milestones & Escrow
                                    </h2>
                                    <p className="mt-2 max-w-md text-sm text-white/80">
                                        Trade with peace of mind. Buyer funds remain securely locked until orders are delivered and verified satisfactory.
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/90">
                                        <span className="rounded-xl bg-white/15 px-3 py-1 backdrop-blur-md border border-white/20">Zero Fraud Guarantee</span>
                                        <span className="rounded-xl bg-white/15 px-3 py-1 backdrop-blur-md border border-white/20">Automatic Release</span>
                                        <span className="rounded-xl bg-white/15 px-3 py-1 backdrop-blur-md border border-white/20">24/7 Dispute Support</span>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <Link
                                            href="/app/market/orders"
                                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-purple-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <ShieldCheck className="h-4 w-4 text-purple-600" /> View Protected Orders
                                        </Link>

                                        <Link
                                            href="/app/wallet"
                                            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Escrow Wallet
                                        </Link>
                                    </div>
                                </div>

                                {/* Escrow Shield Visual */}
                                <div className="hidden sm:flex justify-self-end w-full max-w-sm flex-col gap-3 min-w-0">
                                    <div className="rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl shadow-xl text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0">
                                                <Lock className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-black text-white text-base truncate">Escrow Vault Active</h4>
                                                <p className="text-xs text-purple-200 truncate">Triple-Layer Milestone Security</p>
                                            </div>
                                        </div>

                                        <div className="mt-3 space-y-2 border-t border-white/15 pt-3 text-xs">
                                            <div className="flex items-center justify-between text-white/90">
                                                <span className="flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> Order Payment Locked
                                                </span>
                                                <span className="text-[11px] font-bold text-emerald-300">Protected</span>
                                            </div>
                                            <div className="flex items-center justify-between text-white/90">
                                                <span className="flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> Dispatch Verified
                                                </span>
                                                <span className="text-[11px] font-bold text-emerald-300">Tracked</span>
                                            </div>
                                            <div className="flex items-center justify-between text-white/90">
                                                <span className="flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300 shrink-0" /> Customer Approval
                                                </span>
                                                <span className="text-[11px] font-bold text-cyan-200">Payout</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 rounded-xl bg-black/20 p-3 text-xs text-white/90 border border-white/10 backdrop-blur-md">
                                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                                        <span>No payment released until buyer or client clicks Confirm Delivery.</span>
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
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105 active:scale-95 shadow-md border border-white/20 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>

            <button
                type="button"
                onClick={goToNext}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105 active:scale-95 shadow-md border border-white/20 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
            >
                <ChevronRight className="h-5 w-5" />
            </button>

            {/* ══ INDICATOR DOTS ══ */}
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                            currentIndex === idx
                                ? 'w-7 bg-white shadow-md'
                                : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                    />
                ))}
            </div>
        </section>
    )
}
