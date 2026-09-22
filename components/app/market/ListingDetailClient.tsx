'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import
    {
        ChevronLeft, ChevronRight, Share2, MapPin, Star, Shield,
        Package, MessageCircle, ShoppingCart, Truck,
        BadgeCheck, Heart, CheckCircle2,
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
    return `₦${n.toLocaleString('en-NG')}`
}

const CONDITION_LABELS: Record<string, { label: string; cls: string }> = {
    new: { label: 'New', cls: 'bg-emerald/10 text-emerald' },
    fairly_used: { label: 'Fairly Used', cls: 'bg-amber-100 text-amber-700' },
    used: { label: 'Used', cls: 'bg-muted text-muted-foreground' },
}

export default function ListingDetailClient({
    listing,
    reviews,
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
    const conditionCfg = listing.condition ? (CONDITION_LABELS[listing.condition] ?? { label: listing.condition, cls: 'bg-muted text-muted-foreground' }) : null

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
        <div className="w-full">
            {/* Top bar */}
            <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
                <button onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted transition-colors hover:bg-muted/70">
                    <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
                <p className="flex-1 truncate text-sm font-bold text-foreground">{listing.title}</p>
                <button
                    disabled={savingToggle}
                    onClick={handleToggleSave}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted transition-colors hover:bg-muted/70 disabled:opacity-50">
                    {saved
                        ? <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                        : <Heart className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button
                    onClick={() => navigator.share?.({ title: listing.title, url: window.location.href }).catch(() => { })}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted transition-colors hover:bg-muted/70">
                    <Share2 className="h-4 w-4 text-foreground" />
                </button>
            </div>

            <div className="w-full px-4 sm:px-6 lg:px-8">
                {/* Image gallery */}
                <div className="-mx-4 bg-card sm:-mx-6 lg:-mx-8">
                    <div className="relative mx-auto max-h-96 max-w-3xl aspect-square overflow-hidden sm:aspect-video">
                        {images.length > 0 ? (
                            <Image src={images[imgIdx]} alt={listing.title} fill
                                className="object-contain" sizes="800px" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                <Package className="h-16 w-16 text-muted-foreground/30" />
                            </div>
                        )}
                        {images.length > 1 && (
                            <>
                                <button onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
                                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
                            {images.map((img, i) => (
                                <button key={i} onClick={() => setImgIdx(i)}
                                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${i === imgIdx ? 'border-primary' : 'border-border'}`}>
                                    <Image src={img} alt="" width={56} height={56} className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mx-auto max-w-3xl space-y-3 py-4">
                    {/* Listing info */}
                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                        <div className="mb-3 flex items-start gap-3">
                            <div className="flex-1">
                                {listing.category_name && (
                                    <p className="mb-1 text-xs text-muted-foreground">{listing.category_name}</p>
                                )}
                                <h1 className="font-display text-xl font-black leading-tight text-foreground">{listing.title}</h1>
                            </div>
                            {conditionCfg && (
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${conditionCfg.cls}`}>
                                    {conditionCfg.label}
                                </span>
                            )}
                        </div>

                        <p className="text-3xl font-black text-foreground">{fmt(listing.price)}</p>
                        {listing.negotiable && (
                            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Price negotiable
                            </p>
                        )}
                        {listing.delivery_fee > 0 && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <Truck className="h-3 w-3" /> Delivery fee: {fmt(listing.delivery_fee)}
                            </p>
                        )}

                        {/* Location + stock */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {(listing.city || listing.state) && (
                                <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {[listing.city, listing.state].filter(Boolean).join(', ')}
                                </span>
                            )}
                            {listing.brand && (
                                <span className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                                    Brand: {listing.brand}
                                </span>
                            )}
                            <span className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                                {listing.stock} in stock
                            </span>
                            {listing.escrow_enabled && (
                                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary">
                                    <Shield className="h-3 w-3" /> Escrow Protected
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
                        )}

                        {/* Tags */}
                        {listing.tags?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {listing.tags.map(tag => (
                                    <span key={tag} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Seller card */}
                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Seller</p>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10">
                                {listing.seller_profile_image_url ? (
                                    <Image src={listing.seller_profile_image_url} alt="" width={48} height={48} className="object-cover" />
                                ) : (
                                    <span className="text-lg font-black text-primary">
                                        {(listing.seller_business_name ?? listing.seller_fullname ?? '?').charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="truncate font-bold text-foreground">
                                        {listing.seller_business_name ?? listing.seller_fullname ?? `@${listing.seller_username}`}
                                    </p>
                                    {listing.seller_is_verified && (
                                        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                                    )}
                                </div>
                                {listing.seller_username && (
                                    <p className="text-xs text-muted-foreground">@{listing.seller_username}</p>
                                )}
                                <div className="mt-0.5 flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-muted-foreground">
                                        TradeCred: {listing.seller_tradecred_score}
                                    </span>
                                    {listing.seller_tier !== 'free' && (
                                        <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold capitalize text-amber-700">
                                            {listing.seller_tier.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    <span className="text-sm font-bold text-foreground">{listing.seller_rating.toFixed(1)}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">{listing.orders_count} sales</p>
                            </div>
                        </div>
                    </div>

                    {/* Warranty */}
                    {listing.warranty_days > 0 && (
                        <div className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
                            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald" />
                            <div>
                                <p className="text-xs font-bold text-foreground">Warranty</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{listing.warranty_days} day warranty</p>
                            </div>
                        </div>
                    )}

                    {/* Reviews */}
                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reviews</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({listing.review_count} reviews)</span>
                                </div>
                            </div>
                        </div>
                        {reviews.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">No reviews yet. Be the first!</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.slice(0, 5).map(review => (
                                    <div key={review.id} className="border-t border-border pt-4">
                                        <div className="mb-1.5 flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                {(review.reviewer?.fullname ?? review.reviewer?.username ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-foreground">
                                                {review.reviewer?.fullname ?? `@${review.reviewer?.username}`}
                                            </span>
                                            <div className="ml-auto flex">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        {review.comment && <p className="text-xs text-muted-foreground">{review.comment}</p>}
                                        {review.photo_urls?.length > 0 && (
                                            <div className="mt-2 flex gap-1.5">
                                                {review.photo_urls.slice(0, 3).map((url, i) => (
                                                    <Image key={i} src={url} alt="" width={48} height={48}
                                                        className="h-12 w-12 rounded-lg border border-border object-cover" />
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
            <div className="fixed bottom-16 left-0 right-0 z-30 mx-auto flex max-w-3xl gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm lg:bottom-0">
                {isOwner ? (
                    <Link href={`/app/market/${listing.id}/edit`}
                        className="flex-1 rounded-2xl bg-primary py-3 text-center text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90">
                        Edit Listing
                    </Link>
                ) : (
                    <>
                        <button
                            onClick={() => router.push(`/app/chat?to=${listing.user_id}`)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-primary py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/5">
                            <MessageCircle className="h-4 w-4" /> Chat Seller
                        </button>
                        <button
                            disabled={!listing.is_active || listing.stock === 0}
                            onClick={() => setOrderOpen(true)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-black text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50">
                            <ShoppingCart className="h-4 w-4" /> Buy Now
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
