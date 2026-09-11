'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import
    {
        Plus, Store, Package, ShoppingCart, Users, Search, Filter,
        ChevronRight, MapPin, LayoutGrid, Leaf, Smartphone, Car,
        Building2, Wrench, HeartPulse, BookOpen, Briefcase, Zap,
        Shirt, DollarSign, UtensilsCrossed, Armchair, Home, Truck,
        Baby, Tv, ShoppingBag, Globe, Hammer, Scissors, Camera,
        Cpu, Settings, Wheat, Star,
    } from 'lucide-react'
import { fetchListings } from '@/lib/actions/marketplace'
import type { NmListingDetail, ServiceCategory } from '@/lib/types'

interface Props
{
    initialListings: NmListingDetail[]
    initialNextCursor: string | null
    categories: ServiceCategory[]
    userId: string
    displayName: string
}

// ─── Icon + color map — each keyword gets its own colour pair ─────────────────
// { bg: icon background, icon: icon color, text: label color }
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
    // Default
    return { bg: '#f3f4f6', icon: '#6b7280', Icon: ShoppingBag }
}

// ─── Format naira ─────────────────────────────────────────────────────────────
function fmt(n: number)
{
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
    return `₦${n.toLocaleString('en-NG')}`
}

// ─── Listing card ─────────────────────────────────────────────────────────────
function ListingCard({ listing }: { listing: NmListingDetail })
{
    const coverImg = listing.cover_image_url ?? listing.image_urls?.[0] ?? null

    const conditionColors: Record<string, string> = {
        new: 'bg-emerald-500 text-white',
        fairly_used: 'bg-amber-400 text-white',
        used: 'bg-gray-400 text-white',
    }

    return (
        <Link href={`/app/market/${listing.id}`}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-green-300 hover:shadow-lg transition-all group cursor-pointer">
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {coverImg ? (
                    <Image src={coverImg} alt={listing.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <Package className="w-10 h-10 text-gray-200" />
                    </div>
                )}
                {/* Condition badge */}
                {listing.condition && (
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${conditionColors[listing.condition] ?? 'bg-gray-400 text-white'}`}>
                        {listing.condition === 'fairly_used' ? 'Fairly Used' : listing.condition === 'new' ? 'New' : 'Used'}
                    </span>
                )}
                {/* Verified seller badge */}
                {listing.seller_is_verified && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </span>
                )}
                {/* Featured ribbon */}
                {listing.is_featured && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-400/90 to-transparent py-1.5 px-3">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-900">
                            <Star className="h-3 w-3 fill-yellow-900" /> Featured
                        </span>
                    </div>
                )}
            </div>
            <div className="p-3">
                <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug mb-1">{listing.title}</p>
                <p className="text-base font-black text-gray-900">{fmt(listing.price)}</p>
                {listing.negotiable && (
                    <p className="text-[10px] text-green-600 font-semibold mt-0.5">Negotiable</p>
                )}
                {(listing.city || listing.state) && (
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-0.5 truncate">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{[listing.city, listing.state].filter(Boolean).join(', ')}</span>
                    </p>
                )}
            </div>
        </Link>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MarketHomeClient({
    initialListings,
    initialNextCursor,
    categories,
    userId,
    displayName,
}: Props)
{
    const [listings, setListings] = useState(initialListings)
    const [nextCursor, setNextCursor] = useState(initialNextCursor)
    const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)

    const handleCategoryClick = useCallback(async (cat: ServiceCategory | null) =>
    {
        setActiveCategory(cat)
        setSearchQuery('')
        setLoading(true)
        try
        {
            const filters = cat ? { category_id: cat.id } : {}
            const { listings: fresh, nextCursor: nc } = await fetchListings(filters, 24)
            setListings(fresh)
            setNextCursor(nc)
        } catch (e)
        {
            console.error(e)
        } finally
        {
            setLoading(false)
        }
    }, [])

    const filtered = searchQuery
        ? listings.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : listings

    return (
        <div className="min-h-screen bg-[#f5f6fa]">

            {/* ══ HERO ══════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle,#4ade80,transparent 70%)' }} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative z-10 px-4 pt-5 pb-6 max-w-6xl mx-auto">
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <div>
                            <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">HubNovo</p>
                            <h1 className="text-2xl font-black text-white leading-tight">NaijaMarket</h1>
                            <p className="text-xs text-green-300/60 mt-0.5">Buy · Sell · Get Paid · Grow</p>
                        </div>
                        <Link href="/app/market/create"
                            className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-black text-green-900 bg-white hover:bg-green-50 transition-all active:scale-95 shadow-xl">
                            <Plus className="w-4 h-4" /> List Item
                        </Link>
                    </div>

                    {/* 4-col quick-nav tiles */}
                    <div className="grid grid-cols-4 gap-2.5">
                        {[
                            { icon: Package, label: 'Browse', href: '/app/market', color: '#86efac' },
                            { icon: Users, label: 'Artisans', href: '/app/market/artisans', color: '#fde68a' },
                            { icon: Store, label: 'Stores', href: '/app/market/stores', color: '#a5f3fc' },
                            { icon: ShoppingCart, label: 'My Orders', href: '/app/market/orders', color: '#fca5a5' },
                        ].map(({ icon: Icon, label, href, color }) => (
                            <Link key={href} href={href}
                                className="flex flex-col items-center gap-2 py-4 px-1 rounded-2xl border border-white/20 hover:bg-white/10 transition-all group"
                                style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                                    style={{ background: `${color}22` }}>
                                    <Icon className="w-5 h-5" style={{ color }} strokeWidth={2} />
                                </div>
                                <span className="text-white text-[11px] font-semibold text-center">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ SEARCH ════════════════════════════════════════════════ */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 z-10 shadow-sm">
                <div className="flex gap-2 max-w-6xl mx-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search NaijaMarket…"
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition-colors shrink-0">
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                </div>
            </div>

            {/* ══ CONTENT ═══════════════════════════════════════════════ */}
            <div className="max-w-6xl mx-auto px-4 py-4 space-y-5">

                {/* ── Category grid — colourful tiles ── */}
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Browse by Category</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5">

                        {/* All tile */}
                        <button
                            onClick={() => handleCategoryClick(null)}
                            className={`flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl border-2 transition-all ${!activeCategory
                                ? 'border-green-600 shadow-md shadow-green-100'
                                : 'border-transparent hover:border-green-200 hover:shadow-sm'
                                }`}
                            style={!activeCategory ? { background: 'linear-gradient(135deg,#1a5c38,#065f46)' } : { background: '#f8fafc' }}>
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${!activeCategory ? 'bg-white/20' : 'bg-green-100'}`}>
                                <LayoutGrid className={`w-5 h-5 ${!activeCategory ? 'text-white' : 'text-green-700'}`} strokeWidth={2} />
                            </div>
                            <span className={`text-[10px] font-bold text-center ${!activeCategory ? 'text-white' : 'text-gray-700'}`}>
                                All
                            </span>
                        </button>

                        {/* Dynamic categories with vibrant per-category colours */}
                        {categories.map(cat =>
                        {
                            const style = getCategoryStyle(cat.name)
                            const Icon = style.Icon
                            const isActive = activeCategory?.id === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl border-2 transition-all ${isActive
                                        ? 'border-green-600 shadow-md shadow-green-100'
                                        : 'border-transparent hover:border-gray-200 hover:shadow-sm'
                                        }`}
                                    style={isActive
                                        ? { background: 'linear-gradient(135deg,#1a5c38,#065f46)' }
                                        : { background: '#f8fafc' }}>
                                    <div
                                        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                                        style={isActive ? { background: 'rgba(255,255,255,0.2)' } : { background: style.bg }}>
                                        <Icon
                                            className="w-5 h-5"
                                            style={{ color: isActive ? '#fff' : style.icon }}
                                            strokeWidth={2}
                                        />
                                    </div>
                                    <span
                                        className="text-[9px] font-semibold text-center leading-tight line-clamp-2 w-full px-0.5"
                                        style={{ color: isActive ? '#fff' : '#374151' }}>
                                        {cat.name}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* ── Listings ── */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="font-black text-gray-900 text-base">
                                {activeCategory ? activeCategory.name : 'All Listings'}
                            </h2>
                            {!loading && (
                                <p className="text-xs text-gray-500 mt-0.5">{filtered.length} listing{filtered.length !== 1 ? 's' : ''}</p>
                            )}
                        </div>
                        {!loading && filtered.length > 0 && nextCursor && (
                            <button className="text-xs font-bold text-green-700 flex items-center gap-0.5 hover:text-green-800">
                                Load more <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {loading ? (
                        /* Skeleton grid */
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                                    <div className="aspect-square bg-gray-100" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded-full w-5/6" />
                                        <div className="h-3 bg-gray-100 rounded-full w-3/6" />
                                        <div className="h-4 bg-gray-100 rounded-full w-2/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                                <Package className="w-8 h-8 text-gray-200" />
                            </div>
                            <p className="font-bold text-gray-700 text-lg">No listings found</p>
                            <p className="text-sm text-gray-400 mt-1 mb-5">
                                {activeCategory ? `Nothing in "${activeCategory.name}" yet` : 'Be the first to list something!'}
                            </p>
                            <Link href="/app/market/create"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 shadow-lg"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                <Plus className="w-4 h-4" /> Create Listing
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {filtered.map(listing => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    )}
                </section>

                <div className="h-6" />
            </div>
        </div>
    )
}
