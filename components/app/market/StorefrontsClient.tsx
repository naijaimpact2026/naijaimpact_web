'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Store, Plus, Star, BadgeCheck } from 'lucide-react'
import CreateStorefrontModal from './CreateStorefrontModal'

interface StorefrontSummary
{
    id: string
    business_name: string | null
    logo_url: string | null
    state: string | null
    city: string | null
    is_verified: boolean
    rating: number
    total_sales: number
    product_count: number
    owner: { verified?: boolean } | null
}

interface Props
{
    initialStorefronts: StorefrontSummary[]
    myStorefront: { id: string; business_name: string } | null
}

export default function StorefrontsClient({ initialStorefronts, myStorefront }: Props)
{
    const [createOpen, setCreateOpen] = useState(false)

    return (
        <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl"
                style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}>
                <div className="px-6 py-7 sm:px-8">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-200">Hubnovo Marketplace</p>
                    <h1 className="font-display text-3xl font-black text-white">Storefronts</h1>
                    <p className="mt-1 text-sm text-white/70">Mini online stores from Nigerian businesses</p>
                    <div className="mt-5 flex gap-3">
                        {myStorefront ? (
                            <Link href={`/app/market/stores/${myStorefront.id}`}
                                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-secondary shadow-lg transition-colors hover:bg-white/90">
                                <Store className="h-4 w-4" /> My Store: {myStorefront.business_name}
                            </Link>
                        ) : (
                            <button
                                onClick={() => setCreateOpen(true)}
                                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-secondary shadow-lg transition-colors hover:bg-white/90">
                                <Plus className="h-4 w-4" /> Create Your Store
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {initialStorefronts.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card py-16 text-center">
                    <Store className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                    <p className="font-semibold text-muted-foreground">No storefronts yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Be the first to open a store!</p>
                    <button onClick={() => setCreateOpen(true)}
                        className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                        <Plus className="h-4 w-4" /> Create Store
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {initialStorefronts.map(sf => (
                        <Link key={sf.id} href={`/app/market/stores/${sf.id}`}
                            className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                            {/* Banner */}
                            <div className="relative h-20 bg-gradient-to-br from-primary/10 to-secondary/20">
                                {sf.logo_url && (
                                    <div className="absolute -bottom-6 left-4 h-14 w-14 overflow-hidden rounded-2xl border-4 border-card shadow-lg">
                                        <Image src={sf.logo_url} alt="" fill className="object-cover" sizes="56px" />
                                    </div>
                                )}
                            </div>

                            <div className="px-4 pb-4 pt-8">
                                <div className="flex items-center gap-1.5">
                                    <p className="truncate font-black text-foreground">{sf.business_name ?? 'Unnamed Store'}</p>
                                    {(sf.is_verified || sf.owner?.verified) && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                                </div>
                                {(sf.city || sf.state) && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">{[sf.city, sf.state].filter(Boolean).join(', ')}</p>
                                )}
                                <div className="mt-3 flex items-center gap-3">
                                    {sf.rating > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                            <span className="text-xs font-bold text-foreground">{sf.rating.toFixed(1)}</span>
                                        </div>
                                    )}
                                    <span className="text-xs text-muted-foreground">{sf.product_count} products</span>
                                    {sf.total_sales > 0 && <span className="text-xs text-muted-foreground">{sf.total_sales} sales</span>}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <CreateStorefrontModal open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    )
}
