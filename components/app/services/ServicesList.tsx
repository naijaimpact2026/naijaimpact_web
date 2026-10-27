'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchServices } from '@/lib/actions/services'
import type { ServiceWithProvider } from '@/lib/types'
import type { ServiceCategory } from '@/lib/actions/services'
import ServiceCard from './ServiceCard'
import ServiceCardSkeleton from './ServiceCardSkeleton'
import
    {
        LayoutGrid, Laptop, Palette, PenLine, Megaphone,
        DollarSign, HeartPulse, BookOpen, Scale, Wrench,
    } from 'lucide-react'

const CATEGORY_OPTIONS: { value: ServiceCategory; label: string; icon: typeof LayoutGrid }[] = [
    { value: 'all', label: 'All', icon: LayoutGrid },
    { value: 'Tech', label: 'Tech', icon: Laptop },
    { value: 'Design', label: 'Design', icon: Palette },
    { value: 'Writing', label: 'Writing', icon: PenLine },
    { value: 'Marketing', label: 'Marketing', icon: Megaphone },
    { value: 'Finance', label: 'Finance', icon: DollarSign },
    { value: 'Health', label: 'Health', icon: HeartPulse },
    { value: 'Education', label: 'Education', icon: BookOpen },
    { value: 'Legal', label: 'Legal', icon: Scale },
    { value: 'Other', label: 'Other', icon: Wrench },
]

interface ServicesListProps
{
    initialServices: ServiceWithProvider[]
    initialCursor: string | null
    initialCategory: ServiceCategory
}

export default function ServicesList({
    initialServices,
    initialCursor,
    initialCategory,
}: ServicesListProps)
{
    const router = useRouter()
    const [activeCategory, setActiveCategory] = useState<ServiceCategory>(initialCategory)
    const [services, setServices] = useState<ServiceWithProvider[]>(initialServices)
    const [cursor, setCursor] = useState<string | null>(initialCursor)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(initialCursor !== null)
    const sentinelRef = useRef<HTMLDivElement>(null)

    // Reset list when category changes
    const handleCategoryChange = useCallback(
        async (category: ServiceCategory) =>
        {
            setActiveCategory(category)
            setLoading(true)
            try
            {
                const { services: fresh, nextCursor } = await fetchServices(null, 12, category)
                setServices(fresh)
                setCursor(nextCursor)
                setHasMore(nextCursor !== null)
                // Sync URL
                const url = category === 'all' ? '/app/services' : `/app/services?category=${category}`
                router.replace(url, { scroll: false })
            } catch (err)
            {
                console.error('ServicesList category change error:', err)
            } finally
            {
                setLoading(false)
            }
        },
        [router]
    )

    const loadMore = useCallback(async () =>
    {
        if (loading || !hasMore || cursor === null) return

        setLoading(true)
        try
        {
            const { services: next, nextCursor } = await fetchServices(cursor, 12, activeCategory)
            setServices((prev) =>
            {
                const ids = new Set(prev.map((s) => s.id))
                return [...prev, ...next.filter((s) => !ids.has(s.id))]
            })
            setCursor(nextCursor)
            setHasMore(nextCursor !== null)
        } catch (err)
        {
            console.error('ServicesList loadMore error:', err)
        } finally
        {
            setLoading(false)
        }
    }, [loading, hasMore, cursor, activeCategory])

    // IntersectionObserver for infinite scroll
    useEffect(() =>
    {
        const sentinel = sentinelRef.current
        if (!sentinel) return

        const observer = new IntersectionObserver(
            (entries) =>
            {
                if (entries[0].isIntersecting)
                {
                    loadMore()
                }
            },
            { rootMargin: '200px' }
        )

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [loadMore])

    return (
        <div className="space-y-6">
            {/* Category filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
                {CATEGORY_OPTIONS.map(({ value, label, icon: Icon }) =>
                {
                    const isActive = activeCategory === value
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => handleCategoryChange(value)}
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${isActive
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    )
                })}
            </div>

            {/* Services grid */}
            {services.length === 0 && !loading ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Wrench className="mx-auto h-10 w-10 mb-3 opacity-40" />
                    <p className="font-medium">No services found</p>
                    <p className="text-sm mt-1">Be the first to list your services!</p>
                </div>
            ) : (
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {services.map((service) => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                        {loading &&
                            Array.from({ length: 3 }).map((_, i) => (
                                <ServiceCardSkeleton key={`skeleton-${i}`} />
                            ))}
                    </div>

                    {/* Sentinel for infinite scroll */}
                    <div ref={sentinelRef} className="h-4" />

                    {!hasMore && services.length > 0 && (
                        <p className="text-center text-sm text-muted-foreground py-6">
                            You&apos;ve seen all services
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
