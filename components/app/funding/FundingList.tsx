'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { fetchCampaigns } from '@/lib/actions/funding'
import type { CampaignWithCreator } from '@/lib/types'
import type { FundingFilter, FundingSort, FundingStatusFilter } from '@/lib/actions/funding'
import FundingCard from './FundingCard'
import FundingCardSkeleton from './FundingCardSkeleton'
import { Button } from '@/components/ui/button'
import { PlusCircle, SearchX } from 'lucide-react'

interface FundingListProps {
  initialCampaigns: CampaignWithCreator[]
  initialCursor: string | null
  filter: FundingFilter
  categoryId?: string | null
  sort: FundingSort
  searchQuery?: string | null
  statusFilter?: FundingStatusFilter
}

export default function FundingList({
  initialCampaigns,
  initialCursor,
  filter,
  categoryId,
  sort,
  searchQuery,
  statusFilter = 'all',
}: FundingListProps) {
  const [campaigns, setCampaigns] = useState<CampaignWithCreator[]>(initialCampaigns)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialCursor !== null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset campaigns whenever filters, category, sort, status, or search changes
  useEffect(() => {
    setCampaigns(initialCampaigns)
    setCursor(initialCursor)
    setHasMore(initialCursor !== null)
  }, [initialCampaigns, initialCursor, filter, categoryId, sort, searchQuery, statusFilter])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || cursor === null) return

    setLoading(true)
    try {
      const { campaigns: next, nextCursor } = await fetchCampaigns(
        cursor,
        12,
        filter,
        categoryId,
        sort,
        searchQuery,
        statusFilter
      )
      setCampaigns((prev) => {
        const ids = new Set(prev.map((c) => c.id))
        return [...prev, ...next.filter((c) => !ids.has(c.id))]
      })
      setCursor(nextCursor)
      setHasMore(nextCursor !== null)
    } catch (err) {
      console.error('FundingList loadMore error:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, cursor, filter, categoryId, sort, searchQuery, statusFilter])

  // IntersectionObserver for infinite scrolling
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '250px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  if (campaigns.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-border bg-card/50">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
          <SearchX className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground">
          {statusFilter === 'completed'
            ? 'No completed initiatives found'
            : 'No initiatives found'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {searchQuery
            ? `No campaigns match "${searchQuery}". Try a different search term or category.`
            : statusFilter === 'completed'
            ? 'There are currently no completed or concluded campaigns in this category.'
            : 'No campaigns or projects have been launched in this category yet. Be the first to start one!'}
        </p>
        <Link href="/app/funding/create" className="mt-6">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <PlusCircle className="h-4 w-4" />
            Start a Campaign
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((campaign) => (
          <FundingCard key={campaign.id} campaign={campaign} />
        ))}

        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <FundingCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} className="h-6" />
    </div>
  )
}
