'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import
    {
        ChevronLeft, ChevronRight, Share2, MapPin, Star, Shield,
        Package, MessageCircle, BadgeCheck, Phone, Calendar,
        CheckCircle2, Clock, Tag, Eye, TrendingUp,
    } from 'lucide-react'
import { toggleSavedListing } from '@/lib/actions/marketplace'
import type { NmListingDetail, NmReview } from '@/lib/types'
import { Heart } from 'lucide-react'

interface Props
{
    listing: NmListingDetail
    reviews: NmReview[]
    currentUserId: string
    userEmail: string
}

function fmt(n: number)
{
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
    return `₦${n.toLocaleString('en-NG')}`
}

export default function ArtisanDetailClient({ listing, reviews, currentUserId, userEmail }: Props)
{
    const router = useRouter()
    const [imgIdx, setImgIdx] = useState(0)
    const [saved, setSaved] = useState(listing.is_saved)
    const [savingToggle, setSavingToggle] = useState(false)

    const images = listing.image_urls?.length > 0 ? listing.image_urls : (listing.cover_image_url ? [listing.cover_image_url] : [])
    const isOwner = listing.user_id === currentUserId
    const avgRating = listing.rating ?? 0
    const reviewCount = listing.review_count ?? 0

    async function handleToggleSave()
    {
        setSavingToggle(true)
        try
        {
            const isSaved = await toggleSavedListing(listing.id)
            setSaved(isSaved)
            toast.success(isSaved ? 'Added to saved' : 'Removed from saved')
        } catch
        {
            toast.error('Failed to update')
        } finally
        {
            setSavingToggle(false)
        }
    }

    function handleContact()
    {
        if (!listing.user_id) { toast.error('Unable to contact this artisan'); return }
        router.push(`/app/chat?to=${listing.user_id}`)
    }

    return (
        <div className="min-h-screen bg-[#f5f6fa]">

            {/* Top bar */}
            <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <p className="text-sm font-bold text-gray-900 truncate flex-1">{listing.title}</p>
                <button disabled={savingToggle} onClick={handleToggleSave}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50">
                    <Heart className={`w-4 h-4 ${saved ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} />
                </button>
                <button onClick={() => navigator.share?.({ title: listing.title, url: window.location.href }).catch(() => { })}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Share2 className="w-4 h-4 text-gray-700" />
                </button>
            </div>

            <div className="max-w-4xl mx-auto">

                {/* ── Image gallery ── */}
                <div className="bg-white">
                    <div className="relative aspect-video max-h-80 overflow-hidden">
                        {images.length > 0 ? (
                            <Image src={images[imgIdx]} alt={listing.title} fill
                                className="object-cover" sizes="800px" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' }}>
                                <span className="text-8xl font-black text-green-600">
                                    {(listing.seller_business_name ?? listing.title ?? 'A').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        {images.length > 1 && (
                            <>
                                <button onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
                            {images.map((img, i) => (
                                <button key={i} onClick={() => setImgIdx(i)}
                                    className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-green-600' : 'border-gray-200'}`}>
                                    <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-4 py-4 space-y-3">

                    {/* ── Service header ── */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                                {listing.category_name && (
                                    <p className="text-xs text-green-600 font-semibold mb-1">{listing.category_name}</p>
                                )}
                                <h1 className="text-xl font-black text-gray-900 leading-tight">{listing.title}</h1>
                            </div>
                        </div>

                        {/* Price + rating row */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                {listing.price > 0 && (
                                    <p className="text-2xl font-black text-gray-900">From {fmt(listing.price)}</p>
                                )}
                                {listing.negotiable && (
                                    <p className="flex items-center gap-1 text-xs text-green-600 font-semibold mt-0.5">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Price negotiable
                                    </p>
                                )}
                            </div>
                            {reviewCount > 0 && (
                                <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="font-black text-gray-900">{avgRating.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">({reviewCount})</span>
                                </div>
                            )}
                        </div>

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {(listing.city || listing.state) && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <MapPin className="w-3 h-3" />
                                    {[listing.city, listing.state].filter(Boolean).join(', ')}
                                </span>
                            )}
                            {listing.views_count > 0 && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <Eye className="w-3 h-3" /> {listing.views_count} views
                                </span>
                            )}
                            {listing.orders_count > 0 && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <TrendingUp className="w-3 h-3" /> {listing.orders_count} orders
                                </span>
                            )}
                            {listing.escrow_enabled && (
                                <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
                                    <Shield className="w-3 h-3" /> Escrow Protected
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <p className="text-sm text-gray-600 leading-relaxed mt-4">{listing.description}</p>
                        )}

                        {/* Tags */}
                        {listing.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-4">
                                {listing.tags.map((tag: string) => (
                                    <span key={tag}
                                        className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                        <Tag className="w-2.5 h-2.5" />#{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Artisan / Seller profile ── */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">About the Artisan</p>
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-green-50 shrink-0 border border-gray-100">
                                {listing.seller_profile_image_url ? (
                                    <Image src={listing.seller_profile_image_url} alt="" width={56} height={56}
                                        className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-green-700 font-black text-2xl">
                                        {(listing.seller_business_name ?? listing.seller_fullname ?? '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-gray-900 truncate">
                                        {listing.seller_business_name ?? listing.seller_fullname ?? 'Artisan'}
                                    </p>
                                    {listing.seller_is_verified && (
                                        <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                    )}
                                </div>
                                {listing.seller_username && (
                                    <p className="text-xs text-gray-500">@{listing.seller_username}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[11px] text-gray-500">
                                        TradeCred: <strong className="text-gray-800">{listing.seller_tradecred_score}</strong>
                                    </span>
                                    {listing.seller_tier !== 'free' && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 capitalize">
                                            {listing.seller_tier.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className="flex items-center gap-0.5 justify-end">
                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                    <span className="text-sm font-bold text-gray-900">{listing.seller_rating.toFixed(1)}</span>
                                </div>
                                <p className="text-[10px] text-gray-400">{listing.orders_count} jobs done</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Delivery + Warranty ── */}
                    {(listing.delivery_option !== 'none' || listing.warranty_days > 0) && (
                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
                            {listing.delivery_option !== 'none' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">Service Availability</p>
                                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{listing.delivery_option.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            )}
                            {listing.warranty_days > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                                        <Shield className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">Service Guarantee</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{listing.warranty_days}-day guarantee</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Reviews ── */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reviews</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                    ))}
                                    <span className="text-sm font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">({reviewCount})</span>
                                </div>
                            </div>
                        </div>
                        {reviews.length === 0 ? (
                            <p className="text-sm text-gray-400 py-6 text-center">No reviews yet — be the first client!</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.slice(0, 6).map(review => (
                                    <div key={review.id} className="border-t border-gray-50 pt-4">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                                                {(review.reviewer?.fullname ?? review.reviewer?.username ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-gray-800">
                                                {review.reviewer?.fullname ?? `@${review.reviewer?.username}`}
                                            </span>
                                            <div className="flex ml-auto">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        {review.comment && <p className="text-xs text-gray-500 leading-relaxed">{review.comment}</p>}
                                        {review.photo_urls?.length > 0 && (
                                            <div className="flex gap-1.5 mt-2">
                                                {review.photo_urls.slice(0, 3).map((url: string, i: number) => (
                                                    <Image key={i} src={url} alt="" width={48} height={48}
                                                        className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-24" />
                </div>
            </div>

            {/* ── Fixed bottom CTA ── */}
            <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 flex gap-3 max-w-4xl mx-auto">
                {isOwner ? (
                    <button className="flex-1 py-3 rounded-2xl text-sm font-black text-center text-white"
                        style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}
                        onClick={() => router.push(`/app/market/${listing.id}`)}>
                        View / Edit Service Listing
                    </button>
                ) : (
                    <>
                        <button onClick={handleContact}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 border-green-700 text-green-700 hover:bg-green-50 transition-colors">
                            <MessageCircle className="w-4 h-4" /> Chat Artisan
                        </button>
                        {listing.price > 0 && (
                            <button
                                onClick={() => router.push(`/app/market/${listing.id}`)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                <Calendar className="w-4 h-4" /> Book / Order
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
