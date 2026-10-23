'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Loader2, Package, Pin, Plus, Search, ShoppingBag, X } from 'lucide-react'
import { toast } from '@/components/toast'
import { getCreatorStorefrontListings, pinStreamProduct, unpinStreamProduct } from '@/lib/actions/live-shopping'
import type { PinnedProduct } from '@/lib/types'

interface StudioPinProductModalProps {
    isOpen: boolean
    onClose: () => void
    liveStreamId: string
    currentPinnedProduct?: PinnedProduct | null
    onProductPinned?: (product: PinnedProduct | null) => void
}

export default function StudioPinProductModal({
    isOpen,
    onClose,
    liveStreamId,
    currentPinnedProduct,
    onProductPinned,
}: StudioPinProductModalProps) {
    const [mounted, setMounted] = useState(false)
    const [products, setProducts] = useState<PinnedProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [pinningId, setPinningId] = useState<string | null>(null)
    const [unpinning, setUnpinning] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        if (!isOpen) return
        setLoading(true)
        getCreatorStorefrontListings()
            .then((items) => {
                setProducts(items)
            })
            .finally(() => setLoading(false))
    }, [isOpen])

    if (!isOpen || !mounted || typeof document === 'undefined') return null

    const filtered = products.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handlePin = async (product: PinnedProduct) => {
        setPinningId(product.id)
        try {
            const res = await pinStreamProduct({ liveStreamId, product })
            if (!res.success) {
                toast.error(res.error || 'Could not pin product')
                return
            }
            toast.success(`Pinned "${product.title}" to your live stream!`)
            if (onProductPinned) onProductPinned(product)
            onClose()
        } catch {
            toast.error('Unexpected error while pinning product')
        } finally {
            setPinningId(null)
        }
    }

    const handleUnpin = async () => {
        setUnpinning(true)
        try {
            const res = await unpinStreamProduct(liveStreamId)
            if (!res.success) {
                toast.error(res.error || 'Could not unpin product')
                return
            }
            toast.success('Product unpinned from stream.')
            if (onProductPinned) onProductPinned(null)
            onClose()
        } catch {
            toast.error('Unexpected error while unpinning product')
        } finally {
            setUnpinning(false)
        }
    }

    return createPortal(
        <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-500/30 bg-card text-card-foreground dark:bg-[#121824] p-5 sm:p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground">Live Shopping Pin</h3>
                            <p className="text-xs text-muted-foreground">
                                Feature items from your storefront for viewers to buy live
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Currently Pinned Item Banner */}
                {currentPinnedProduct && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                                {currentPinnedProduct.cover_image_url ? (
                                    <Image
                                        src={currentPinnedProduct.cover_image_url}
                                        alt={currentPinnedProduct.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                ) : (
                                    <Package className="h-5 w-5 m-auto text-muted-foreground" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    <Pin className="h-3 w-3" /> Live Featured
                                </span>
                                <p className="truncate text-xs font-bold text-foreground">
                                    {currentPinnedProduct.title}
                                </p>
                                <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                                    ₦{Number(currentPinnedProduct.price).toLocaleString('en-NG')}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={unpinning}
                            onClick={handleUnpin}
                            className="shrink-0 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                        >
                            {unpinning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Unpin Item'}
                        </button>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search your products and services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                {/* Product List */}
                <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-xs text-muted-foreground">Loading your storefront items...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                            <Package className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-xs font-semibold text-foreground">No storefront items found</p>
                            <p className="text-[11px] text-muted-foreground max-w-xs">
                                Create a product or service in your Hivenovo Storefront to feature it live during broadcasts.
                            </p>
                            <Link
                                href="/app/market/create"
                                onClick={onClose}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" /> Create Storefront Item
                            </Link>
                        </div>
                    ) : (
                        filtered.map((item) => {
                            const isCurrentlyPinned = currentPinnedProduct?.id === item.id
                            const isThisPinning = pinningId === item.id

                            return (
                                <div
                                    key={item.id}
                                    className={`flex items-center justify-between gap-3 rounded-2xl border p-2.5 transition-all ${
                                        isCurrentlyPinned
                                            ? 'border-amber-500/40 bg-amber-500/5'
                                            : 'border-border/80 bg-background/50 hover:bg-muted/40 hover:border-border'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                                            {item.cover_image_url ? (
                                                <Image
                                                    src={item.cover_image_url}
                                                    alt={item.title}
                                                    fill
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <Package className="h-4 w-4 m-auto text-muted-foreground/50" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-foreground">
                                                {item.title}
                                            </p>
                                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                ₦{Number(item.price).toLocaleString('en-NG')}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isCurrentlyPinned || isThisPinning}
                                        onClick={() => handlePin(item)}
                                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 ${
                                            isCurrentlyPinned
                                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                                : 'bg-primary hover:bg-primary/90 text-white shadow-xs'
                                        }`}
                                    >
                                        {isThisPinning ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : isCurrentlyPinned ? (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                <span>Pinned</span>
                                            </>
                                        ) : (
                                            <>
                                                <Pin className="h-3.5 w-3.5" />
                                                <span>Pin Live</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer Note */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>92% creator split on in-stream sales</span>
                    <Link href="/app/market" onClick={onClose} className="text-primary hover:underline font-semibold">
                        View Storefront →
                    </Link>
                </div>
            </div>
        </div>,
        document.body
    )
}
