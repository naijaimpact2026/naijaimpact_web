'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Package, Heart, Star, MapPin, ShoppingCart } from 'lucide-react'
import { toggleSavedListing } from '@/lib/actions/marketplace'
import { useMarketCart } from './MarketCartProvider'
import type { NmListingDetail } from '@/lib/types'

export function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG')}`
}

export default function ListingCard({ listing }: { listing: NmListingDetail })
{
    const { addItem, items } = useMarketCart()
    const [saved, setSaved] = useState(listing.is_saved)
    const [savePending, setSavePending] = useState(false)
    const inCart = items.some((i) => i.listingId === listing.id)

    const coverImg = listing.cover_image_url ?? listing.image_urls?.[0] ?? null

    const conditionColors: Record<string, string> = {
        new: 'bg-emerald text-emerald-foreground',
        fairly_used: 'bg-amber-400 text-white',
        used: 'bg-gray-400 text-white',
    }

    async function handleSaveToggle(e: React.MouseEvent)
    {
        e.preventDefault()
        e.stopPropagation()
        if (savePending) return
        setSavePending(true)
        const next = !saved
        setSaved(next)
        try
        {
            const result = await toggleSavedListing(listing.id)
            setSaved(result)
        }
        catch
        {
            setSaved(!next)
            toast.error('Could not update saved items')
        }
        finally
        {
            setSavePending(false)
        }
    }

    function handleAddToCart(e: React.MouseEvent)
    {
        e.preventDefault()
        e.stopPropagation()
        if (listing.stock <= 0)
        {
            toast.error('Out of stock')
            return
        }
        addItem({
            listingId: listing.id,
            title: listing.title,
            price: listing.price,
            image: coverImg,
            sellerId: listing.seller_id,
            sellerName: listing.seller_business_name ?? 'Seller',
            stock: listing.stock,
        })
        toast.success('Added to cart')
    }

    return (
        <Link href={`/app/market/${listing.id}`}
            className="group flex h-full flex-col cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg">
            <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-muted">
                {coverImg ? (
                    <Image src={coverImg} alt={listing.title} fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <Package className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                )}

                {listing.condition && (
                    <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${conditionColors[listing.condition] ?? 'bg-gray-400 text-white'}`}>
                        {listing.condition === 'fairly_used' ? 'Fairly Used' : listing.condition === 'new' ? 'New' : 'Used'}
                    </span>
                )}

                <button
                    onClick={handleSaveToggle}
                    aria-label={saved ? 'Remove from saved' : 'Save item'}
                    aria-pressed={saved}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform active:scale-90"
                >
                    <Heart className={`h-3.5 w-3.5 ${saved ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
                </button>

                {listing.is_featured && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-400/90 to-transparent px-3 py-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-950">
                            <Star className="h-3 w-3 fill-amber-950" /> Featured
                        </span>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-3">
                <div>
                    <p className="mb-1 line-clamp-2 text-xs font-bold leading-snug text-foreground">{listing.title}</p>

                    {listing.review_count > 0 && (
                        <p className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-foreground">{listing.rating.toFixed(1)}</span>
                            ({listing.review_count})
                        </p>
                    )}

                    <p className="truncate text-sm font-black text-foreground" title={fmt(listing.price)}>{fmt(listing.price)}</p>
                    {listing.negotiable && (
                        <p className="mt-0.5 text-[10px] font-semibold text-emerald">Negotiable</p>
                    )}
                    {(listing.city || listing.state) && (
                        <p className="mt-1 flex items-center gap-0.5 truncate text-[10px] text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{[listing.city, listing.state].filter(Boolean).join(', ')}</span>
                        </p>
                    )}
                </div>

                <button
                    onClick={handleAddToCart}
                    disabled={listing.stock <= 0}
                    className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors disabled:opacity-50 ${inCart ? 'bg-primary/10 text-primary' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {listing.stock <= 0 ? 'Out of Stock' : inCart ? 'Added' : 'Add to Cart'}
                </button>
            </div>
        </Link>
    )
}
