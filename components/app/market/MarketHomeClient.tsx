'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import
    {
        Plus, Store, Package, ShoppingCart, Users, Search,
        ChevronRight, LayoutGrid, Leaf, Smartphone, Car,
        Building2, Wrench, HeartPulse, BookOpen, Briefcase, Zap,
        Shirt, DollarSign, UtensilsCrossed, Armchair, Home, Truck,
        Baby, Tv, ShoppingBag, Globe, Hammer, Scissors, Camera,
        Cpu, Settings, Heart, ArrowRight,
    } from 'lucide-react'
import { fetchListings } from '@/lib/actions/marketplace'
import CartPanel from './CartPanel'
import TopStoresRail from './TopStoresRail'
import ListingCard from './ListingCard'
import MarketHeroIllustration from '@/components/illustrations/MarketHeroIllustration'
import type { NmListingDetail, NmTopSeller, ServiceCategory } from '@/lib/types'

interface Props
{
    initialListings: NmListingDetail[]
    initialNextCursor: string | null
    categories: ServiceCategory[]
    topSellers: NmTopSeller[]
    userId: string
    userEmail: string
    displayName: string
}

// ─── Icon + color map — each category keyword gets its own colour pair ───────
type IconStyle = { bg: string; icon: string; Icon: any }

function getCategoryStyle(name: string): IconStyle
{
    const n = name.toLowerCase()
    if (n.includes('agri') || n.includes('farm'))
        return { bg: '#d1fae5', icon: '#059669', Icon: Leaf }
    if (n.includes('auto') || n.includes('spare') || n.includes('vehicle'))
        return { bg: '#dbeafe', icon: '#2563eb', Icon: Car }
    if (n.includes('beauty') || n.includes('personal care') || n.includes('hair') || n.includes('makeup'))
        return { bg: '#fce7f3', icon: '#db2777', Icon: Scissors }
    if (n.includes('clean') || n.includes('laundry'))
        return { bg: '#e0f2fe', icon: '#0284c7', Icon: Settings }
    if (n.includes('construct') || n.includes('building'))
        return { bg: '#fef3c7', icon: '#d97706', Icon: Building2 }
    if (n.includes('cooper') || n.includes('group buying'))
        return { bg: '#ede9fe', icon: '#7c3aed', Icon: Users }
    if (n.includes('diaspora') || n.includes('import'))
        return { bg: '#f0fdf4', icon: '#16a34a', Icon: Globe }
    if (n.includes('educat') || n.includes('learning'))
        return { bg: '#fffbeb', icon: '#b45309', Icon: BookOpen }
    if (n.includes('electron') || n.includes('gadget'))
        return { bg: '#dbeafe', icon: '#1d4ed8', Icon: Smartphone }
    if (n.includes('energy') || n.includes('power') || n.includes('solar'))
        return { bg: '#fef9c3', icon: '#ca8a04', Icon: Zap }
    if (n.includes('event') || n.includes('entertain'))
        return { bg: '#fae8ff', icon: '#a21caf', Icon: Tv }
    if (n.includes('fashion') || n.includes('apparel') || n.includes('cloth'))
        return { bg: '#fce7f3', icon: '#be185d', Icon: Shirt }
    if (n.includes('financ') || n.includes('insurance'))
        return { bg: '#d1fae5', icon: '#047857', Icon: DollarSign }
    if (n.includes('food') || n.includes('agro'))
        return { bg: '#fef3c7', icon: '#b45309', Icon: UtensilsCrossed }
    if (n.includes('furniture') || n.includes('interior'))
        return { bg: '#ffedd5', icon: '#ea580c', Icon: Armchair }
    if (n.includes('health') || n.includes('wellness') || n.includes('medical'))
        return { bg: '#fee2e2', icon: '#dc2626', Icon: HeartPulse }
    if (n.includes('home') || n.includes('living') || n.includes('appliance'))
        return { bg: '#e0f2fe', icon: '#0369a1', Icon: Home }
    if (n.includes('industrial') || n.includes('machin'))
        return { bg: '#f3f4f6', icon: '#4b5563', Icon: Hammer }
    if (n.includes('job') || n.includes('employ') || n.includes('recruit'))
        return { bg: '#ede9fe', icon: '#6d28d9', Icon: Briefcase }
    if (n.includes('kid') || n.includes('baby') || n.includes('toy'))
        return { bg: '#fce7f3', icon: '#db2777', Icon: Baby }
    if (n.includes('real estate') || n.includes('property') || n.includes('land'))
        return { bg: '#d1fae5', icon: '#065f46', Icon: Building2 }
    if (n.includes('service'))
        return { bg: '#ede9fe', icon: '#7c3aed', Icon: Wrench }
    if (n.includes('photo') || n.includes('camera'))
        return { bg: '#fef3c7', icon: '#92400e', Icon: Camera }
    if (n.includes('tech') || n.includes('software') || n.includes('it'))
        return { bg: '#dbeafe', icon: '#1e40af', Icon: Cpu }
    if (n.includes('truck') || n.includes('logistic') || n.includes('transport'))
        return { bg: '#e0f2fe', icon: '#0284c7', Icon: Truck }
    return { bg: '#f3f4f6', icon: '#6b7280', Icon: ShoppingBag }
}

