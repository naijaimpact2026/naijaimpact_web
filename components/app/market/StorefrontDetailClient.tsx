'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Phone, Mail, Globe, Store, Package, BadgeCheck, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { StorefrontWithOwner } from '@/lib/types'

interface Props
{
    storefront: StorefrontWithOwner & { products: any[] }
    currentUserId: string
}

function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

export default function StorefrontDetailClient({ storefront, currentUserId }: Props)
{
    const router = useRouter()
    const isOwner = storefront.owner_id === currentUserId

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Back bar */}
            <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <p className="text-sm font-bold text-gray-900 flex-1 truncate">{storefront.business_name}</p>
            </div>

            {/* Cover + Logo */}
            <div className="relative h-48 bg-green-50">
                {storefront.cover_url
                    ? <Image src={storefront.cover_url} alt="" fill className="object-cover" sizes="800px" />
                    : <div className="absolute inset-0 flex items-center justify-center"><Store className="w-16 h-16 text-green-200" /></div>}
                {storefront.logo_url && (
                    <div className="absolute bottom-0 translate-y-1/2 left-6 w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                        <Image src={storefront.logo_url} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                )}
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-14 pb-6 space-y-5">
                {/* Store header */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-gray-900">{storefront.business_name}</h1>
                                {storefront.owner.verified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                            </div>
                            {storefront.tagline && <p className="text-sm text-gray-600 mt-0.5">{storefront.tagline}</p>}
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${storefront.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {storefront.status}
                        </span>
                    </div>

                    {storefront.description && (
                        <p className="text-sm text-gray-500 mt-4 leading-relaxed">{storefront.description}</p>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="text-center p-3 bg-gray-50 rounded-2xl">
                            <p className="text-xl font-black text-gray-900">{storefront.product_count}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Products</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-2xl">
                            <p className="text-xl font-black text-gray-900">{storefront.total_sales}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Sales</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-2xl">
                            <div className="flex items-center justify-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <p className="text-xl font-black text-gray-900">{storefront.rating_average.toFixed(1)}</p>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">Rating</p>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {storefront.phone && (
                            <a href={`tel:${storefront.phone}`}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                                <Phone className="w-3.5 h-3.5" /> {storefront.phone}
                            </a>
                        )}
                        {storefront.email && (
                            <a href={`mailto:${storefront.email}`}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                                <Mail className="w-3.5 h-3.5" /> {storefront.email}
                            </a>
                        )}
                        {storefront.website && (
                            <a href={storefront.website} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                                <Globe className="w-3.5 h-3.5" /> Website
                            </a>
                        )}
                    </div>
                </div>

                {/* Products grid */}
                <section>
                    <h2 className="font-bold text-gray-900 mb-3">Products ({storefront.products.length})</h2>
                    {storefront.products.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 py-12 text-center">
                            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No products listed yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {storefront.products.map((p: any) => (
                                <Link key={p.id} href={`/app/market/${p.id}`}
                                    className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-green-300 hover:shadow-md transition-all">
                                    <div className="relative aspect-square bg-gray-50">
                                        {p.images?.[0]
                                            ? <Image src={p.images[0]} alt={p.title} fill className="object-cover" sizes="200px" />
                                            : <div className="absolute inset-0 flex items-center justify-center"><Package className="w-8 h-8 text-gray-200" /></div>}
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs font-bold text-gray-800 line-clamp-2">{p.title}</p>
                                        <p className="text-sm font-black text-gray-900 mt-1">{fmt(p.price)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <div className="h-4" />
            </div>
        </div>
    )
}
