'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchServices } from '@/lib/actions/services'
import type { ServiceWithProvider } from '@/lib/types'
import type { ServiceCategory } from '@/lib/actions/services'
import ServiceCard from './ServiceCard'
import ServiceCardSkeleton from './ServiceCardSkeleton'

const CATEGORY_OPTIONS: { value: ServiceCategory; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'Tech', label: '💻 Tech' },
    { value: 'Design', label: '🎨 Design' },
    { value: 'Writing', label: '✍️ Writing' },
    { value: 'Marketing', label: '📣 Marketing' },
    { value: 'Finance', label: '💰 Finance' },
    { value: 'Health', label: '🏥 Health' },
    { value: 'Education', label: '📚 Education' },
    { value: 'Legal', label: '⚖️ Legal' },
    { value: 'Other', label: '🔧 Other' },
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
                {CATEGORY_OPTIONS.map(({ value, label }) =>
                {
                    const isActive = activeCategory === value
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => handleCategoryChange(value)}
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${isActive
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                                }`}
                        >
                            {label}
                        </button>
                    )
                })}
            </div>

            {/* Services grid */}
            {services.length === 0 && !loading ? (
                <div className="text-center py-20 text-muted-foreground">
                    <p className="text-4xl mb-3">🛠️</p>
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