// ─── Main component ────────────────────────────────────────────────────────
export default function MarketHomeClient({
    initialListings,
    initialNextCursor,
    categories,
    topSellers,
    userId,
    userEmail,
}: Props)
{
    const [listings, setListings] = useState(initialListings)
    const [nextCursor, setNextCursor] = useState(initialNextCursor)
    const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)

    const runQuery = useCallback(async (opts: { category?: ServiceCategory | null; search?: string }) =>
    {
        setLoading(true)
        try
        {
            const filters: { category_id?: string; search?: string } = {}
            if (opts.category) filters.category_id = opts.category.id
            if (opts.search) filters.search = opts.search

            const { listings: fresh, nextCursor: nc } = await fetchListings(filters, 24)
            setListings(fresh)
            setNextCursor(nc)
        }
        catch (e)
        {
            console.error(e)
            toast.error('Could not load listings')
        }
        finally
        {
            setLoading(false)
        }
    }, [])

    async function handleCategoryClick(cat: ServiceCategory | null)
    {
        setActiveCategory(cat)
        setSearchQuery('')
        setSearchInput('')
        await runQuery({ category: cat })
    }

    async function handleSearchSubmit(e: React.FormEvent)
    {
        e.preventDefault()
        setSearchQuery(searchInput)
        setActiveCategory(null)
        await runQuery({ search: searchInput })
    }

    async function handleLoadMore()
    {
        if (!nextCursor || loadingMore) return
        setLoadingMore(true)
        try
        {
            const filters: { category_id?: string; search?: string; cursor?: string } = { cursor: nextCursor }
            if (activeCategory) filters.category_id = activeCategory.id
            if (searchQuery) filters.search = searchQuery

            const { listings: more, nextCursor: nc } = await fetchListings(filters, 24)
            setListings((prev) => [...prev, ...more])
            setNextCursor(nc)
        }
        catch (e)
        {
            console.error(e)
        }
        finally
        {
            setLoadingMore(false)
        }
    }

    return (
        <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">

            {/* ══ HERO ══════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden rounded-3xl"
                style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}>
                <div className="relative z-10 grid grid-cols-1 items-center gap-6 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-200">Hubnovo Marketplace</p>
                        <h1 className="font-display text-3xl font-black leading-tight text-white sm:text-4xl">
                            Buy. Sell. Grow Together.
                        </h1>
                        <p className="mt-2 max-w-md text-sm text-white/70">
                            Discover quality products, support local businesses, and unlock new opportunities.
                        </p>

                        <form onSubmit={handleSearchSubmit} className="mt-5 flex max-w-lg gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search for products, brands or stores…"
                                    className="w-full rounded-2xl border-0 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none ring-0 focus:ring-2 focus:ring-cyan-300"
                                />
                            </div>
                            <button type="submit"
                                className="shrink-0 rounded-2xl bg-secondary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-secondary/90">
                                Search
                            </button>
                        </form>

                        <Link href="/app/market/create"
                            className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-secondary shadow-lg transition-transform active:scale-95 hover:bg-white/90">
                            <Plus className="h-4 w-4" /> List Item
                        </Link>
                    </div>

                    <MarketHeroIllustration className="hidden w-full max-w-sm justify-self-end sm:block" />
                </div>
            </section>

            {/* ══ QUICK NAV ═════════════════════════════════════════════ */}
            <div className="grid grid-cols-4 gap-2.5">
                {[
                    { icon: Heart, label: 'Saved', href: '/app/market/saved' },
                    { icon: Users, label: 'Artisans', href: '/app/market/artisans' },
                    { icon: Store, label: 'Stores', href: '/app/market/stores' },
                    { icon: ShoppingCart, label: 'My Orders', href: '/app/market/orders' },
                ].map(({ icon: Icon, label, href }) => (
                    <Link key={href} href={href}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                        </div>
                        <span className="text-[11px] font-semibold text-foreground">{label}</span>
                    </Link>
                ))}
            </div>

            {/* ══ CATEGORY STRIP ════════════════════════════════════════ */}
            <section className="rounded-2xl border border-border bg-card p-3">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        onClick={() => handleCategoryClick(null)}
                        className={`flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 transition-all ${!activeCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            }`}
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ background: !activeCategory ? 'rgba(255,255,255,0.2)' : '#eef2ff' }}>
                            <LayoutGrid className="h-4 w-4" style={{ color: !activeCategory ? '#fff' : '#4338ca' }} strokeWidth={2} />
                        </div>
                        <span className="text-center text-[9px] font-semibold leading-tight">All</span>
                    </button>

                    {categories.map((cat) =>
                    {
                        const style = getCategoryStyle(cat.name)
                        const Icon = style.Icon
                        const isActive = activeCategory?.id === cat.id
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat)}
                                className={`flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 transition-all ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                                    }`}
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                                    style={{ background: isActive ? 'rgba(255,255,255,0.2)' : style.bg }}>
                                    <Icon className="h-4 w-4" style={{ color: isActive ? '#fff' : style.icon }} strokeWidth={2} />
                                </div>
                                <span className={`line-clamp-2 text-center text-[9px] font-semibold leading-tight ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                                    {cat.name}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </section>

            {/* ══ CONTENT ═══════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] lg:items-start">

                {/* ── Listings ── */}
                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h2 className="font-display text-base font-black text-foreground">
                                {searchQuery ? `Results for "${searchQuery}"` : activeCategory ? activeCategory.name : 'Featured Products'}
                            </h2>
                            {!loading && (
                                <p className="mt-0.5 text-xs text-muted-foreground">{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                                    <div className="aspect-square animate-pulse bg-muted" />
                                    <div className="space-y-2 p-3">
                                        <div className="h-3 w-5/6 animate-pulse rounded-full bg-muted" />
                                        <div className="h-3 w-3/6 animate-pulse rounded-full bg-muted" />
                                        <div className="h-4 w-2/5 animate-pulse rounded-full bg-muted" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="rounded-3xl border border-border bg-card py-16 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
                                <Package className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                            <p className="text-lg font-bold text-foreground">No listings found</p>
                            <p className="mb-5 mt-1 text-sm text-muted-foreground">
                                {searchQuery ? `Nothing matched "${searchQuery}"` : activeCategory ? `Nothing in "${activeCategory.name}" yet` : 'Be the first to list something!'}
                            </p>
                            <Link href="/app/market/create"
                                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg transition-colors hover:bg-primary/90">
                                <Plus className="h-4 w-4" /> Create Listing
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {listings.map((listing) => (
                                    <ListingCard key={listing.id} listing={listing} />
                                ))}
                            </div>

                            {nextCursor && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
                                    >
                                        {loadingMore ? 'Loading…' : 'Load more'} <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* ── Right rail ── */}
                <aside className="space-y-4 lg:sticky lg:top-20">
                    <CartPanel userId={userId} userEmail={userEmail} />

                    {/* Great Deals CTA */}
                    <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-cyan-50 to-primary/5 p-4">
                        <p className="font-display text-sm font-black text-foreground">Great Deals Every Day</p>
                        <p className="mt-1 text-xs text-muted-foreground">Quality products. Better prices. Happier you.</p>
                        <Link href="/app/market"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                            Shop Deals <ArrowRight className="h-3 w-3" />
                        </Link>
                    </section>

                    <TopStoresRail sellers={topSellers} />

                    {/* Entrepreneurs CTA */}
                    <section className="overflow-hidden rounded-2xl bg-secondary p-4 text-white">
                        <p className="font-display text-sm font-black">Empowering Entrepreneurs</p>
                        <p className="mt-1 text-xs text-white/70">Join thousands of sellers growing their business on Hubnovo.</p>
                        <Link href="/app/market/create"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2 text-xs font-bold text-emerald-foreground transition-colors hover:opacity-90">
                            Start Selling <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </section>
                </aside>
            </div>
        </div>
    )
}
