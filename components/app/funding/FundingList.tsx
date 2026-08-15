'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchCampaigns } from '@/lib/actions/funding'
import type { CampaignWithCreator } from '@/lib/types'
import type { FundingFilter, FundingSort } from '@/lib/actions/funding'
import FundingCard from './FundingCard'
import FundingCardSkeleton from './FundingCardSkeleton'

interface FundingListProps
{
    initialCampaigns: CampaignWithCreator[]
    initialCursor: string | null
    filter: FundingFilter
    sort: FundingSort
}

export default function FundingList({
    initialCampaigns,
    initialCursor,
    filter,
    sort,
}: FundingListProps)
{
    const [campaigns, setCampaigns] = useState<CampaignWithCreator[]>(initialCampaigns)
    const [cursor, setCursor] = useState<string | null>(initialCursor)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(initialCursor !== null)
    const sentinelRef = useRef<HTMLDivElement>(null)

    // Reset when filter/sort changes
    useEffect(() =>
    {
        setCampaigns(initialCampaigns)
        setCursor(initialCursor)
        setHasMore(initialCursor !== null)
    }, [initialCampaigns, initialCursor, filter, sort])

    const loadMore = useCallback(async () =>
    {
        if (loading || !hasMore || cursor === null) return

        setLoading(true)
        try
        {
            const { campaigns: next, nextCursor } = await fetchCampaigns(cursor, 12, filter, sort)
            setCampaigns((prev) =>
            {
                // deduplicate by id
                const ids = new Set(prev.map((c) => c.id))
                return [...prev, ...next.filter((c) => !ids.has(c.id))]
            })
            setCursor(nextCursor)
            setHasMore(nextCursor !== null)
        } catch (err)
        {
            console.error('FundingList loadMore error:', err)
        } finally
        {
            setLoading(false)
        }
    }, [loading, hasMore, cursor, filter, sort])

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

    if (campaigns.length === 0 && !loading)
    {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <p className="text-4xl mb-3">🌍</p>
                <p className="font-medium">No campaigns found</p>
                <p className="text-sm mt-1">Be the first to create one!</p>
            </div>
        )
    }

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {campaigns.map((campaign) => (
                    <FundingCard key={campaign.id} campaign={campaign} />
                ))}

                {loading &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <FundingCardSkeleton key={`skeleton-${i}`} />
                    ))}
            </div>

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4" />

            {!hasMore && campaigns.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                    You&apos;ve seen all campaigns
                </p>
            )}
        </div>
    )
}
