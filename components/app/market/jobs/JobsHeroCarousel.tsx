'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import {
    Plus,
    Briefcase,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Users,
    Laptop,
    CheckCircle2,
    ArrowRight,
    MapPin,
} from 'lucide-react'

export default function JobsHeroCarousel() {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: 'start',
    })
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const totalSlides = 3

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

    useEffect(() => {
        if (!emblaApi || isPaused) return
        const timer = setInterval(() => {
            emblaApi.scrollNext()
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
            onMouseLeave={() => setIsPaused(false)}
            aria-roledescription="carousel"
            aria-label="Hubnovo Opportunities Highlights"
        >
            {/* Embla Viewport */}
            <div ref={emblaRef} className="overflow-hidden w-full">
                {/* Embla Container */}
                <div className="flex w-full touch-pan-y">
                    {/* ══ SLIDE 1: DISCOVER JOBS & HIRE TALENT ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden p-6 sm:p-10 text-white w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #091E3A 0%, #102A43 50%, #0E6EDC 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

                            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center w-full min-w-0">
                                <div className="max-w-xl min-w-0">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                                        <Briefcase className="h-3.5 w-3.5" /> Hubnovo Opportunities
                                    </span>
                                    <h2 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl text-white">
                                        Discover Jobs & Hire Top Talent
                                    </h2>
                                    <p className="mt-2 text-sm leading-relaxed text-white/80">
                                        Connect with leading companies, local enterprises, and innovative projects. Apply in one click or post your roles to reach verified candidates.
                                    </p>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <Link
                                            href="/app/jobs/create"
                                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-secondary shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Post a Job Opening
                                        </Link>

                                        <a
                                            href="#jobs-grid"
                                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Browse Openings
                                        </a>
                                    </div>
                                </div>

                                {/* Featured Job Card Mockup */}
                                <div className="hidden sm:flex justify-self-end w-full max-w-sm flex-col gap-3 min-w-0">
                                    <div className="rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl shadow-xl text-white">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="rounded-lg bg-cyan-400/20 px-2.5 py-1 text-[11px] font-black text-cyan-200 border border-cyan-400/30">
                                                Verified Employer
                                            </span>
                                            <span className="text-xs font-bold text-emerald-300">Active Listing</span>
                                        </div>
                                        <h4 className="mt-3 font-black text-white text-lg truncate">Full-Stack Mobile Engineer</h4>
                                        <p className="mt-0.5 text-xs text-cyan-100 flex items-center gap-1 truncate">
                                            <MapPin className="h-3 w-3 shrink-0" /> Lagos (Hybrid) • ₦500k - ₦750k / mo
                                        </p>
                                        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs">
                                            <span className="text-white/80">Direct In-App Chat</span>
                                            <span className="font-bold text-cyan-300 flex items-center gap-1">
                                                1-Click Apply <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 2: RECRUIT TOP TALENT ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden p-6 sm:p-10 text-white w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #06192E 0%, #0A3663 50%, #0284C7 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-600/20 blur-3xl" />

                            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center w-full min-w-0">
                                <div className="max-w-xl min-w-0">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-200">
                                        <Users className="h-3.5 w-3.5" /> For Employers & Recruiters
                                    </span>
                                    <h2 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl text-white">
                                        Hire Vetted Candidates Fast
                                    </h2>
                                    <p className="mt-2 text-sm leading-relaxed text-white/80">
                                        Reach thousands of qualified Nigerian professionals, review applications seamlessly, and chat directly with candidates.
                                    </p>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <Link
                                            href="/app/jobs/create"
                                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-sky-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Post a Job Opening
                                        </Link>

                                        <Link
                                            href="/app/jobs?tab=my_posts"
                                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Manage My Job Postings
                                        </Link>
                                    </div>
                                </div>

                                {/* Candidate Reach Stats */}
                                <div className="hidden sm:flex justify-self-end w-full max-w-sm flex-col gap-3 min-w-0">
                                    <div className="rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl shadow-xl text-white">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-white/80">Active Candidates</span>
                                            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                                                Verified
                                            </span>
                                        </div>
                                        <h3 className="mt-2 font-display text-3xl font-black text-white">25,000+</h3>
                                        <p className="text-xs text-sky-100 mt-1">Screened for vocational, digital, and technical skills.</p>
                                        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs">
                                            <span className="text-white/80">Average response time</span>
                                            <span className="font-bold text-cyan-300">&lt; 4 Hours</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 3: FREELANCE & REMOTE GIGS ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden p-6 sm:p-10 text-white w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #0A1E33 0%, #15395B 50%, #0369A1 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />

                            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center w-full min-w-0">
                                <div className="max-w-xl min-w-0">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                                        <Laptop className="h-3.5 w-3.5" /> Freelance & Remote Contracts
                                    </span>
                                    <h2 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl text-white">
                                        Flexible Gigs with Milestone Escrow
                                    </h2>
                                    <p className="mt-2 text-sm leading-relaxed text-white/80">
                                        Work on your own terms. Freelance contracts are funded upfront in escrow, guaranteeing payout upon project completion.
                                    </p>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <Link
                                            href="/app/jobs/create"
                                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Post a Contract Opening
                                        </Link>

                                        <Link
                                            href="/app/wallet"
                                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Escrow Protection
                                        </Link>
                                    </div>
                                </div>

                                {/* Escrow Guarantee Highlight */}
                                <div className="hidden sm:flex justify-self-end w-full max-w-sm flex-col gap-3 min-w-0">
                                    <div className="rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl shadow-xl text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shrink-0">
                                                <ShieldCheck className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-black text-white text-base truncate">Guaranteed Contract Pay</h4>
                                                <p className="text-xs text-emerald-100 truncate">Zero payment delays</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-1.5 border-t border-white/15 pt-3 text-xs">
                                            <div className="flex items-center gap-2 text-white/90">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                                                <span>Employer deposits budget in escrow</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-white/90">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                                                <span>Submit deliverable securely</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-white/90">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                                                <span>Instant transfer to bank account</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation buttons */}
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

            {/* Indicators */}
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
