'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronUp, Package, ShoppingBag, Sparkles } from 'lucide-react'
import LiveProductBuyModal from '@/components/app/modushive/LiveProductBuyModal'
import type { PinnedProduct } from '@/lib/types'

interface PinnedProductOverlayProps {
    liveStreamId: string
    product?: PinnedProduct | null
    viewerLoggedIn: boolean
}

export default function PinnedProductOverlay({
    liveStreamId,
    product,
    viewerLoggedIn,
}: PinnedProductOverlayProps) {
    const [isMinimized, setIsMinimized] = useState(false)
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)

    if (!product) return null

    return (
        <>
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 pointer-events-auto max-w-[calc(100%-1.5rem)] sm:max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                {isMinimized ? (
                    <button
                        type="button"
                        onClick={() => setIsMinimized(false)}
                        className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-slate-950/85 backdrop-blur-xl px-3 py-1.5 text-xs font-bold text-white shadow-xl hover:bg-black transition-all hover:scale-105"
                        title="Expand pinned product"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                        <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-amber-400">Featured Item:</span>
                        <span>₦{Number(product.price).toLocaleString('en-NG')}</span>
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
                    </button>
                ) : (
                    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-950/90 backdrop-blur-xl p-3 shadow-2xl text-white">
                        {/* Minimize Button */}
                        <button
                            type="button"
                            onClick={() => setIsMinimized(true)}
                            className="absolute right-2 top-2 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                            title="Minimize product card"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-3 pr-5">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/50">
                                {product.cover_image_url ? (
                                    <Image
                                        src={product.cover_image_url}
                                        alt={product.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                ) : (
                                    <Package className="h-5 w-5 m-auto text-white/50" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                    <Sparkles className="h-2.5 w-2.5" /> Live Featured
                                </span>
                                <p className="truncate text-xs font-bold text-white leading-tight">
                                    {product.title}
                                </p>
                                <p className="text-xs font-extrabold text-amber-400 mt-0.5">
                                    ₦{Number(product.price).toLocaleString('en-NG')}
                                </p>
                            </div>
                        </div>

                        {/* Action CTA */}
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-white/60 truncate">
                                Direct from streamer
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsBuyModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3.5 py-1 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-all"
                            >
                                <ShoppingBag className="h-3 w-3" />
                                <span>Buy Now</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* In-Stream Buy Modal */}
            <LiveProductBuyModal
                isOpen={isBuyModalOpen}
                onClose={() => setIsBuyModalOpen(false)}
                liveStreamId={liveStreamId}
                product={product}
                viewerLoggedIn={viewerLoggedIn}
            />
        </>
    )
}
