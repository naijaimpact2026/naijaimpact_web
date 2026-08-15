'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Store, Plus, Star, Package, ChevronRight, BadgeCheck } from 'lucide-react'
import type { StorefrontWithOwner } from '@/lib/types'
import CreateStorefrontModal from './CreateStorefrontModal'

interface Props
{
    initialStorefronts: StorefrontWithOwner[]
    myStorefront: { id: string; business_name: string; slug: string } | null
}

export default function StorefrontsClient({ initialStorefronts, myStorefront }: Props)
{
    const [createOpen, setCreateOpen] = useState(false)

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Hero */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.18),transparent 70%)' }} />
                <div className="relative z-10 px-5 pt-7 pb-8 max-w-5xl mx-auto">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">NaijaMarket</p>
                    <h1 className="text-3xl font-black text-white">Storefronts</h1>
                    <p className="text-sm text-green-300/60 mt-1">Mini online stores from Nigerian businesses</p>
                    <div className="mt-5 flex gap-3">
                        {myStorefront ? (
                            <Link href={`/app/market/stores/${myStorefront.slug}`}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-green-900 bg-white hover:bg-green-50 transition-all shadow-lg">
                                <Store className="w-4 h-4" /> My Store: {myStorefront.business_name}
                            </Link>
                        ) : (
                            <button
                                onClick={() => setCreateOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-green-900 bg-white hover:bg-green-50 transition-all shadow-lg">
                                <Plus className="w-4 h-4" /> Create Your Store
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">
                {initialStorefronts.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center">
                        <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="font-semibold text-gray-600">No storefronts yet</p>
                        <p className="text-sm text-gray-400 mt-1">Be the first to open a store!</p>
                        <button onClick={() => setCreateOpen(true)}
                            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white mx-auto transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            <Plus className="w-4 h-4" /> Create Store
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {initialStorefronts.map(sf => (
                            <Link key={sf.id} href={`/app/market/stores/${sf.slug}`}
                                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:border-green-200 hover:shadow-md transition-all group">
                                {/* Cover */}
                                <div className="relative h-32 bg-green-50">
                                    {sf.cover_url
                                        ? <Image src={sf.cover_url} alt="" fill className="object-cover" sizes="600px" />
                                        : <div className="absolute inset-0 flex items-center justify-center">
                                            <Store className="w-10 h-10 text-green-200" />
                                        </div>}
                                    {/* Logo */}
                                    {sf.logo_url && (
                                        <div className="absolute bottom-3 left-4 w-12 h-12 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                                            <Image src={sf.logo_url} alt="" fill className="object-cover" sizes="48px" />
                                        </div>
                                    )}
                                </div>

                                <div className="px-5 pb-5 pt-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-black text-gray-900">{sf.business_name}</p>
                                                {sf.owner.verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                                            </div>
                                            {sf.tagline && <p className="text-xs text-gray-500 mt-0.5">{sf.tagline}</p>}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-1 group-hover:text-green-700 transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                            <span className="text-xs font-bold text-gray-700">{sf.rating_average.toFixed(1)}</span>
                                            <span className="text-xs text-gray-400">({sf.rating_count})</span>
                                        </div>
                                        <span className="text-xs text-gray-400">{sf.product_count} products</span>
                                        <span className="text-xs text-gray-400">{sf.total_sales} sales</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                <div className="h-4" />
            </div>

            <CreateStorefrontModal open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    )
}
