'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import {
    Plus,
    Store,
    ShieldCheck,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    CheckCircle2,
} from 'lucide-react'

interface StorefrontsHeroCarouselProps {
    myStorefront: { id: string; business_name: string } | null
    onCreateOpen: () => void
}

export default function StorefrontsHeroCarousel({
    myStorefront,
    onCreateOpen,
}: StorefrontsHeroCarouselProps) {
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
            aria-label="Hubnovo Storefronts Highlights"
        >
            {/* Embla Viewport */}
            <div ref={emblaRef} className="overflow-hidden w-full">
                {/* Embla Container */}
                <div className="flex w-full touch-pan-y">
                    {/* ══ SLIDE 1: BROWSE & LAUNCH STORES ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #102A43 0%, #0E6EDC 130%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                                        <Store className="h-3.5 w-3.5" /> Hubnovo Storefronts
                                    </div>
                                    <h2 className="mt-2 font-display text-3xl font-black text-white sm:text-4xl leading-tight">
                                        Mini Online Stores from Nigerian Businesses
                                    </h2>
                                    <p className="mt-2 max-w-xl text-sm text-white/80 leading-relaxed">
                                        Discover curated product catalogs from trusted vendors across Nigeria, or launch your own branded store in 60 seconds.
                                    </p>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        {myStorefront ? (
                                            <Link
                                                href={`/app/market/stores/${myStorefront.id}`}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-secondary shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                            >
                                                <Store className="h-4 w-4" /> My Store: {myStorefront.business_name}
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={onCreateOpen}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-secondary shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat cursor-pointer"
                                            >
                                                <Plus className="h-4 w-4" /> Create Your Store
                                            </button>
                                        )}

                                        <Link
                                            href="/app/market"
                                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Browse All Products
                                        </Link>
                                    </div>
                                </div>

                                {/* Store Showcase Visual */}
                                <div className="hidden sm:flex justify-self-end w-full max-w-sm flex-col gap-3 min-w-0">
                                    <div className="rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl shadow-xl text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
                                                <Store className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-black text-white text-base truncate">Verified Merchants</h4>
                                                    <BadgeCheck className="h-4 w-4 text-cyan-300 shrink-0" />
                                                </div>
                                                <p className="text-xs text-cyan-100 truncate">Direct customer chat & escrow orders</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-3 text-xs">
                                            <span className="text-white/80">0% Commission Starting</span>
                                            <span className="font-bold text-cyan-300">Dedicated URL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 2: DIGITAL MERCHANT SUITE ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #06271C 0%, #0D4A36 50%, #059669 115%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                                        <Sparkles className="h-3.5 w-3.5" /> For Business Owners & Sellers
                                    </div>
                                    <h2 className="mt-2 font-display text-3xl font-black text-white sm:text-4xl leading-tight">
                                        Your Dedicated Online Storefront in 60s
                                    </h2>
                                    <p className="mt-2 max-w-xl text-sm text-white/80 leading-relaxed">
                                        Share your personal store link across WhatsApp, Instagram, and TikTok. Buyers browse your full catalog and pay securely.
                                    </p>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        {myStorefront ? (
                                            <Link
                                                href={`/app/market/stores/${myStorefront.id}`}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-emerald-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                            >
                                                Manage My Store
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={onCreateOpen}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-emerald-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat cursor-pointer"
                                            >
                                                <Plus className="h-4 w-4" /> Open Your Store
                                            </button>
                                        )}

                                        <Link
                                            href="/app/market/create"
                                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            List New Product
                                        </Link>
                                    </div>
                                </div>

                                {/* Store Analytics Highlight */}
                                <div className="hidden sm:flex justify-self-end w-full max-w-sm flex-col gap-3 min-w-0">
                                    <div className="rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl shadow-xl text-white">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-white/80">Storefront Setup Time</span>
                                            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                                                Instant
                                            </span>
                                        </div>
                                        <h3 className="mt-2 font-display text-3xl font-black text-white">&lt; 1 Minute</h3>
                                        <p className="text-xs text-emerald-100 mt-1">Logo, catalog, contact, and direct bank settlement.</p>
                                        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs">
                                            <span className="text-white/80">Zero hosting charges</span>
                                            <span className="font-bold text-emerald-300">Custom Branded Link</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SLIDE 3: ESCROW-BACKED COMMERCE ══ */}
                    <div className="w-full min-w-0 shrink-0 grow-0 basis-full">
                        <div
                            className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 w-full min-w-0"
                            style={{ background: 'linear-gradient(135deg, #091E3A 0%, #0D4A68 50%, #0891B2 120%)' }}
                        >
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Escrow Protected Commerce
                                    </div>
                                    <h2 className="mt-2 font-display text-3xl font-black text-white sm:text-4xl leading-tight">
                                        Say Goodbye to Pay-on-Delivery Risk
                                    </h2>
                                    <p className="mt-2 max-w-xl text-sm text-white/80 leading-relaxed">
                                        No more fake orders or rejected deliveries. Customer funds are confirmed in escrow before dispatch, guaranteeing merchant payment.
                                    </p>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        {myStorefront ? (
                                            <Link
                                                href={`/app/market/stores/${myStorefront.id}`}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-cyan-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat"
                                            >
                                                View My Store Orders
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={onCreateOpen}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-cyan-950 shadow-lg transition-transform active:scale-95 hover:bg-white/90 animate-heartbeat cursor-pointer"
                                            >
                                                <Plus className="h-4 w-4" /> Start Selling Safely
                                            </button>
                                        )}

                                        <Link
                                            href="/app/wallet"
                                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                        >
                                            Learn About Escrow
                                        </Link>
                                    </div>
                                </div>

                                {/* Safe Escrow Card */}
                                <div className="hidden sm:flex justify-self-end w-full max-w-sm flex-col gap-3 min-w-0">
                                    <div className="rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl shadow-xl text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-cyan-500 flex items-center justify-center text-white shadow-md shrink-0">
                                                <ShieldCheck className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-black text-white text-base truncate">Protected Commerce</h4>
                                                <p className="text-xs text-cyan-100 truncate">Guaranteed buyer & seller protection</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-1.5 border-t border-white/15 pt-3 text-xs">
                                            <div className="flex items-center gap-2 text-white/90">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                                                <span>Customer deposits payment in escrow</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-white/90">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                                                <span>Merchant dispatches goods with confidence</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-white/90">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                                                <span>Instant release upon parcel delivery</span>
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
