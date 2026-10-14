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
        Scale, DollarSign, Calendar, Briefcase, Grid3X3, Contact2,
        CheckCircle2, ArrowRight
    } from 'lucide-react'
import ArtisanProfileModal from './ArtisanProfileModal'
import FeaturedArtisansCarousel from './FeaturedArtisansCarousel'
import ArtisanHeroCarousel from './ArtisanHeroCarousel'
import type { ServiceCategory } from '@/lib/types'

export interface ArtisanItem
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
    service_type?: string | null
    tags?: string[]
    user_id?: string
    [key: string]: any
}

export interface ArtisanGroup
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
        case 'beauty': return { bg: '#fce7f3', iconColor: '#be185d', Icon: Scissors }
        case 'clean': return { bg: '#e0f2fe', iconColor: '#0284c7', Icon: Settings }
        case 'event': return { bg: '#ede9fe', iconColor: '#7c3aed', Icon: Tv }
        case 'construct': return { bg: '#fef3c7', iconColor: '#d97706', Icon: Building2 }
        case 'mechanic': return { bg: '#dbeafe', iconColor: '#2563eb', Icon: Car }
        case 'carpent': return { bg: '#ffedd5', iconColor: '#ea580c', Icon: Hammer }
        case 'health': return { bg: '#fee2e2', iconColor: '#dc2626', Icon: HeartPulse }
        case 'tech': return { bg: '#dbeafe', iconColor: '#1e40af', Icon: Cpu }
        case 'mover': return { bg: '#e0f2fe', iconColor: '#0369a1', Icon: Truck }
        case 'tutor': return { bg: '#fffbeb', iconColor: '#b45309', Icon: BookOpen }
        case 'legal': return { bg: '#ede9fe', iconColor: '#6d28d9', Icon: Scale }
        case 'finance': return { bg: '#d1fae5', iconColor: '#047857', Icon: DollarSign }
        default: return { bg: '#f3f4f6', iconColor: '#6b7280', Icon: Package }
    }
}

interface SkillCategoryItem {
    label: string
    value: string
    type?: 'artisan' | 'professional'
}

const ARTISAN_SKILL_CATS: SkillCategoryItem[] = [
    { label: 'All Skills', value: '' },
    { label: 'Fashion & Tailor', value: 'fashion', type: 'artisan' },
    { label: 'Electrical & Power', value: 'electric', type: 'artisan' },
    { label: 'Plumbing', value: 'plumb', type: 'artisan' },
    { label: 'Tech & Software', value: 'tech', type: 'professional' },
    { label: 'Beauty & Hair', value: 'beauty', type: 'artisan' },
    { label: 'Healthcare & GP', value: 'health', type: 'professional' },
    { label: 'Catering & Food', value: 'cater', type: 'artisan' },
    { label: 'Mechanics & Auto', value: 'mechanic', type: 'artisan' },
    { label: 'Carpentry & Wood', value: 'carpent', type: 'artisan' },
    { label: 'Cleaning & Laundry', value: 'clean', type: 'artisan' },
    { label: 'Design & Branding', value: 'design', type: 'professional' },
    { label: 'Photography & Media', value: 'photo', type: 'professional' },
    { label: 'Events & DJ', value: 'event', type: 'artisan' },
    { label: 'Construction', value: 'construct', type: 'artisan' },
    { label: 'Legal & Compliance', value: 'legal', type: 'professional' },
    { label: 'Finance & Accounts', value: 'finance', type: 'professional' },
    { label: 'Tutoring & Teaching', value: 'tutor', type: 'professional' },
    { label: 'Movers & Logistics', value: 'mover', type: 'artisan' },
]

