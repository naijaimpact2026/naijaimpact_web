'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import
    {
        Users, MapPin, Star, CheckCircle2, Plus, Search,
        Scissors, Zap, Wrench, UtensilsCrossed, Camera, Hammer,
        HeartPulse, Palette, Tv, Package, LayoutGrid, Settings,
        Building2, Car, Cpu, BookOpen, Truck, ChevronRight, BadgeCheck,
    } from 'lucide-react'
import ArtisanProfileModal from './ArtisanProfileModal'

interface ArtisanItem
{
    id: string
    title: string
    description?: string
    price?: number
    state?: string | null
    city?: string | null
    rating?: number
    review_count?: number
    seller_id?: string
    seller_business_name?: string | null
    seller_is_verified?: boolean
    seller_bio?: string | null
    seller_logo_url?: string | null
    cover_image_url?: string | null
    image_urls?: string[]
    category_name?: string | null
    tags?: string[]
    user_id?: string
    [key: string]: any
}

interface ArtisanGroup
{
    artisanKey: string
    displayName: string
    avatarUrl: string | null
    isVerified: boolean
    bio: string | null
    location: string | null
    userId: string | null
    avgRating: number
    totalReviews: number
    services: ArtisanItem[]
    minPrice: number | null
    categoryNames: string[]
}

interface Props
{
    initialArtisans: ArtisanItem[]
    initialNextCursor: string | null
    currentUserId: string
    myArtisanProfile: { id: string; category: string; profession_title: string; available: boolean } | null
}

type CatStyle = { bg: string; iconColor: string; Icon: any }

function getCatStyle(keyword: string): CatStyle
{
    switch (keyword)
    {
        case 'fashion': return { bg: '#fce7f3', iconColor: '#db2777', Icon: Scissors }
        case 'electric': return { bg: '#fef9c3', iconColor: '#ca8a04', Icon: Zap }
        case 'plumb': return { bg: '#dbeafe', iconColor: '#1d4ed8', Icon: Wrench }
        case 'cater': return { bg: '#fef3c7', iconColor: '#b45309', Icon: UtensilsCrossed }
        case 'photo': return { bg: '#fffbeb', iconColor: '#92400e', Icon: Camera }
        case 'design': return { bg: '#fae8ff', iconColor: '#a21caf', Icon: Palette }
        case 'beauty': return { bg: '#fce7f3', iconColor: '#be185d', Icon: Settings }
        case 'clean': return { bg: '#e0f2fe', iconColor: '#0284c7', Icon: Settings }
        case 'event': return { bg: '#ede9fe', iconColor: '#7c3aed', Icon: Tv }
        case 'construct': return { bg: '#fef3c7', iconColor: '#d97706', Icon: Building2 }
        case 'mechanic': return { bg: '#dbeafe', iconColor: '#2563eb', Icon: Car }
        case 'carpent': return { bg: '#ffedd5', iconColor: '#ea580c', Icon: Hammer }
        case 'solar': return { bg: '#d1fae5', iconColor: '#059669', Icon: Zap }
        case 'health': return { bg: '#fee2e2', iconColor: '#dc2626', Icon: HeartPulse }
        case 'tech': return { bg: '#dbeafe', iconColor: '#1e40af', Icon: Cpu }
        case 'mover': return { bg: '#e0f2fe', iconColor: '#0369a1', Icon: Truck }
        case 'tutor': return { bg: '#fffbeb', iconColor: '#b45309', Icon: BookOpen }
        default: return { bg: '#f3f4f6', iconColor: '#6b7280', Icon: Package }
    }
}

const ARTISAN_CATS = [
    { label: 'All', value: '' },
    { label: 'Fashion & Tailor', value: 'fashion' },
    { label: 'Electrical', value: 'electric' },
    { label: 'Plumbing', value: 'plumb' },
    { label: 'Catering', value: 'cater' },
    { label: 'Photography', value: 'photo' },
    { label: 'Graphic Design', value: 'design' },
    { label: 'Beauty & Hair', value: 'beauty' },
    { label: 'Cleaning', value: 'clean' },
    { label: 'Events & DJ', value: 'event' },
    { label: 'Construction', value: 'construct' },
    { label: 'Mechanics', value: 'mechanic' },
    { label: 'Carpentry', value: 'carpent' },
    { label: 'Solar & AC', value: 'solar' },
    { label: 'Healthcare', value: 'health' },
    { label: 'Tech & IT', value: 'tech' },
    { label: 'Movers', value: 'mover' },
    { label: 'Tutoring', value: 'tutor' },
]

