'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_1fr] w-full min-w-0">
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

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-8 sm:-mb-10">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/store-boutique-owner.png"
                                            alt="Verified Storefront Merchant and Boutique Seller"
                                            width={500}
                                            height={600}
                                            priority
                                            className="h-84 sm:h-[400px] lg:h-[450px] xl:h-[490px] w-auto object-contain object-bottom drop-shadow-[0_25px_45px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-6 sm:-left-10 bottom-12 sm:bottom-16 rounded-2xl border border-white/25 bg-black/55 p-3.5 backdrop-blur-xl shadow-2xl text-white min-w-[210px]">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                                                    <Store className="h-4.5 w-4.5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-black text-white text-xs truncate">Blossom Boutique</span>
                                                        <BadgeCheck className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                                                    </div>
                                                    <p className="text-[11px] text-cyan-100 truncate">Lagos, Nigeria</p>
                                                </div>
                                            </div>
                                            <div className="mt-2.5 flex items-center justify-between border-t border-white/15 pt-2 text-xs">
                                                <span className="text-white/80">0% Commission</span>
                                                <span className="text-cyan-300 font-bold">Custom URL</span>
                                            </div>
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

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_1fr] w-full min-w-0">
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

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-8 sm:-mb-10">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/store-merchant.png"
                                            alt="NaijaImpact Digital Merchant Owner"
                                            width={500}
                                            height={600}
                                            className="h-84 sm:h-[400px] lg:h-[450px] xl:h-[490px] w-auto object-contain object-bottom drop-shadow-[0_25px_45px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-6 sm:-left-10 bottom-12 sm:bottom-16 rounded-2xl border border-white/25 bg-black/55 p-3.5 backdrop-blur-xl shadow-2xl text-white min-w-[210px]">
                                            <div className="flex items-center justify-between gap-1 text-[11px]">
                                                <span className="text-white/80">Setup Time</span>
                                                <span className="text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">Instant</span>
                                            </div>
                                            <h4 className="mt-1.5 font-black text-white text-lg">&lt; 1 Minute</h4>
                                            <p className="text-[11px] text-emerald-100 mt-0.5">Catalog & live payments</p>
                                            <div className="mt-2.5 flex items-center justify-between border-t border-white/15 pt-2 text-xs">
                                                <span className="text-white/80">Zero Hosting Fee</span>
                                                <span className="text-emerald-300 font-bold">Custom Link</span>
                                            </div>
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

                            <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_1fr] w-full min-w-0">
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

                                {/* Person Visual Cutout */}
                                <div className="relative hidden sm:flex items-end justify-center lg:justify-end w-full max-w-lg min-w-0 self-end -mb-8 sm:-mb-10">
                                    <div className="relative flex items-end">
                                        <Image
                                            src="/images/heroes/escrow-trust-agent.png"
                                            alt="100% Protected Escrow Officer"
                                            width={500}
                                            height={600}
                                            className="h-84 sm:h-[400px] lg:h-[450px] xl:h-[490px] w-auto object-contain object-bottom drop-shadow-[0_25px_45px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute -left-6 sm:-left-10 bottom-12 sm:bottom-16 rounded-2xl border border-white/25 bg-black/55 p-3.5 backdrop-blur-xl shadow-2xl text-white min-w-[210px]">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-9 w-9 rounded-xl bg-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                                    <ShieldCheck className="h-4.5 w-4.5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-black text-white text-xs truncate">Protected Trade</p>
                                                    <p className="text-[11px] text-cyan-100 truncate">Delivery Guaranteed</p>
                                                </div>
                                            </div>
                                            <div className="mt-2.5 flex items-center justify-between border-t border-white/15 pt-2 text-xs">
                                                <span className="text-white/80">Funds Escrowed</span>
                                                <span className="text-emerald-300 font-bold">100% Safe</span>
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