const SYNONYM_MAP: Record<string, string[]> = {
    fashion: ['fashion', 'tailor', 'cloth', 'clothes', 'dress', 'sewing', 'apparel'],
    electric: ['electric', 'electrician', 'wiring', 'power', 'solar', 'generator'],
    plumb: ['plumbing', 'plumber', 'pipe', 'leak', 'borehole', 'water'],
    cater: ['catering', 'caterer', 'food', 'cook', 'chef', 'baking'],
    photo: ['photography', 'photographer', 'photo', 'camera', 'video', 'videographer'],
    design: ['design', 'graphic', 'logo', 'ui', 'ux', 'branding'],
    beauty: ['beauty', 'hair', 'hairstylist', 'salon', 'makeup', 'barber', 'braids', 'skincare'],
    clean: ['cleaning', 'cleaner', 'laundry', 'wash', 'sanitation'],
    event: ['events', 'event', 'dj', 'mc', 'party', 'sound'],
    construct: ['construction', 'builder', 'mason', 'bricklayer', 'welder', 'tiler'],
    mechanic: ['mechanic', 'auto', 'automobile', 'car', 'vehicle', 'engine'],
    carpent: ['carpentry', 'carpenter', 'woodwork', 'furniture', 'cabinet'],
    health: ['health', 'gp', 'doctor', 'medical', 'nurse', 'wellness', 'clinic'],
    tech: ['tech', 'technology', 'software', 'developer', 'coding', 'programming', 'it', 'web', 'sofware'],
    mover: ['movers', 'moving', 'transport', 'logistics', 'haulage', 'delivery'],
    tutor: ['tutoring', 'tutor', 'teacher', 'education', 'lesson', 'class'],
    legal: ['legal', 'lawyer', 'law', 'compliance', 'notary', 'attorney'],
    finance: ['finance', 'accounting', 'accountant', 'bookkeeping', 'tax', 'audit'],
}

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
        const displayName = item.seller_business_name ?? item.title ?? 'Artisan Professional'
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

