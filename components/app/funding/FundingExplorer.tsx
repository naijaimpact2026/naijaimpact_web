'use client'

import { useState, useCallback, useRef, useEffect, useTransition } from 'react'
import {
  fetchCampaigns,
  type FundingFilter,
  type FundingSort,
  type FundingStatusFilter,
} from '@/lib/actions/funding'
import type { CampaignWithCreator, FundingCategory } from '@/lib/types'
import FundingCard from './FundingCard'
import FundingCardSkeleton from './FundingCardSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Zap,
  Sparkles,
  CheckCircle2,
  Megaphone,
  Rocket,
  Search,
  SearchX,
  X,
  PlusCircle,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'

const STATUS_OPTIONS: { value: FundingStatusFilter; label: string; icon: typeof Zap }[] = [
  { value: 'active', label: 'Active Causes', icon: Zap },
  { value: 'completed', label: 'Completed & Funded', icon: CheckCircle2 },
  { value: 'all', label: 'All Initiatives', icon: Sparkles },
]

const FILTER_OPTIONS: { value: FundingFilter; label: string; icon: typeof Megaphone }[] = [
  { value: 'all', label: 'All Types', icon: Sparkles },
  { value: 'campaign', label: 'Campaigns', icon: Megaphone },
  { value: 'project', label: 'Projects', icon: Rocket },
]

const SORT_OPTIONS: { value: FundingSort; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'most_funded', label: 'Most Funded' },
  { value: 'highest_goal', label: 'Highest Goal' },
]

interface FundingExplorerProps {
  initialCampaigns: CampaignWithCreator[]
  initialCursor: string | null
  categories: FundingCategory[]
  initialStatus?: FundingStatusFilter
  initialFilter?: FundingFilter
  initialCategoryId?: string
  initialSort?: FundingSort
  initialSearchQuery?: string
}

