'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 text-white w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #091E3A 0%, #102A43 50%, #0E6EDC 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                                        <Briefcase className="h-3.5 w-3.5" /> Hubnovo Opportunities
                                    </span>
                                    <h2 className="mt-2 font-display text-2xl font-black leading-tight sm:text-3xl text-white">
                                        Discover Jobs & Hire Top Talent
                                    </h2>
                                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Connect with leading companies, local enterprises, and innovative projects. Apply in one click or post your roles to reach verified candidates.
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                        <Link
                                            href="/app/jobs/create"
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-secondary shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Post a Job Opening
                                        </Link>

                                        <a
                                            href="#jobs-grid"
                                            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Browse Openings
                                        </a>
                                    </div>
                                </div>

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-6 sm:-mb-6 lg:-mb-7">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/jobs-professional.png"
                                            alt="Top Tech & Professional Talent"
                                            width={500}
                                            height={600}
                                            priority
                                            className="h-52 sm:h-[220px] md:h-[250px] lg:h-[275px] xl:h-[295px] w-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl text-white min-w-[190px] sm:min-w-[210px]">
                                            <div className="flex items-center justify-between gap-1 text-[11px]">
                                                <span className="rounded bg-cyan-400/20 px-2 py-0.5 font-bold text-cyan-200 border border-cyan-400/30">
                                                    Verified Role
                                                </span>
                                                <span className="text-emerald-300 font-bold">₦500k - ₦750k</span>
                                            </div>
                                            <p className="mt-1 font-black text-white text-xs truncate">Full-Stack Mobile Engineer</p>
                                            <div className="mt-1.5 flex items-center justify-between border-t border-white/15 pt-1.5 text-[10px] text-white/80">
                                                <span>1-Click Apply</span>
                                                <span className="text-cyan-300 font-bold flex items-center gap-0.5">
                                                    Chat <ArrowRight className="h-3 w-3" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 2: RECRUIT TOP TALENT ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 text-white w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #06192E 0%, #0A3663 50%, #0284C7 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-600/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-200">
                                        <Users className="h-3.5 w-3.5" /> For Employers & Recruiters
                                    </span>
                                    <h2 className="mt-2 font-display text-2xl font-black leading-tight sm:text-3xl text-white">
                                        Hire Vetted Candidates Fast
                                    </h2>
                                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Reach thousands of qualified Nigerian professionals, review applications seamlessly, and chat directly with candidates.
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                        <Link
                                            href="/app/jobs/create"
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-sky-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Post a Job Opening
                                        </Link>

                                        <Link
                                            href="/app/jobs?tab=my_posts"
                                            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Manage My Job Postings
                                        </Link>
                                    </div>
                                </div>

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-6 sm:-mb-6 lg:-mb-7">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/recruiter-talent.png"
                                            alt="Executive HR Recruiter & Talent Manager"
                                            width={500}
                                            height={600}
                                            className="h-52 sm:h-[220px] md:h-[250px] lg:h-[275px] xl:h-[295px] w-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl text-white min-w-[190px] sm:min-w-[210px]">
                                            <div className="flex items-center justify-between gap-1 text-[11px]">
                                                <span className="text-white/80">Talent Pool</span>
                                                <span className="text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">Screened</span>
                                            </div>
                                            <h4 className="mt-1 font-black text-white text-base">25,000+</h4>
                                            <p className="text-[11px] text-sky-100 mt-0.5">Verified Nigerian candidates</p>
                                            <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-1.5 text-xs">
                                                <span className="text-white/80">Avg Response</span>
                                                <span className="text-cyan-300 font-bold">&lt; 4 Hours</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 3: FREELANCE & REMOTE GIGS ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 text-white w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #0A1E33 0%, #15395B 50%, #0369A1 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                                        <Laptop className="h-3.5 w-3.5" /> Freelance & Remote Contracts
                                    </span>
                                    <h2 className="mt-2 font-display text-2xl font-black leading-tight sm:text-3xl text-white">
                                        Flexible Gigs with Milestone Escrow
                                    </h2>
                                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Work on your own terms. Freelance contracts are funded upfront in escrow, guaranteeing payout upon project completion.
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                        <Link
                                            href="/app/jobs/create"
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Post a Contract Opening
                                        </Link>

                                        <Link
                                            href="/app/wallet"
                                            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Escrow Protection
                                        </Link>
                                    </div>
                                </div>

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-6 sm:-mb-6 lg:-mb-7">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/escrow-trust-agent.png"
                                            alt="Milestone Escrow Contract Officer"
                                            width={500}
                                            height={600}
                                            className="h-52 sm:h-[220px] md:h-[250px] lg:h-[275px] xl:h-[295px] w-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl text-white min-w-[190px] sm:min-w-[210px]">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                                    <ShieldCheck className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-black text-white text-xs truncate">Contract Escrow</p>
                                                    <p className="text-[11px] text-emerald-200 truncate">Upfront Funded</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-1.5 text-xs">
                                                <span className="text-white/80">Deliverable Safe</span>
                                                <span className="text-emerald-300 font-bold">100% Guaranteed</span>
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

            {/* Indicators */}
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