function fmt(n: number)
{
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
    return `₦${n.toLocaleString('en-NG')}`
}

function groupByArtisan(items: ArtisanItem[]): ArtisanGroup[]
{
    const map = new Map<string, ArtisanGroup>()
    items.forEach(item =>
    {
        const key = item.seller_id ?? item.user_id ?? item.id
        const existing = map.get(key)
        const displayName = item.seller_business_name ?? 'Artisan'
        const avatarUrl = item.seller_logo_url ?? item.cover_image_url ?? null
        const location = [item.city, item.state].filter(Boolean).join(', ') || null
        const price = item.price ?? 0
        const rating = item.rating ?? 0
        const reviews = item.review_count ?? 0
        const catName = item.category_name

        if (existing)
        {
            existing.services.push(item)
            if (price > 0 && (existing.minPrice === null || price < existing.minPrice)) existing.minPrice = price
            if (catName && !existing.categoryNames.includes(catName)) existing.categoryNames.push(catName)
        } else
        {
            map.set(key, {
                artisanKey: key,
                displayName,
                avatarUrl,
                isVerified: item.seller_is_verified ?? false,
                bio: item.seller_bio ?? item.description ?? null,
                location,
                userId: item.user_id ?? null,
                avgRating: rating,
                totalReviews: reviews,
                services: [item],
                minPrice: price > 0 ? price : null,
                categoryNames: catName ? [catName] : [],
            })
        }
    })
    return Array.from(map.values())
}