export default function FundingExplorer({
  initialCampaigns,
  initialCursor,
  categories,
  initialStatus = 'active',
  initialFilter = 'all',
  initialCategoryId = 'all',
  initialSort = 'recent',
  initialSearchQuery = '',
}: FundingExplorerProps) {
  // Client state for instant UI response
  const [statusFilter, setStatusFilter] = useState<FundingStatusFilter>(initialStatus)
  const [filter, setFilter] = useState<FundingFilter>(initialFilter)
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId)
  const [sort, setSort] = useState<FundingSort>(initialSort)
  const [searchInput, setSearchInput] = useState<string>(initialSearchQuery)
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery)

  const [campaigns, setCampaigns] = useState<CampaignWithCreator[]>(initialCampaigns)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialCursor !== null)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync state to URL bar without causing a blocking full-page server round-trip
  const syncUrl = useCallback(
    (
      newStatus: FundingStatusFilter,
      newFilter: FundingFilter,
      newCat: string,
      newSort: FundingSort,
      newQ: string
    ) => {
      if (typeof window === 'undefined') return
      const params = new URLSearchParams()
      if (newStatus !== 'active') params.set('status', newStatus)
      if (newFilter !== 'all') params.set('filter', newFilter)
      if (newCat !== 'all') params.set('category', newCat)
      if (newSort !== 'recent') params.set('sort', newSort)
      if (newQ.trim()) params.set('q', newQ.trim())

      const qs = params.toString()
      const newUrl = qs ? `/app/funding?${qs}` : '/app/funding'
      window.history.replaceState(null, '', newUrl)
    },
    []
  )

  // Core fetch function with race condition guard
  const executeQuery = useCallback(
    async (
      targetStatus: FundingStatusFilter,
      targetFilter: FundingFilter,
      targetCat: string,
      targetSort: FundingSort,
      targetQ: string
    ) => {
      const currentRequestId = ++requestIdRef.current
      setLoading(true)

      syncUrl(targetStatus, targetFilter, targetCat, targetSort, targetQ)

      try {
        const { campaigns: fresh, nextCursor } = await fetchCampaigns(
          null,
          12,
          targetFilter,
          targetCat,
          targetSort,
          targetQ,
          targetStatus
        )

        // Drop out-of-order stale response if a newer query was launched
        if (requestIdRef.current !== currentRequestId) return

        setCampaigns(fresh)
        setCursor(nextCursor)
        setHasMore(nextCursor !== null)
      } catch (err) {
        if (requestIdRef.current !== currentRequestId) return
        console.error('Failed to load campaigns:', err)
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false)
        }
      }
    },
    [syncUrl]
  )

  // Handlers for instant tab changes
  const handleStatusChange = (val: FundingStatusFilter) => {
    if (val === statusFilter) return
    setStatusFilter(val)
    executeQuery(val, filter, categoryId, sort, searchQuery)
  }

  const handleFilterChange = (val: FundingFilter) => {
    if (val === filter) return
    setFilter(val)
    executeQuery(statusFilter, val, categoryId, sort, searchQuery)
  }

  const handleCategoryChange = (catId: string) => {
    if (catId === categoryId) return
    setCategoryId(catId)
    executeQuery(statusFilter, filter, catId, sort, searchQuery)
  }

  const handleSortChange = (val: FundingSort) => {
    if (val === sort) return
    setSort(val)
    executeQuery(statusFilter, filter, categoryId, val, searchQuery)
  }

  const handleSearchCommit = (val: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    const clean = val.trim()
    setSearchQuery(clean)
    executeQuery(statusFilter, filter, categoryId, sort, clean)
  }

  const handleSearchInputChange = (val: string) => {
    setSearchInput(val)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      const clean = val.trim()
      setSearchQuery(clean)
      executeQuery(statusFilter, filter, categoryId, sort, clean)
    }, 350)
  }

  const handleClearFilters = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    setStatusFilter('active')
    setFilter('all')
    setCategoryId('all')
    setSort('recent')
    setSearchInput('')
    setSearchQuery('')
    executeQuery('active', 'all', 'all', 'recent', '')
  }

  // Infinite scroll load more
  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || cursor === null) return

    setLoadingMore(true)
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
      console.error('FundingExplorer loadMore error:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loading, loadingMore, hasMore, cursor, filter, categoryId, sort, searchQuery, statusFilter])

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
      { rootMargin: '300px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="space-y-6">
      {/* ── Status Section Tabs & Primary Navigation ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        {/* Status Toggle Tabs: Active Causes | Completed & Funded | All Initiatives */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border shrink-0 overflow-x-auto">
          {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = statusFilter === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleStatusChange(value)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {label}
              </button>
            )
          })}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-card border border-border shrink-0 self-start sm:self-auto">
          <span className="text-xs font-semibold text-muted-foreground px-2 hidden md:inline">Sort:</span>
          {SORT_OPTIONS.map(({ value, label }) => {
            const active = sort === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleSortChange(value)}
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  active
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Filter Controls & Search ── */}
      <div className="space-y-4">
        {/* Search bar & Type pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearchCommit(searchInput)
                }
              }}
              placeholder="Search initiatives, causes, keywords..."
              className="pl-10 pr-9 rounded-2xl bg-card border-border/80 focus-visible:ring-primary text-sm h-11 transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  handleSearchCommit('')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Toggle Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border shrink-0 self-start md:self-auto">
            {FILTER_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = filter === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleFilterChange(value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              categoryId === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            }`}
          >
            All Categories
          </button>

          {categories.map((cat) => {
            const active = categoryId === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Active Filters Bar & Reset Action ── */}
      {(statusFilter !== 'active' ||
        filter !== 'all' ||
        categoryId !== 'all' ||
        sort !== 'recent' ||
        searchQuery) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-xl px-3.5 py-2">
          <span>Filtered results</span>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset all filters
          </button>
        </div>
      )}

      {/* ── Campaign Grid & Loading States ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <FundingCardSkeleton key={i} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-border bg-card/50">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <SearchX className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {statusFilter === 'completed'
              ? 'No completed initiatives found'
              : statusFilter === 'active'
              ? 'No active initiatives found'
              : 'No initiatives found'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
            {searchQuery
              ? `No campaigns match your search "${searchQuery}". Try adjusting your keywords or clearing filters.`
              : 'Try selecting another category or type, or be the first to launch a community campaign!'}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="rounded-xl border-border hover:bg-muted font-medium"
            >
              Reset Filters
            </Button>
            <Link href="/app/funding/create">
              <Button size="sm" className="rounded-xl bg-primary text-primary-foreground font-semibold gap-1.5 shadow-sm">
                <PlusCircle className="w-4 h-4" /> Start a Campaign
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((c) => (
              <FundingCard key={c.id} campaign={c} />
            ))}
          </div>

          {/* Loading more skeleton cards */}
          {loadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <FundingCardSkeleton key={`more-${i}`} />
              ))}
            </div>
          )}

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="h-4 w-full" />
        </div>
      )}
    </div>
  )
}
