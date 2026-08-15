'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import
    {
        ShoppingCart, MessageCircle, Share2, MapPin, Star, Shield,
        ChevronLeft, ChevronRight, Package, CheckCircle2, AlertCircle,
        BadgeCheck, Clock, Truck, RotateCcw,
    } from 'lucide-react'
import type { ProductWithSeller, MarketplaceReview, SellerTrustScore } from '@/lib/types'
import BuyNowModal from './BuyNowModal'

interface Props
{
    product: ProductWithSeller
    reviews: (MarketplaceReview & { reviewer: { username: string; display_name: string; avatar_url: string | null } })[]
    trustScore: SellerTrustScore | null
    currentUserId: string
    userEmail: string
}

function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function ConditionBadge({ condition }: { condition: string })
{
    const map: Record<string, { label: string; cls: string }> = {
        new: { label: 'New', cls: 'bg-emerald-100 text-emerald-700' },
        used_good: { label: 'Used — Good', cls: 'bg-blue-100 text-blue-700' },
        used_fair: { label: 'Used — Fair', cls: 'bg-amber-100 text-amber-700' },
        refurbished: { label: 'Refurbished', cls: 'bg-purple-100 text-purple-700' },
    }
    const cfg = map[condition] ?? { label: condition, cls: 'bg-gray-100 text-gray-600' }
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>
    )
}