// ─── Artisan grid card — clicking goes to /artisans/[artisanKey] ──────────────
function ArtisanCard({ group }: { group: ArtisanGroup })
{
    // Show top 3 service images as a mini collage
    const previewImgs = group.services
        .slice(0, 3)
        .map(s => s.image_urls?.[0] ?? s.cover_image_url ?? null)
        .filter(Boolean) as string[]

    return (
        <Link href={`/app/market/artisans/profile/${group.artisanKey}`}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:border-green-300 hover:shadow-lg transition-all group cursor-pointer">

            {/* Image collage top */}
            <div className="relative h-28 overflow-hidden bg-gradient-to-br from-green-50 to-green-100">
                {previewImgs.length >= 3 ? (
                    <div className="absolute inset-0 grid grid-cols-3 gap-0.5">
                        {previewImgs.map((img, i) => (
                            <div key={i} className="relative overflow-hidden">
                                <Image src={img} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="100px" />
                            </div>
                        ))}
                    </div>
                ) : previewImgs.length > 0 ? (
                    <Image src={previewImgs[0]} alt="" fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="300px" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' }}>
                        <span className="text-5xl font-black text-green-600">
                            {group.displayName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
                {/* Service count badge */}
                <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {group.services.length} service{group.services.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Avatar + info */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0 bg-green-50">
                    {group.avatarUrl ? (
                        <Image src={group.avatarUrl} alt={group.displayName} width={44} height={44}
                            className="object-cover w-full h-full" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-green-700 font-black text-lg"
                            style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' }}>
                            {group.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="font-black text-gray-900 truncate text-sm">{group.displayName}</p>
                        {group.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    </div>
                    {group.location && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-0.5 truncate">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />{group.location}
                        </p>
                    )}
                    {group.totalReviews > 0 && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] font-bold text-gray-700">{group.avgRating.toFixed(1)}</span>
                            <span className="text-[10px] text-gray-400">({group.totalReviews})</span>
                        </div>
                    )}
                </div>
                {group.minPrice != null && (
                    <div className="shrink-0 text-right">
                        <p className="text-[10px] text-gray-400">From</p>
                        <p className="text-sm font-black text-green-700">{fmt(group.minPrice)}</p>
                    </div>
                )}
            </div>

            {/* Category tags */}
            {group.categoryNames.length > 0 && (
                <div className="flex flex-wrap gap-1 px-4 pb-4">
                    {group.categoryNames.slice(0, 3).map(cat => (
                        <span key={cat} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                            {cat}
                        </span>
                    ))}
                    {group.categoryNames.length > 3 && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            +{group.categoryNames.length - 3}
                        </span>
                    )}
                </div>
            )}
        </Link>
    )
}

export default function ArtisanMarketClient({ initialArtisans, initialNextCursor, currentUserId, myArtisanProfile }: Props)
{
    const [artisans] = useState(initialArtisans)
    const [activeCat, setActiveCat] = useState('')
    const [search, setSearch] = useState('')
    const [profileModalOpen, setProfileModalOpen] = useState(false)

    const groups = useMemo(() =>
    {
        const filtered = artisans.filter(a =>
        {
            if (activeCat)
            {
                const hay = [a.title ?? '', a.category_name ?? '', a.description ?? '', ...(a.tags ?? [])].join(' ').toLowerCase()
                if (!hay.includes(activeCat)) return false
            }
            if (search)
            {
                const hay = [a.title ?? '', a.seller_business_name ?? '', a.category_name ?? ''].join(' ').toLowerCase()
                if (!hay.includes(search.toLowerCase())) return false
            }
            return true
        })
        return groupByArtisan(filtered)
    }, [artisans, activeCat, search])

    return (
        <div className="min-h-screen bg-[#f5f6fa]">
            {/* Hero */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.18),transparent 70%)' }} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="relative z-10 px-5 pt-7 pb-8 max-w-6xl mx-auto">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">NaijaMarket</p>
                    <h1 className="text-3xl font-black text-white">Artisan Marketplace</h1>
                    <p className="text-sm text-green-300/60 mt-1">Find verified skilled professionals near you</p>
                    <button onClick={() => setProfileModalOpen(true)}
                        className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-green-900 bg-white hover:bg-green-50 transition-all shadow-lg">
                        <Plus className="w-4 h-4" />
                        {myArtisanProfile ? 'Update My Service' : 'List My Services'}
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 z-10 shadow-sm">
                <div className="relative max-w-6xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text"
                        placeholder="Search artisans — tailor, electrician, photographer…"
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-4 space-y-5">
                {/* Category icon grid */}
                <section className="bg-[#111e14] rounded-3xl p-4 shadow-sm">
                    <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Browse by Skill</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-2.5">
                        <button onClick={() => setActiveCat('')}
                            className={`flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl border-2 transition-all ${activeCat === '' ? 'border-green-500 shadow-md' : 'border-transparent hover:border-green-700/40'}`}
                            style={activeCat === '' ? { background: 'linear-gradient(135deg,#1a5c38,#065f46)' } : { background: '#1e2e20' }}>
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${activeCat === '' ? 'bg-white/20' : 'bg-white/10'}`}>
                                <LayoutGrid className={`w-5 h-5 ${activeCat === '' ? 'text-white' : 'text-green-300'}`} strokeWidth={2} />
                            </div>
                            <span className={`text-[9px] font-bold text-center ${activeCat === '' ? 'text-white' : 'text-gray-300'}`}>All</span>
                        </button>
                        {ARTISAN_CATS.slice(1).map(cat =>
                        {
                            const style = getCatStyle(cat.value)
                            const Icon = style.Icon
                            const isActive = activeCat === cat.value
                            return (
                                <button key={cat.value} onClick={() => setActiveCat(isActive ? '' : cat.value)}
                                    className={`flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl border-2 transition-all ${isActive ? 'border-green-500 shadow-md' : 'border-transparent hover:border-green-700/40'}`}
                                    style={isActive ? { background: 'linear-gradient(135deg,#1a5c38,#065f46)' } : { background: '#1e2e20' }}>
                                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                        style={isActive ? { background: 'rgba(255,255,255,0.2)' } : { background: style.bg + '22' }}>
                                        <Icon className="w-5 h-5" style={{ color: isActive ? '#fff' : style.iconColor }} strokeWidth={2} />
                                    </div>
                                    <span className="text-[9px] font-semibold text-center leading-tight line-clamp-2 w-full px-0.5"
                                        style={{ color: isActive ? '#fff' : '#d1d5db' }}>{cat.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* Results heading */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-black text-gray-900 text-base">
                            {activeCat ? (ARTISAN_CATS.find(c => c.value === activeCat)?.label ?? 'Artisans') : 'All Artisans'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {groups.length} artisan{groups.length !== 1 ? 's' : ''} · {groups.reduce((s, g) => s + g.services.length, 0)} services
                        </p>
                    </div>
                </div>

                {/* Artisan GRID — 2 columns */}
                {groups.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="font-bold text-gray-700 text-lg">No artisans found</p>
                        <p className="text-sm text-gray-400 mt-1 mb-5">
                            {activeCat ? `No one listed under "${ARTISAN_CATS.find(c => c.value === activeCat)?.label}" yet` : 'Be the first to list your skills!'}
                        </p>
                        <button onClick={() => setProfileModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            <Plus className="w-4 h-4" /> List My Services
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {groups.map(group => <ArtisanCard key={group.artisanKey} group={group} />)}
                    </div>
                )}

                <div className="h-6" />
            </div>

            <ArtisanProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} existing={myArtisanProfile} />
        </div>
    )
}
