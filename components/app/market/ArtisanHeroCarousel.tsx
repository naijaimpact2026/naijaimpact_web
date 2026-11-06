'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import {
    Plus,
    Wrench,
    ShieldCheck,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Lock,
    CheckCircle2,
    Star,
} from 'lucide-react'

interface ArtisanHeroCarouselProps {
    myArtisanProfile: any
    onOpenProfileModal: () => void
}

export default function ArtisanHeroCarousel({
    myArtisanProfile,
    onOpenProfileModal,
}: ArtisanHeroCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: 'start',
        skipSnaps: false,
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

    // Auto-advance every 6 seconds unless paused
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
            aria-label="Hubnovo Artisans and Professionals Highlights"
        >
            {/* Embla Viewport */}
            <div ref={emblaRef} className="overflow-hidden w-full select-none [contain:paint] [transform:translateZ(0)] [-webkit-transform:translateZ(0)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
                {/* Embla Container */}
                <div className="flex w-full touch-pan-y [transform:translate3d(0,0,0)] [-webkit-transform:translate3d(0,0,0)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden] will-change-transform">
                    {/* ══ SLIDE 1: MAIN HERO - HIRE VETTED ARTISANS ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full [transform:translateZ(0)] [-webkit-transform:translateZ(0)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
                        <div
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #102A43 0%, #0E6EDC 130%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                                        <Wrench className="h-3.5 w-3.5" /> Hubnovo Artisans & Pros
                                    </div>
                                    <h2 className="mt-2 font-display text-2xl font-black text-white sm:text-3xl leading-tight">
                                        Artisans & Professional Services
                                    </h2>
                                    <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Hire verified skilled artisans, technicians, and licensed professional consultants across Nigeria with escrow protection.
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={onOpenProfileModal}
                                            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-black text-secondary shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat cursor-pointer"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {myArtisanProfile ? 'Update My Service Listing' : 'List My Services'}
                                        </button>

                                        <Link
                                            href="/app/market/create"
                                            className="flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 py-2 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Create New Listing
                                        </Link>
                                    </div>
                                </div>

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-6 sm:-mb-6 lg:-mb-7">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/artisan-electrician.png"
                                            alt="Verified Artisan Technician"
                                            width={500}
                                            height={600}
                                            priority
                                            className="h-52 sm:h-[220px] md:h-[250px] lg:h-[275px] xl:h-[295px] w-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl text-white min-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                                    <Wrench className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-black text-white text-xs truncate">Verified Pros</span>
                                                        <BadgeCheck className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                                                    </div>
                                                    <p className="text-[11px] text-cyan-100 truncate">36 States Covered</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-1.5 text-xs">
                                                <span className="text-amber-300 font-bold flex items-center gap-1">
                                                    <Star className="h-3 w-3 fill-amber-300" /> 4.9 ★
                                                </span>
                                                <span className="text-emerald-300 font-bold">Escrow Backed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 2: EARN AS AN ARTISAN ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full [transform:translateZ(0)] [-webkit-transform:translateZ(0)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
                        <div
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #091E3A 0%, #0D4A68 50%, #0891B2 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-200">
                                        <Sparkles className="h-3.5 w-3.5" /> For Skilled Technicians & Pros
                                    </div>
                                    <h2 className="mt-2 font-display text-2xl font-black text-white sm:text-3xl leading-tight">
                                        Turn Your Craft Into Steady Income
                                    </h2>
                                    <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Join hundreds of verified electricians, mechanics, tailors, and consultants receiving direct booking inquiries with zero upfront commission.
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={onOpenProfileModal}
                                            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-black text-teal-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat cursor-pointer"
                                        >
                                            <Plus className="h-4 w-4 text-teal-600" />
                                            {myArtisanProfile ? 'Edit Profile & Rates' : 'Join as an Artisan'}
                                        </button>

                                        <Link
                                            href="/app/learn"
                                            className="flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 py-2 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Upgrade Skills in Academy
                                        </Link>
                                    </div>
                                </div>

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-6 sm:-mb-6 lg:-mb-7">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/craftsman-carpenter.png"
                                            alt="Skilled Craftsman and Carpenter"
                                            width={500}
                                            height={600}
                                            className="h-52 sm:h-[220px] md:h-[250px] lg:h-[275px] xl:h-[295px] w-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl text-white min-w-[200px]">
                                            <div className="flex items-center justify-between gap-1 text-[11px]">
                                                <span className="text-white/80">Daily Earnings</span>
                                                <span className="text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">Active</span>
                                            </div>
                                            <h4 className="mt-1 font-black text-white text-base">₦45,000+</h4>
                                            <p className="text-[11px] text-teal-100 mt-0.5">Direct wallet settlement</p>
                                            <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-1.5 text-xs">
                                                <span className="text-white/80">0% Commission</span>
                                                <span className="text-cyan-300 font-bold">Fast Payout</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 3: 100% ESCROW PROTECTION ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full [transform:translateZ(0)] [-webkit-transform:translateZ(0)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
                        <div
                            className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #0A2E28 0%, #0D5C4B 50%, #047857 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                                        <ShieldCheck className="h-3.5 w-3.5" /> 100% Milestone Escrow
                                    </div>
                                    <h2 className="mt-2 font-display text-2xl font-black text-white sm:text-3xl leading-tight">
                                        Zero Risk for Clients & Service Providers
                                    </h2>
                                    <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-none">
                                        Client deposits are securely locked in escrow before service starts. Funds are only disbursed once work is inspected and confirmed satisfactory.
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                        <Link
                                            href="/app/wallet"
                                            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-black text-emerald-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                        >
                                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                            Learn About Escrow
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={onOpenProfileModal}
                                            className="flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 py-2 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white/20 cursor-pointer"
                                        >
                                            List Your Service
                                        </button>
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
                                        <div className="absolute -left-3 sm:-left-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/25 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl text-white min-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                                    <ShieldCheck className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-black text-white text-xs truncate">100% Milestone Lock</p>
                                                    <p className="text-[11px] text-emerald-200 truncate">Inspection Verified</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-1.5 text-xs">
                                                <span className="text-white/80">Funds Protected</span>
                                                <span className="text-emerald-300 font-bold">Guaranteed</span>
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

            {/* Dots */}
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
