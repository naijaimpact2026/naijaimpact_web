'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    BadgeCheck,
    Star,
    MapPin,
    MessageCircle,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    ShieldCheck,
} from 'lucide-react'
import type { ArtisanGroup } from './ArtisanMarketClient'

function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG')}`
}

interface Props
{
    artisans: ArtisanGroup[]
    currentUserId?: string
}

export default function FeaturedArtisansCarousel({ artisans, currentUserId = '' }: Props)
{
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)

    // Filter to top-rated or verified artisans, or fallback to first 6
    const featuredList = artisans
        .filter((a) => a.isVerified || (a.avgRating && a.avgRating >= 4.0) || a.services.length > 0)
        .slice(0, 8)

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

    if (featuredList.length === 0) return null

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="font-display text-base font-black text-foreground">Featured & Top-Rated Pros</h2>
                        <p className="text-xs text-muted-foreground">Handpicked verified specialists ready for immediate hire</p>
                    </div>
                </div>

                {/* Carousel dots indicator */}
                <div className="hidden sm:flex items-center gap-1.5">
                    {Array.from({ length: count || featuredList.length }).map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => api?.scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 ${current === index ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <div className="relative group">
                <Carousel
                    setApi={setApi}
                    opts={{
                        align: 'start',
                        loop: featuredList.length > 3,
                        skipSnaps: false,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-3">
                        {featuredList.map((artisan) =>
                        {
                            const previewImg = artisan.services[0]?.image_urls?.[0] ||
                                artisan.services[0]?.cover_image_url ||
                                artisan.avatarUrl

                            const isSelf = artisan.userId === currentUserId

                            return (
                                <CarouselItem
                                    key={artisan.artisanKey}
                                    className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                                >
                                    <div className="h-full flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card shadow-sm hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                                        <div>
                                            {/* Preview header banner */}
                                            <div className="relative h-40 w-full overflow-hidden bg-muted">
                                                {previewImg ? (
                                                    <Image
                                                        src={previewImg}
                                                        alt={artisan.displayName}
                                                        fill
                                                        className="object-cover transition-transform duration-500 hover:scale-105"
                                                        sizes="300px"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-primary text-white">
                                                        <span className="text-4xl font-black">{artisan.displayName.charAt(0)}</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                                                {/* Top badges */}
                                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                                                        <ShieldCheck className="h-3 w-3 text-cyan-400" /> Escrow Protected
                                                    </span>
                                                    {artisan.isVerified && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                                            <CheckCircle2 className="h-3 w-3" /> Verified
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Price badge */}
                                                {artisan.minPrice != null && artisan.minPrice > 0 && (
                                                    <div className="absolute bottom-2.5 right-3 rounded-xl bg-black/70 px-2.5 py-1 text-white backdrop-blur-md">
                                                        <p className="text-[9px] uppercase tracking-wider text-white/70">From</p>
                                                        <p className="text-xs font-black text-amber-300">{fmt(artisan.minPrice)}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Profile avatar + details */}
                                            <div className="p-4 pt-0 relative">
                                                <div className="-mt-7 mb-2.5 flex items-end justify-between">
                                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-card shadow-md">
                                                        {artisan.avatarUrl ? (
                                                            <Image
                                                                src={artisan.avatarUrl}
                                                                alt={artisan.displayName}
                                                                width={56}
                                                                height={56}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-black text-xl">
                                                                {artisan.displayName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {artisan.avgRating > 0 && (
                                                        <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                            <span>{artisan.avgRating.toFixed(1)}</span>
                                                            <span className="text-[10px] text-muted-foreground font-normal">({artisan.totalReviews})</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className="font-display font-black text-sm text-foreground truncate">
                                                            {artisan.displayName}
                                                        </h3>
                                                        {artisan.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                                                    </div>

                                                    {artisan.location && (
                                                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 truncate">
                                                            <MapPin className="h-3 w-3 shrink-0" /> {artisan.location}
                                                        </p>
                                                    )}

                                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                                        {artisan.bio || (artisan.services[0]?.title ? `Specializes in ${artisan.services.map(s => s.title).slice(0, 2).join(', ')}.` : 'Skilled verified professional on Hubnovo.')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="p-4 pt-0 border-t border-border/60 mt-3">
                                            <div className="grid grid-cols-2 gap-2 pt-3">
                                                {!isSelf ? (
                                                    <Link
                                                        href={`/app/chat?to=${artisan.userId || artisan.artisanKey}`}
                                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:border-primary hover:text-primary transition-colors"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5" /> Message
                                                    </Link>
                                                ) : (
                                                    <span className="flex items-center justify-center rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
                                                        Your Profile
                                                    </span>
                                                )}

                                                <Link
                                                    href={`/app/artisans/profile/${artisan.artisanKey}`}
                                                    className="flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                                                >
                                                    <span>View</span>
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            )
                        })}
                    </CarouselContent>

                    <CarouselPrevious className="hidden sm:flex -left-3 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-md text-foreground border-border hover:bg-card shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CarouselNext className="hidden sm:flex -right-3 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-md text-foreground border-border hover:bg-card shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </Carousel>
            </div>
        </section>
    )
}
