'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import
    {
        ChevronLeft, MapPin, Star, BadgeCheck, MessageCircle,
        Package, Share2, Plus,
    } from 'lucide-react'

interface ServiceItem
{
    id: string
    title: string
    description?: string
    price?: number
    state?: string | null
    city?: string | null
    rating?: number
    review_count?: number
    cover_image_url?: string | null
    image_urls?: string[]
    category_name?: string | null
    tags?: string[]
    [key: string]: any
}

interface ArtisanData
{
    artisanKey: string
    displayName: string
    avatarUrl: string | null
    isVerified: boolean
    bio: string | null
    location: string | null
    userId: string | null
    services: ServiceItem[]
}

interface Props
{
    artisan: ArtisanData
    currentUserId: string
}

function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG')}`
}

// ─── Individual service card in the grid ─────────────────────────────────────
function ServiceCard({ service }: { service: ServiceItem })
{
    const img = service.image_urls?.[0] ?? service.cover_image_url ?? null

    return (
        <Link href={`/app/market/artisans/${service.id}`}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-primary/5">
                {img ? (
                    <Image src={img} alt={service.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                        <Package className="w-10 h-10 text-primary/40" />
                    </div>
                )}
                {/* Price overlay */}
                {service.price != null && service.price > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent py-2 px-2.5">
                        <span className="text-xs font-black text-white">From {fmt(service.price)}</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3">
                <p className="text-xs font-black text-foreground line-clamp-2 leading-snug">{service.title}</p>
                {service.category_name && (
                    <p className="text-[10px] text-primary font-semibold mt-0.5 truncate">{service.category_name}</p>
                )}
                {(service.rating ?? 0) > 0 && (
                    <div className="flex items-center gap-0.5 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] font-bold text-foreground">{(service.rating ?? 0).toFixed(1)}</span>
                        {(service.review_count ?? 0) > 0 && (
                            <span className="text-[10px] text-muted-foreground">({service.review_count})</span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    )
}

// ─── Main artisan profile page ────────────────────────────────────────────────
export default function ArtisanProfilePage({ artisan, currentUserId }: Props)
{
    const router = useRouter()

    const totalReviews = artisan.services.reduce((s, svc) => s + (svc.review_count ?? 0), 0)
    const avgRating = totalReviews > 0
        ? artisan.services.reduce((s, svc) => s + (svc.rating ?? 0) * (svc.review_count ?? 0), 0) / totalReviews
        : 0
    const minPrice = artisan.services.reduce((min: number | null, svc) =>
    {
        const p = svc.price ?? 0
        if (p <= 0) return min
        return min === null || p < min ? p : min
    }, null)

    const isOwner = artisan.userId === currentUserId

    return (
        <div className="w-full">
            {/* Top bar */}
            <div className="sticky top-14 z-20 bg-card/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()}
                    className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                <p className="text-sm font-bold text-foreground flex-1 truncate">{artisan.displayName}</p>
                <button onClick={() => navigator.share?.({ title: artisan.displayName, url: window.location.href }).catch(() => { })}
                    className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors">
                    <Share2 className="w-4 h-4 text-foreground" />
                </button>
            </div>

            <div className="w-full px-4 py-5 space-y-5 sm:px-6 lg:px-8">

                {/* ── Artisan header card ── */}
                <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                    {/* Cover — use first service image or brand gradient */}
                    <div className="relative h-32 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}>
                        {artisan.services[0]?.image_urls?.[0] && (
                            <Image src={artisan.services[0].image_urls[0]} alt="" fill
                                className="object-cover opacity-30" sizes="800px" />
                        )}
                    </div>

                    <div className="px-5 pb-5">
                        {/* Avatar overlapping cover */}
                        <div className="flex items-end justify-between -mt-8 mb-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-card shadow-lg bg-primary/10 shrink-0">
                                {artisan.avatarUrl ? (
                                    <Image src={artisan.avatarUrl} alt={artisan.displayName} width={64} height={64}
                                        className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-primary font-black text-2xl bg-gradient-to-br from-primary/10 to-primary/20">
                                        {artisan.displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {/* Action buttons */}
                            <div className="flex gap-2">
                                {!isOwner && artisan.userId && (
                                    <Link href={`/app/chat?to=${artisan.userId}`}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-primary-foreground bg-primary transition-colors hover:bg-primary/90">
                                        <MessageCircle className="w-4 h-4" /> Chat
                                    </Link>
                                )}
                                {isOwner && (
                                    <Link href="/app/market/create"
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 border-primary text-primary hover:bg-primary/5 transition-colors">
                                        <Plus className="w-4 h-4" /> Add Service
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Name + stats */}
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h1 className="font-display text-xl font-black text-foreground">{artisan.displayName}</h1>
                                    {artisan.isVerified && <BadgeCheck className="w-5 h-5 text-primary" />}
                                </div>
                                {artisan.location && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        <MapPin className="w-3.5 h-3.5" /> {artisan.location}
                                    </p>
                                )}
                            </div>
                            {minPrice && (
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] text-muted-foreground">Starting from</p>
                                    <p className="text-lg font-black text-primary">{fmt(minPrice)}</p>
                                </div>
                            )}
                        </div>

                        {/* Ratings row */}
                        <div className="flex items-center gap-4 mt-3">
                            {totalReviews > 0 && (
                                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="font-black text-foreground">{avgRating.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({totalReviews} reviews)</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-xl">
                                <Package className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-primary">{artisan.services.length} service{artisan.services.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Bio */}
                        {artisan.bio && (
                            <p className="text-sm text-muted-foreground leading-relaxed mt-4">{artisan.bio}</p>
                        )}
                    </div>
                </div>

                {/* ── Services grid — all services by this artisan ── */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-display font-black text-foreground text-base">Services Offered</h2>
                        <p className="text-xs text-muted-foreground">{artisan.services.length} listing{artisan.services.length !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {artisan.services.map(svc => (
                            <ServiceCard key={svc.id} service={svc} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
