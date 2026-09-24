'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from '@/components/toast'
import
    {
        ChevronLeft, ChevronRight, Share2, MapPin, Star, Shield,
        Package, MessageCircle, BadgeCheck, Calendar,
        CheckCircle2, Tag, Eye, TrendingUp,
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
        <div className="w-full">

            {/* Top bar */}
            <div className="sticky top-14 z-20 bg-card/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()}
                    className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                <p className="text-sm font-bold text-foreground truncate flex-1">{listing.title}</p>
                <button disabled={savingToggle} onClick={handleToggleSave}
                    className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors disabled:opacity-50">
                    <Heart className={`w-4 h-4 ${saved ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'}`} />
                </button>
                <button onClick={() => navigator.share?.({ title: listing.title, url: window.location.href }).catch(() => { })}
                    className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors">
                    <Share2 className="w-4 h-4 text-foreground" />
                </button>
            </div>

            <div className="mx-auto max-w-3xl">

                {/* ── Image gallery ── */}
                <div className="bg-card">
                    <div className="relative aspect-video max-h-80 overflow-hidden">
                        {images.length > 0 ? (
                            <Image src={images[imgIdx]} alt={listing.title} fill
                                className="object-cover" sizes="800px" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                                <span className="text-8xl font-black text-primary">
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
                                    className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-primary' : 'border-border'}`}>
                                    <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-4 py-4 space-y-3">

                    {/* ── Service header ── */}
                    <div className="bg-card rounded-3xl p-5 shadow-sm border border-border">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                                {listing.category_name && (
                                    <p className="text-xs text-primary font-semibold mb-1">{listing.category_name}</p>
                                )}
                                <h1 className="font-display text-xl font-black text-foreground leading-tight">{listing.title}</h1>
                            </div>
                        </div>

                        {/* Price + rating row */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                {listing.price > 0 && (
                                    <p className="text-2xl font-black text-foreground">From {fmt(listing.price)}</p>
                                )}
                                {listing.negotiable && (
                                    <p className="flex items-center gap-1 text-xs text-emerald font-semibold mt-0.5">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Price negotiable
                                    </p>
                                )}
                            </div>
                            {reviewCount > 0 && (
                                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="font-black text-foreground">{avgRating.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({reviewCount})</span>
                                </div>
                            )}
                        </div>

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {(listing.city || listing.state) && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                                    <MapPin className="w-3 h-3" />
                                    {[listing.city, listing.state].filter(Boolean).join(', ')}
                                </span>
                            )}
                            {listing.views_count > 0 && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                                    <Eye className="w-3 h-3" /> {listing.views_count} views
                                </span>
                            )}
                            {listing.orders_count > 0 && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                                    <TrendingUp className="w-3 h-3" /> {listing.orders_count} orders
                                </span>
                            )}
                            {listing.escrow_enabled && (
                                <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                                    <Shield className="w-3 h-3" /> Escrow Protected
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed mt-4">{listing.description}</p>
                        )}

                        {/* Tags */}
                        {listing.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-4">
                                {listing.tags.map((tag: string) => (
                                    <span key={tag}
                                        className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                                        <Tag className="w-2.5 h-2.5" />#{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Artisan / Seller profile ── */}
                    <div className="bg-card rounded-3xl p-5 shadow-sm border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">About the Artisan</p>
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/10 shrink-0 border border-border">
                                {listing.seller_profile_image_url ? (
                                    <Image src={listing.seller_profile_image_url} alt="" width={56} height={56}
                                        className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-primary font-black text-2xl">
                                        {(listing.seller_business_name ?? listing.seller_fullname ?? '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-foreground truncate">
                                        {listing.seller_business_name ?? listing.seller_fullname ?? 'Artisan'}
                                    </p>
                                    {listing.seller_is_verified && (
                                        <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                                    )}
                                </div>
                                {listing.seller_username && (
                                    <p className="text-xs text-muted-foreground">@{listing.seller_username}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[11px] text-muted-foreground">
                                        TradeCred: <strong className="text-foreground">{listing.seller_tradecred_score}</strong>
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
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    <span className="text-sm font-bold text-foreground">{listing.seller_rating.toFixed(1)}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">{listing.orders_count} jobs done</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Delivery + Warranty ── */}
                    {(listing.delivery_option !== 'none' || listing.warranty_days > 0) && (
                        <div className="bg-card rounded-3xl p-5 shadow-sm border border-border space-y-3">
                            {listing.delivery_option !== 'none' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Service Availability</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{listing.delivery_option.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            )}
                            {listing.warranty_days > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                                        <Shield className="w-4 h-4 text-emerald" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Service Guarantee</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{listing.warranty_days}-day guarantee</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Reviews ── */}
                    <div className="bg-card rounded-3xl p-5 shadow-sm border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reviews</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                                    ))}
                                    <span className="text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({reviewCount})</span>
                                </div>
                            </div>
                        </div>
                        {reviews.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet. Be the first client!</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.slice(0, 6).map(review => (
                                    <div key={review.id} className="border-t border-border pt-4">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                {(review.reviewer?.fullname ?? review.reviewer?.username ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-foreground">
                                                {review.reviewer?.fullname ?? `@${review.reviewer?.username}`}
                                            </span>
                                            <div className="flex ml-auto">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        {review.comment && <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>}
                                        {review.photo_urls?.length > 0 && (
                                            <div className="flex gap-1.5 mt-2">
                                                {review.photo_urls.slice(0, 3).map((url: string, i: number) => (
                                                    <Image key={i} src={url} alt="" width={48} height={48}
                                                        className="w-12 h-12 rounded-lg object-cover border border-border" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* ── Fixed bottom CTA ── */}
            <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 flex gap-3 max-w-3xl mx-auto">
                {isOwner ? (
                    <button className="flex-1 py-3 rounded-2xl text-sm font-black text-center text-primary-foreground bg-primary transition-colors hover:bg-primary/90"
                        onClick={() => router.push(`/app/market/${listing.id}`)}>
                        View / Edit Service Listing
                    </button>
                ) : (
                    <>
                        <button onClick={handleContact}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 border-primary text-primary hover:bg-primary/5 transition-colors">
                            <MessageCircle className="w-4 h-4" /> Chat Artisan
                        </button>
                        {listing.price > 0 && (
                            <button
                                onClick={() => router.push(`/app/market/${listing.id}`)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-primary-foreground bg-primary transition-colors hover:bg-primary/90">
                                <Calendar className="w-4 h-4" /> Book / Order
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