export default function ProductDetailClient({ product, reviews, trustScore, currentUserId, userEmail }: Props)
{
    const router = useRouter()
    const [imgIdx, setImgIdx] = useState(0)
    const [buyOpen, setBuyOpen] = useState(false)
    const isOwner = product.seller_id === currentUserId
    const images = product.images.length > 0 ? product.images : []
    const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Back bar */}
            <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <p className="text-sm font-bold text-gray-900 truncate flex-1">{product.title}</p>
                <button onClick={() => navigator.share?.({ title: product.title, url: window.location.href })}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Share2 className="w-4 h-4 text-gray-700" />
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* ── Image gallery ── */}
                <div className="relative bg-white">
                    <div className="relative aspect-square sm:aspect-video max-h-96 overflow-hidden">
                        {images.length > 0 ? (
                            <Image src={images[imgIdx]} alt={product.title} fill
                                className="object-contain" sizes="800px" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                <Package className="w-16 h-16 text-gray-200" />
                            </div>
                        )}
                        {images.length > 1 && (
                            <>
                                <button onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
                            {images.map((img, i) => (
                                <button key={i} onClick={() => setImgIdx(i)}
                                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-green-600' : 'border-gray-200'}`}>
                                    <Image src={img} alt="" width={64} height={64} className="object-cover w-full h-full" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-4 py-5 space-y-4">
                    {/* ── Product info ── */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">{product.category}{product.subcategory ? ` › ${product.subcategory}` : ''}</p>
                                <h1 className="text-xl font-black text-gray-900 leading-tight">{product.title}</h1>
                            </div>
                            <ConditionBadge condition={product.condition} />
                        </div>

                        <p className="text-3xl font-black text-gray-900">{fmt(product.price)}</p>
                        {product.negotiable && (
                            <p className="text-xs text-green-700 font-bold mt-1">✓ Price negotiable</p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-3">
                            {product.location && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <MapPin className="w-3 h-3" /> {product.location}
                                </span>
                            )}
                            {product.brand && (
                                <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    Brand: {product.brand}
                                </span>
                            )}
                            <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                {product.stock_quantity} in stock
                            </span>
                        </div>

                        {product.description && (
                            <p className="text-sm text-gray-600 leading-relaxed mt-4">{product.description}</p>
                        )}

                        {/* Delivery options */}
                        {product.delivery_options.length > 0 && (
                            <div className="flex gap-2 mt-4">
                                {product.delivery_options.map(opt => (
                                    <span key={opt}
                                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">
                                        {opt === 'delivery' ? <Truck className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                                        {opt === 'delivery' ? 'Delivery Available' : 'Pickup Available'}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Seller profile ── */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Seller</p>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-700 font-black text-lg overflow-hidden shrink-0">
                                {product.seller.avatar_url
                                    ? <Image src={product.seller.avatar_url} alt="" width={48} height={48} className="object-cover w-full h-full" />
                                    : product.seller.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-gray-900">{product.seller.display_name}</p>
                                    {product.seller.verified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                                </div>
                                <p className="text-xs text-gray-500">@{product.seller.username}</p>
                            </div>
                            {trustScore && (
                                <div className="shrink-0 text-right">
                                    <p className="text-lg font-black text-gray-900">{trustScore.score}</p>
                                    <p className="text-[10px] text-gray-500">Trust Score</p>
                                </div>
                            )}
                        </div>

                        {/* Trust metrics */}
                        {trustScore && (
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div className="text-center p-3 bg-gray-50 rounded-2xl">
                                    <p className="text-sm font-black text-gray-900">{trustScore.transaction_count}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Transactions</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-2xl">
                                    <p className="text-sm font-black text-green-700">{trustScore.delivery_success_rate}%</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Delivery Rate</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-2xl">
                                    <p className="text-sm font-black text-gray-900">{trustScore.response_time_hours ?? '—'}h</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Response Time</p>
                                </div>
                            </div>
                        )}

                        {/* Storefront link */}
                        {product.storefront && (
                            <Link href={`/app/market/stores/${product.storefront.slug}`}
                                className="mt-3 flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-green-50 text-green-700 text-sm font-bold hover:bg-green-100 transition-colors">
                                <Package className="w-4 h-4" /> View Store: {product.storefront.business_name}
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </Link>
                        )}
                    </div>

                    {/* ── Specs ── */}
                    {Object.keys(product.specifications).length > 0 && (
                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Specifications</p>
                            <div className="space-y-2">
                                {Object.entries(product.specifications).map(([k, v]) => (
                                    <div key={k} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{k}</span>
                                        <span className="font-semibold text-gray-900">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Reviews ── */}
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
                                    <span className="text-xs text-gray-500">({reviews.length} reviews)</span>
                                </div>
                            </div>
                        </div>
                        {reviews.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">No reviews yet</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.slice(0, 5).map(review => (
                                    <div key={review.id} className="border-t border-gray-50 pt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                                                {review.reviewer.display_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-gray-800">{review.reviewer.display_name}</span>
                                            <div className="flex ml-auto">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        {review.title && <p className="text-sm font-semibold text-gray-900">{review.title}</p>}
                                        {review.body && <p className="text-xs text-gray-500 mt-1">{review.body}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Policies */}
                    {(product.warranty || product.return_policy) && (
                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
                            {product.warranty && (
                                <div className="flex items-start gap-3">
                                    <Shield className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">Warranty</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{product.warranty}</p>
                                    </div>
                                </div>
                            )}
                            {product.return_policy && (
                                <div className="flex items-start gap-3">
                                    <RotateCcw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">Return Policy</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{product.return_policy}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="h-24" />
                </div>
            </div>

            {/* ── Fixed bottom CTA ── */}
            <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 flex gap-3 max-w-4xl mx-auto">
                {isOwner ? (
                    <Link href={`/app/market/${product.id}/edit`}
                        className="flex-1 py-3 rounded-2xl text-sm font-black text-center text-white"
                        style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                        Edit Listing
                    </Link>
                ) : (
                    <>
                        <button
                            onClick={() =>
                            {
                                // Open Stream Chat DM with seller
                                window.location.href = `/app/chat?to=${product.seller_id}`
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 border-green-700 text-green-700 hover:bg-green-50 transition-colors">
                            <MessageCircle className="w-4 h-4" /> Chat Seller
                        </button>
                        <button
                            disabled={product.status !== 'active' || product.stock_quantity === 0}
                            onClick={() => setBuyOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            <ShoppingCart className="w-4 h-4" /> Buy Now
                        </button>
                    </>
                )}
            </div>

            <BuyNowModal
                open={buyOpen}
                onOpenChange={setBuyOpen}
                product={product}
                userEmail={userEmail}
                userId={currentUserId}
            />
        </div>
    )
}
