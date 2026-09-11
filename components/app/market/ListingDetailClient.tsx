'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import
    {
        ChevronLeft, ChevronRight, Share2, MapPin, Star, Shield,
        Package, MessageCircle, ShoppingCart, RotateCcw, Truck,
        BadgeCheck, Heart, HeartOff, CheckCircle2,
    } from 'lucide-react'
import { toggleSavedListing } from '@/lib/actions/marketplace'
import type { NmListingDetail, NmReview, NmSellerProfile } from '@/lib/types'
import EscrowOrderModal from './EscrowOrderModal'

interface Props
{
    listing: NmListingDetail
    reviews: NmReview[]
    sellerProfile: NmSellerProfile | null
    currentUserId: string
    userEmail: string
}

function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

const CONDITION_LABELS: Record<string, { label: string; cls: string }> = {
    new: { label: 'New', cls: 'bg-emerald-100 text-emerald-700' },
    fairly_used: { label: 'Fairly Used', cls: 'bg-amber-100 text-amber-700' },
    used: { label: 'Used', cls: 'bg-gray-100 text-gray-600' },
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'Confirmed', cls: 'bg-blue-100 text-blue-700' },
    packed: { label: 'Packed', cls: 'bg-indigo-100 text-indigo-700' },
    shipped: { label: 'Shipped', cls: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Delivered', cls: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
}

export default function ListingDetailClient({
    listing,
    reviews,
    sellerProfile,
    currentUserId,
    userEmail,
}: Props)
{
    const router = useRouter()
    const [imgIdx, setImgIdx] = useState(0)
    const [orderOpen, setOrderOpen] = useState(false)
    const [saved, setSaved] = useState(listing.is_saved)
    const [savingToggle, setSavingToggle] = useState(false)

    const images = listing.image_urls?.length > 0 ? listing.image_urls : (listing.cover_image_url ? [listing.cover_image_url] : [])
    const isOwner = listing.user_id === currentUserId
    const avgRating = listing.rating ?? 0
    const conditionCfg = listing.condition ? (CONDITION_LABELS[listing.condition] ?? { label: listing.condition, cls: 'bg-gray-100 text-gray-600' }) : null

    async function handleToggleSave()
    {
        setSavingToggle(true)
        try
        {
            const isSaved = await toggleSavedListing(listing.id)
            setSaved(isSaved)
            toast.success(isSaved ? 'Added to wishlist' : 'Removed from wishlist')
        } catch
        {
            toast.error('Failed to update wishlist')
        } finally
        {
            setSavingToggle(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Top bar */}
            <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <p className="text-sm font-bold text-gray-900 truncate flex-1">{listing.title}</p>
                <button
                    disabled={savingToggle}
                    onClick={handleToggleSave}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50">
                    {saved
                        ? <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        : <Heart className="w-4 h-4 text-gray-500" />}
                </button>
                <button
                    onClick={() => navigator.share?.({ title: listing.title, url: window.location.href }).catch(() => { })}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Share2 className="w-4 h-4 text-gray-700" />
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Image gallery */}
                <div className="bg-white">
                    <div className="relative aspect-square sm:aspect-video max-h-96 overflow-hidden">
                        {images.length > 0 ? (
                            <Image src={images[imgIdx]} alt={listing.title} fill
                                className="object-contain" sizes="800px" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                <Package className="w-16 h-16 text-gray-200" />
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
                    {/* Thumbnails */}
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
                    {/* Listing info */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                                {listing.category_name && (
                                    <p className="text-xs text-gray-500 mb-1">{listing.category_name}</p>
                                )}
                                <h1 className="text-xl font-black text-gray-900 leading-tight">{listing.title}</h1>
                            </div>
                            {conditionCfg && (
                                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${conditionCfg.cls}`}>
                                    {conditionCfg.label}
                                </span>
                            )}
                        </div>

                        <p className="text-3xl font-black text-gray-900">{fmt(listing.price)}</p>
                        {listing.negotiable && (
                            <p className="flex items-center gap-1 text-xs text-green-700 font-bold mt-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Price negotiable
                            </p>
                        )}
                        {listing.delivery_fee > 0 && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Truck className="w-3 h-3" /> Delivery fee: {fmt(listing.delivery_fee)}
                            </p>
                        )}

                        {/* Location + stock */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {(listing.city || listing.state) && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <MapPin className="w-3 h-3" />
                                    {[listing.city, listing.state].filter(Boolean).join(', ')}
                                </span>
                            )}
                            {listing.brand && (
                                <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    Brand: {listing.brand}
                                </span>
                            )}
                            <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                {listing.stock} in stock
                            </span>
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
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {listing.tags.map(tag => (
                                    <span key={tag} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Seller card */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Seller</p>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center overflow-hidden shrink-0">
                                {listing.seller_profile_image_url ? (
                                    <Image src={listing.seller_profile_image_url} alt="" width={48} height={48} className="object-cover" />
                                ) : (
                                    <span className="text-green-700 font-black text-lg">
                                        {(listing.seller_business_name ?? listing.seller_fullname ?? '?').charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-gray-900 truncate">
                                        {listing.seller_business_name ?? listing.seller_fullname ?? `@${listing.seller_username}`}
                                    </p>
                                    {listing.seller_is_verified && (
                                        <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                    )}
                                </div>
                                {listing.seller_username && (
                                    <p className="text-xs text-gray-500">@{listing.seller_username}</p>
                                )}
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[11px] font-bold text-gray-600">
                                        TradeCred: {listing.seller_tradecred_score}
                                    </span>
                                    {listing.seller_tier !== 'free' && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 capitalize">
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
                                <p className="text-[10px] text-gray-500">{listing.orders_count} sales</p>
                            </div>
                        </div>
                    </div>

                    {/* Warranty */}
                    {listing.warranty_days > 0 && (
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
                            <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-gray-700">Warranty</p>
                                <p className="text-xs text-gray-500 mt-0.5">{listing.warranty_days} day warranty</p>
                            </div>
                        </div>
                    )}

                    {/* Reviews */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reviews</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">({listing.review_count} reviews)</span>
                                </div>
                            </div>
                        </div>
                        {reviews.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">No reviews yet — be the first!</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.slice(0, 5).map(review => (
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
                                        {review.comment && <p className="text-xs text-gray-500">{review.comment}</p>}
                                        {review.photo_urls?.length > 0 && (
                                            <div className="flex gap-1.5 mt-2">
                                                {review.photo_urls.slice(0, 3).map((url, i) => (
                                                    <Image key={i} src={url} alt="" width={48} height={48}
                                                        className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-20" />
                </div>
            </div>

            {/* Fixed bottom CTA */}
            <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 flex gap-3 max-w-4xl mx-auto">
                {isOwner ? (
                    <Link href={`/app/market/${listing.id}/edit`}
                        className="flex-1 py-3 rounded-2xl text-sm font-black text-center text-white"
                        style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                        Edit Listing
                    </Link>
                ) : (
                    <>
                        <button
                            onClick={() => router.push(`/app/chat?to=${listing.user_id}`)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 border-green-700 text-green-700 hover:bg-green-50 transition-colors">
                            <MessageCircle className="w-4 h-4" /> Chat Seller
                        </button>
                        <button
                            disabled={!listing.is_active || listing.stock === 0}
                            onClick={() => setOrderOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            <ShoppingCart className="w-4 h-4" /> Buy Now
                        </button>
                    </>
                )}
            </div>

            <EscrowOrderModal
                open={orderOpen}
                onOpenChange={setOrderOpen}
                listing={listing}
                userEmail={userEmail}
                userId={currentUserId}
            />
        </div>
    )
}
