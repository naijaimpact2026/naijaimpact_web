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
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
    return `₦${n.toLocaleString('en-NG')}`
}

// ─── Individual service card in the grid ─────────────────────────────────────
function ServiceCard({ service }: { service: ServiceItem })
{
    const img = service.image_urls?.[0] ?? service.cover_image_url ?? null

    return (
        <Link href={`/app/market/artisans/${service.id}`}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-green-300 hover:shadow-md transition-all group">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                {img ? (
                    <Image src={img} alt={service.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' }}>
                        <Package className="w-10 h-10 text-green-400" />
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
                <p className="text-xs font-black text-gray-900 line-clamp-2 leading-snug">{service.title}</p>
                {service.category_name && (
                    <p className="text-[10px] text-green-600 font-semibold mt-0.5 truncate">{service.category_name}</p>
                )}
                {(service.rating ?? 0) > 0 && (
                    <div className="flex items-center gap-0.5 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] font-bold text-gray-700">{(service.rating ?? 0).toFixed(1)}</span>
                        {(service.review_count ?? 0) > 0 && (
                            <span className="text-[10px] text-gray-400">({service.review_count})</span>
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
        <div className="min-h-screen bg-[#f5f6fa]">
            {/* Top bar */}
            <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <p className="text-sm font-bold text-gray-900 flex-1 truncate">{artisan.displayName}</p>
                <button onClick={() => navigator.share?.({ title: artisan.displayName, url: window.location.href }).catch(() => { })}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Share2 className="w-4 h-4 text-gray-700" />
                </button>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">

                {/* ── Artisan header card ── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Cover — use first service image or gradient */}
                    <div className="relative h-32 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,#1a5c38,#065f46)' }}>
                        {artisan.services[0]?.image_urls?.[0] && (
                            <Image src={artisan.services[0].image_urls[0]} alt="" fill
                                className="object-cover opacity-30" sizes="800px" />
                        )}
                    </div>

                    <div className="px-5 pb-5">
                        {/* Avatar overlapping cover */}
                        <div className="flex items-end justify-between -mt-8 mb-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-green-50 shrink-0">
                                {artisan.avatarUrl ? (
                                    <Image src={artisan.avatarUrl} alt={artisan.displayName} width={64} height={64}
                                        className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-green-700 font-black text-2xl"
                                        style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' }}>
                                        {artisan.displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {/* Action buttons */}
                            <div className="flex gap-2">
                                {!isOwner && artisan.userId && (
                                    <Link href={`/app/chat?to=${artisan.userId}`}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                                        style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                        <MessageCircle className="w-4 h-4" /> Chat
                                    </Link>
                                )}
                                {isOwner && (
                                    <Link href="/app/market/create"
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 border-green-700 text-green-700 hover:bg-green-50 transition-colors">
                                        <Plus className="w-4 h-4" /> Add Service
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Name + stats */}
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h1 className="text-xl font-black text-gray-900">{artisan.displayName}</h1>
                                    {artisan.isVerified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                                </div>
                                {artisan.location && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin className="w-3.5 h-3.5" /> {artisan.location}
                                    </p>
                                )}
                            </div>
                            {minPrice && (
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] text-gray-400">Starting from</p>
                                    <p className="text-lg font-black text-green-700">{fmt(minPrice)}</p>
                                </div>
                            )}
                        </div>

                        {/* Ratings row */}
                        <div className="flex items-center gap-4 mt-3">
                            {totalReviews > 0 && (
                                <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="font-black text-gray-900">{avgRating.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">({totalReviews} reviews)</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-xl">
                                <Package className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-bold text-green-700">{artisan.services.length} service{artisan.services.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Bio */}
                        {artisan.bio && (
                            <p className="text-sm text-gray-600 leading-relaxed mt-4">{artisan.bio}</p>
                        )}
                    </div>
                </div>

                {/* ── Services grid — all services by this artisan ── */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-black text-gray-900 text-base">Services Offered</h2>
                        <p className="text-xs text-gray-500">{artisan.services.length} listing{artisan.services.length !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {artisan.services.map(svc => (
                            <ServiceCard key={svc.id} service={svc} />
                        ))}
                    </div>
                </section>

                <div className="h-6" />
            </div>
        </div>
    )
}