// ─── Individual Service Card (Services View) ─────────────────────────────────
function ServiceListingCard({ service }: { service: ArtisanItem })
{
    const img = service.cover_image_url ?? service.image_urls?.[0] ?? null
    const price = service.price ?? 0
    const rating = service.rating ?? 0
    const location = [service.city, service.state].filter(Boolean).join(', ')
    const providerName = service.seller_business_name ?? 'Verified Provider'
    const isProfessional = service.service_type === 'professional'

    return (
        <Link href={`/app/artisans/${service.id}`}
            className="group flex h-full flex-col cursor-pointer overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl">
            
            {/* Top image or gradient illustration — enlarged */}
            <div className="relative h-48 sm:h-52 w-full shrink-0 overflow-hidden bg-muted">
                {img ? (
                    <Image src={img} alt={service.title} fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-primary/20">
                        {isProfessional ? (
                            <Briefcase className="h-12 w-12 text-primary/40" />
                        ) : (
                            <Wrench className="h-12 w-12 text-primary/40" />
                        )}
                    </div>
                )}

                {/* Ambient dark gradient for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Service Type badge */}
                <span className="absolute left-3 top-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white shadow-sm">
                    {isProfessional ? 'Professional' : 'Artisan'}
                </span>

                {/* Price tag pill */}
                {price > 0 && (
                    <span className="absolute right-3 bottom-3 rounded-xl bg-card/95 backdrop-blur-md px-3 py-1 text-xs font-black text-foreground shadow-md border border-border/50">
                        From {fmt(price)}
                    </span>
                )}
            </div>

            {/* Info details */}
            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                <div>
                    {service.category_name && (
                        <p className="text-[11px] font-bold text-primary truncate mb-1">
                            {service.category_name}
                        </p>
                    )}
                    <h3 className="line-clamp-2 text-sm font-black leading-snug text-foreground group-hover:text-primary transition-colors">
                        {service.title}
                    </h3>

                    {/* Provider row */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="truncate font-semibold text-foreground/80">{providerName}</span>
                        {service.seller_is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    </div>

                    {/* Location & rating */}
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                        {location ? (
                            <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{location}</span>
                            </span>
                        ) : <span />}

                        {rating > 0 && (
                            <span className="flex items-center gap-1 shrink-0 text-[11px] font-bold text-foreground bg-amber-500/10 px-2 py-0.5 rounded-lg">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {rating.toFixed(1)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action CTA */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                        <Calendar className="h-3.5 w-3.5" /> Book / Inquire
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Link>
    )
}

// ─── Artisan Provider Card (Providers View) ───────────────────────────────────
function ArtisanCard({ group }: { group: ArtisanGroup })
{
    const previewImgs = group.services
        .slice(0, 3)
        .map(s => s.image_urls?.[0] ?? s.cover_image_url ?? null)
        .filter(Boolean) as string[]

    return (
        <Link href={`/app/artisans/profile/${group.artisanKey}`}
            className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-xl flex flex-col justify-between">

            <div>
                {/* Enlarged Prominent Collage preview */}
                <div className="relative h-48 sm:h-56 overflow-hidden bg-primary/5">
                    {previewImgs.length >= 3 ? (
                        <div className="absolute inset-0 grid grid-cols-3 gap-1">
                            {previewImgs.map((img, i) => (
                                <div key={i} className="relative overflow-hidden bg-muted">
                                    <Image src={img} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="150px" />
                                </div>
                            ))}
                        </div>
                    ) : previewImgs.length > 0 ? (
                        <Image src={previewImgs[0]} alt="" fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="400px" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                            <span className="text-6xl font-black text-primary/40">
                                {group.displayName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}

                    {/* Gradient shadow for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Service count badge */}
                    <span className="absolute right-3 top-3 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                        {group.services.length} service{group.services.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Avatar + info */}
                <div className="flex items-center gap-3 px-4 sm:px-5 pb-3 pt-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-card bg-primary/10 shadow-md">
                        {group.avatarUrl ? (
                            <Image src={group.avatarUrl} alt={group.displayName} width={56} height={56}
                                className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 text-xl font-black text-primary">
                                {group.displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <p className="truncate text-base font-black text-foreground group-hover:text-primary transition-colors">{group.displayName}</p>
                            {group.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                        </div>
                        {group.location && (
                            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <span className="truncate">{group.location}</span>
                            </p>
                        )}
                        {group.totalReviews > 0 && (
                            <div className="mt-1 flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-bold text-foreground">{group.avgRating.toFixed(1)}</span>
                                <span className="text-[10px] text-muted-foreground">({group.totalReviews})</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Starting price */}
                {group.minPrice != null && (
                    <div className="px-4 sm:px-5 pb-2">
                        <span className="text-[11px] text-muted-foreground">Starting from </span>
                        <span className="text-sm font-black text-primary">{fmt(group.minPrice)}</span>
                    </div>
                )}

                {/* Services preview tags */}
                {group.services.length > 0 && (
                    <div className="px-4 sm:px-5 pb-2">
                        <p className="text-xs font-medium text-muted-foreground line-clamp-1">
                            {group.services.map(s => s.title).join(' · ')}
                        </p>
                    </div>
                )}

                {/* Category tags */}
                {group.categoryNames.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-4 sm:px-5 pb-3">
                        {group.categoryNames.slice(0, 3).map(cat => (
                            <span key={cat} className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                {cat}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Action Link */}
            <div className="mt-2 flex items-center justify-between border-t border-border px-4 sm:px-5 py-3 bg-muted/20">
                <span className="flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                    View Profile & Portfolio
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-1" />
            </div>
        </Link>
    )
}

export default function ArtisanMarketClient({ initialArtisans, initialNextCursor, currentUserId, categories, myArtisanProfile }: Props)
{
    const [artisans] = useState(initialArtisans)
    const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | 'artisan' | 'professional'>('all')
    const [activeCat, setActiveCat] = useState('')
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState<'services' | 'artisans'>('services')
    const [profileModalOpen, setProfileModalOpen] = useState(false)

    // Filter service items
    const filteredServices = useMemo(() =>
    {
        return artisans.filter(item =>
        {
            // Filter by service type (Artisan vs Professional)
            if (serviceTypeFilter !== 'all')
            {
                if (item.service_type && item.service_type !== serviceTypeFilter) return false
            }

            // Filter by skill category
            if (activeCat)
            {
                const syns = SYNONYM_MAP[activeCat]
                if (syns && syns.length > 0)
                {
                    const pattern = new RegExp(`\\b(${syns.join('|')})\\b`, 'i')
                    const hay = [
                        item.title,
                        item.description,
                        item.category_name,
                        ...(item.tags || [])
                    ].filter(Boolean).join(' ')

                    if (!pattern.test(hay)) return false
                }
            }

            // Search filter
            if (search.trim())
            {
                const q = search.trim().toLowerCase()
                const hay = [
                    item.title,
                    item.description,
                    item.seller_business_name,
                    item.category_name,
                    item.city,
                    item.state,
                    ...(item.tags || [])
                ].filter(Boolean).join(' ').toLowerCase()

                if (!hay.includes(q)) return false
            }

            return true
        })
    }, [artisans, serviceTypeFilter, activeCat, search])

    // Group filtered services into artisans
    const groups = useMemo(() =>
    {
        return groupByArtisan(filteredServices)
    }, [filteredServices])

    return (
        <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            {/* ══ HERO BANNER SLIDER ════════════════════════════════════ */}
            <ArtisanHeroCarousel
                myArtisanProfile={myArtisanProfile}
                onOpenProfileModal={() => setProfileModalOpen(true)}
            />

            {/* ══ FEATURED ARTISANS CAROUSEL ═════════════════════════════ */}
            <FeaturedArtisansCarousel artisans={groups} currentUserId={currentUserId} />

            {/* ══ SERVICE TYPE TABS + SEARCH ═════════════════════════════ */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Filter tabs: All, Artisans, Professional Services */}
                    <div className="flex items-center rounded-2xl border border-border bg-card p-1.5">
                        <button
                            onClick={() => { setServiceTypeFilter('all'); setActiveCat('') }}
                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                                serviceTypeFilter === 'all'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            All Services ({artisans.length})
                        </button>
                        <button
                            onClick={() => { setServiceTypeFilter('artisan'); setActiveCat('') }}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                                serviceTypeFilter === 'artisan'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Wrench className="h-3.5 w-3.5" />
                            Artisans & Trades
                        </button>
                        <button
                            onClick={() => { setServiceTypeFilter('professional'); setActiveCat('') }}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                                serviceTypeFilter === 'professional'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Briefcase className="h-3.5 w-3.5" />
                            Professional Services
                        </button>
                    </div>

                    {/* View Switcher: Services Grid vs Artisans Providers */}
                    <div className="flex items-center self-end sm:self-auto rounded-2xl border border-border bg-card p-1 text-xs">
                        <button
                            onClick={() => setViewMode('services')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                                viewMode === 'services'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Grid3X3 className="h-3.5 w-3.5" /> Services ({filteredServices.length})
                        </button>
                        <button
                            onClick={() => setViewMode('artisans')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                                viewMode === 'artisans'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Contact2 className="h-3.5 w-3.5" /> Providers ({groups.length})
                        </button>
                    </div>
                </div>

                {/* Search input */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="text"
                        placeholder="Search services or skills: plumber, electrician, tailor, lawyer, software, doctor…"
                        className="w-full rounded-2xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* ══ SKILL CATEGORIES STRIP ═════════════════════════════════ */}
            <section className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Browse by Specialty</p>
                    {activeCat && (
                        <button onClick={() => setActiveCat('')} className="text-xs font-bold text-primary hover:underline">
                            Clear specialty
                        </button>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button onClick={() => setActiveCat('')}
                        className={`flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl py-3 transition-all ${activeCat === '' ? 'bg-primary' : 'bg-muted hover:bg-muted/70'}`}>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${activeCat === '' ? 'bg-white/20' : 'bg-primary/10'}`}>
                            <LayoutGrid className={`h-4 w-4 ${activeCat === '' ? 'text-white' : 'text-primary'}`} strokeWidth={2} />
                        </div>
                        <span className={`text-center text-[9px] font-bold ${activeCat === '' ? 'text-white' : 'text-foreground'}`}>All</span>
                    </button>
                    {ARTISAN_SKILL_CATS.slice(1)
                        .filter(cat => serviceTypeFilter === 'all' || cat.type === serviceTypeFilter)
                        .map(cat =>
                        {
                            const style = getCatStyle(cat.value)
                            const Icon = style.Icon
                            const isActive = activeCat === cat.value
                            return (
                                <button key={cat.value} onClick={() => setActiveCat(isActive ? '' : cat.value)}
                                    className={`flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl py-3 transition-all ${isActive ? 'bg-primary' : 'bg-muted hover:bg-muted/70'}`}>
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

            {/* ══ RESULTS HEADING ════════════════════════════════════════ */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-base font-black text-foreground">
                        {activeCat
                            ? (ARTISAN_SKILL_CATS.find(c => c.value === activeCat)?.label ?? 'Services')
                            : serviceTypeFilter === 'artisan'
                                ? 'Artisans & Skilled Trades'
                                : serviceTypeFilter === 'professional'
                                    ? 'Professional Services'
                                    : 'All Available Services'}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {filteredServices.length} service listing{filteredServices.length !== 1 ? 's' : ''} across {groups.length} provider{groups.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* ══ CONTENT GRID ═══════════════════════════════════════════ */}
            {filteredServices.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
                        <Users className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-bold text-foreground">No services found</p>
                    <p className="mb-5 mt-1 text-sm text-muted-foreground">
                        {activeCat
                            ? `No services found under "${ARTISAN_SKILL_CATS.find(c => c.value === activeCat)?.label}"`
                            : search
                                ? `No services matching "${search}"`
                                : 'Be the first to list your skills and get hired!'}
                    </p>
                    <button onClick={() => setProfileModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg transition-colors hover:bg-primary/90">
                        <Plus className="h-4 w-4" /> List My Services
                    </button>
                </div>
            ) : viewMode === 'services' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredServices.map(service => (
                        <ServiceListingCard key={service.id} service={service} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {groups.map(group => <ArtisanCard key={group.artisanKey} group={group} />)}
                </div>
            )}

            {/* Artisan Profile Modal */}
            <ArtisanProfileModal
                open={profileModalOpen}
                onOpenChange={setProfileModalOpen}
                categories={categories}
                existing={myArtisanProfile}
            />
        </div>
    )
}
