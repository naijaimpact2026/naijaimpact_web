'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Phone, Store, Package, BadgeCheck, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StorefrontProduct
{
    id: string
    title: string
    price: number
    cover_image: string | null
}

interface StorefrontDetail
{
    id: string
    business_name: string | null
    bio: string | null
    logo_url: string | null
    phone: string | null
    is_verified: boolean
    rating: number
    total_sales: number
    product_count: number
    products: StorefrontProduct[]
    owner: { verified?: boolean } | null
}

interface Props
{
    storefront: StorefrontDetail
    currentUserId: string
}

function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG')}`
}

export default function StorefrontDetailClient({ storefront }: Props)
{
    const router = useRouter()

    return (
        <div className="w-full">
            {/* Back bar */}
            <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
                <button onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted transition-colors hover:bg-muted/70">
                    <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
                <p className="flex-1 truncate text-sm font-bold text-foreground">{storefront.business_name}</p>
            </div>

            {/* Cover + Logo */}
            <div className="relative h-40 bg-gradient-to-br from-primary/10 to-secondary/20">
                {storefront.logo_url ? (
                    <div className="absolute bottom-0 left-6 h-20 w-20 translate-y-1/2 overflow-hidden rounded-3xl border-4 border-background shadow-xl sm:left-10">
                        <Image src={storefront.logo_url} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Store className="h-14 w-14 text-primary/20" />
                    </div>
                )}
            </div>

            <div className="w-full space-y-5 px-4 pb-6 pt-14 sm:px-6 lg:px-8">
                {/* Store header */}
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-display text-xl font-black text-foreground">{storefront.business_name}</h1>
                                {(storefront.is_verified || storefront.owner?.verified) && <BadgeCheck className="h-5 w-5 text-primary" />}
                            </div>
                        </div>
                    </div>

                    {storefront.bio && (
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{storefront.bio}</p>
                    )}

                    {/* Stats row */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-muted p-3 text-center">
                            <p className="text-xl font-black text-foreground">{storefront.product_count}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">Products</p>
                        </div>
                        <div className="rounded-2xl bg-muted p-3 text-center">
                            <p className="text-xl font-black text-foreground">{storefront.total_sales}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">Sales</p>
                        </div>
                        <div className="rounded-2xl bg-muted p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <p className="text-xl font-black text-foreground">{storefront.rating.toFixed(1)}</p>
                            </div>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">Rating</p>
                        </div>
                    </div>

                    {/* Contact */}
                    {storefront.phone && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <a href={`tel:${storefront.phone}`}
                                className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70">
                                <Phone className="h-3.5 w-3.5" /> {storefront.phone}
                            </a>
                        </div>
                    )}
                </div>

                {/* Products grid */}
                <section>
                    <h2 className="mb-3 font-display font-bold text-foreground">Products ({storefront.products.length})</h2>
                    {storefront.products.length === 0 ? (
                        <div className="rounded-3xl border border-border bg-card py-12 text-center">
                            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">No products listed yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {storefront.products.map((p) => (
                                <Link key={p.id} href={`/app/market/${p.id}`}
                                    className="overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md">
                                    <div className="relative aspect-square bg-muted">
                                        {p.cover_image ? (
                                            <Image src={p.cover_image} alt={p.title} fill className="object-cover" sizes="200px" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Package className="h-8 w-8 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <p className="line-clamp-2 text-xs font-bold text-foreground">{p.title}</p>
                                        <p className="mt-1 text-sm font-black text-foreground">{fmt(p.price)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
