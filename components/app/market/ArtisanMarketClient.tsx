'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import
    {
        Users, MapPin, Star, Plus, Search,
        Scissors, Zap, Wrench, UtensilsCrossed, Camera, Hammer,
        HeartPulse, Palette, Tv, Package, LayoutGrid, Settings,
        Building2, Car, Cpu, BookOpen, Truck, BadgeCheck,
    } from 'lucide-react'
import ArtisanProfileModal from './ArtisanProfileModal'
import type { ServiceCategory } from '@/lib/types'

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

interface ExistingArtisanProfile
{
    id: string
    title: string
    description?: string | null
    category_id?: string | null
    price?: number | null
    state?: string | null
    city?: string | null
    tags?: string[] | null
    is_active?: boolean
    image_urls?: string[]
}

interface Props
{
    initialArtisans: ArtisanItem[]
    initialNextCursor: string | null
    currentUserId: string
    categories: ServiceCategory[]
    myArtisanProfile: ExistingArtisanProfile | null
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
            className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-lg">

            {/* Image collage top */}
            <div className="relative h-28 overflow-hidden bg-primary/5">
                {previewImgs.length >= 3 ? (
                    <div className="absolute inset-0 grid grid-cols-3 gap-0.5">
                        {previewImgs.map((img, i) => (
                            <div key={i} className="relative overflow-hidden">
                                <Image src={img} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="100px" />
                            </div>
                        ))}
                    </div>
                ) : previewImgs.length > 0 ? (
                    <Image src={previewImgs[0]} alt="" fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="300px" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                        <span className="text-5xl font-black text-primary">
                            {group.displayName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
                {/* Service count badge */}
                <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    {group.services.length} service{group.services.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Avatar + info */}
            <div className="flex items-center gap-3 px-4 pb-3 pt-4">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border-2 border-card bg-primary/10 shadow-md">
                    {group.avatarUrl ? (
                        <Image src={group.avatarUrl} alt={group.displayName} width={44} height={44}
                            className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 text-lg font-black text-primary">
                            {group.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-black text-foreground">{group.displayName}</p>
                        {group.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    </div>
                    {group.location && (
                        <p className="flex items-center gap-0.5 truncate text-[10px] text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />{group.location}
                        </p>
                    )}
                    {group.totalReviews > 0 && (
                        <div className="mt-0.5 flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-[10px] font-bold text-foreground">{group.avgRating.toFixed(1)}</span>
                            <span className="text-[10px] text-muted-foreground">({group.totalReviews})</span>
                        </div>
                    )}
                </div>
                {group.minPrice != null && (
                    <div className="shrink-0 text-right">
                        <p className="text-[10px] text-muted-foreground">From</p>
                        <p className="text-sm font-black text-primary">{fmt(group.minPrice)}</p>
                    </div>
                )}
            </div>

            {/* Category tags */}
            {group.categoryNames.length > 0 && (
                <div className="flex flex-wrap gap-1 px-4 pb-4">
                    {group.categoryNames.slice(0, 3).map(cat => (
                        <span key={cat} className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                            {cat}
                        </span>
                    ))}
                    {group.categoryNames.length > 3 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                            +{group.categoryNames.length - 3}
                        </span>
                    )}
                </div>
            )}
        </Link>
    )
}

export default function ArtisanMarketClient({ initialArtisans, initialNextCursor, currentUserId, categories, myArtisanProfile }: Props)
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
        <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl"
                style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}>
                <div className="px-6 py-8 sm:px-10 sm:py-10">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-200">Hubnovo Marketplace</p>
                    <h1 className="font-display text-3xl font-black text-white">Artisan Marketplace</h1>
                    <p className="mt-1 text-sm text-white/70">Find verified skilled professionals near you</p>
                    <button onClick={() => setProfileModalOpen(true)}
                        className="mt-5 flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-secondary shadow-lg transition-colors hover:bg-white/90">
                        <Plus className="h-4 w-4" />
                        {myArtisanProfile ? 'Update My Service' : 'List My Services'}
                    </button>
                </div>
            </section>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text"
                    placeholder="Search artisans: tailor, electrician, photographer"
                    className="w-full rounded-2xl border border-border bg-card py-2.5 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Category icon grid */}
            <section className="rounded-2xl border border-border bg-card p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Browse by Skill</p>
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:grid-cols-9">
                    <button onClick={() => setActiveCat('')}
                        className={`flex flex-col items-center gap-2 rounded-2xl py-3.5 transition-all ${activeCat === '' ? 'bg-primary' : 'bg-muted hover:bg-muted/70'}`}>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${activeCat === '' ? 'bg-white/20' : 'bg-primary/10'}`}>
                            <LayoutGrid className={`h-4 w-4 ${activeCat === '' ? 'text-white' : 'text-primary'}`} strokeWidth={2} />
                        </div>
                        <span className={`text-center text-[9px] font-bold ${activeCat === '' ? 'text-white' : 'text-foreground'}`}>All</span>
                    </button>
                    {ARTISAN_CATS.slice(1).map(cat =>
                    {
                        const style = getCatStyle(cat.value)
                        const Icon = style.Icon
                        const isActive = activeCat === cat.value
                        return (
                            <button key={cat.value} onClick={() => setActiveCat(isActive ? '' : cat.value)}
                                className={`flex flex-col items-center gap-2 rounded-2xl py-3.5 transition-all ${isActive ? 'bg-primary' : 'bg-muted hover:bg-muted/70'}`}>
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                                    style={{ background: isActive ? 'rgba(255,255,255,0.2)' : style.bg }}>
                                    <Icon className="h-4 w-4" style={{ color: isActive ? '#fff' : style.iconColor }} strokeWidth={2} />
                                </div>
                                <span className={`line-clamp-2 w-full px-0.5 text-center text-[9px] font-semibold leading-tight ${isActive ? 'text-white' : 'text-foreground'}`}>
                                    {cat.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </section>

            {/* Results heading */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-base font-black text-foreground">
                        {activeCat ? (ARTISAN_CATS.find(c => c.value === activeCat)?.label ?? 'Artisans') : 'All Artisans'}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {groups.length} artisan{groups.length !== 1 ? 's' : ''} · {groups.reduce((s, g) => s + g.services.length, 0)} services
                    </p>
                </div>
            </div>

            {/* Artisan grid */}
            {groups.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
                        <Users className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-bold text-foreground">No artisans found</p>
                    <p className="mb-5 mt-1 text-sm text-muted-foreground">
                        {activeCat ? `No one listed under "${ARTISAN_CATS.find(c => c.value === activeCat)?.label}" yet` : 'Be the first to list your skills!'}
                    </p>
                    <button onClick={() => setProfileModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg transition-colors hover:bg-primary/90">
                        <Plus className="h-4 w-4" /> List My Services
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {groups.map(group => <ArtisanCard key={group.artisanKey} group={group} />)}
                </div>
            )}

            <ArtisanProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} categories={categories} existing={myArtisanProfile} />
        </div>
    )
}
