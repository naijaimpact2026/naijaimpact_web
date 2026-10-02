import Link from 'next/link'
import {
  fetchCampaigns,
  fetchFundingCategories,
  fetchFundingStats,
} from '@/lib/actions/funding'
import type { FundingFilter, FundingSort, FundingStatusFilter } from '@/lib/actions/funding'
import FundingList from '@/components/app/funding/FundingList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, TrendingUp, Users, Zap, Search, Megaphone, Rocket, Sparkles, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface FundingPageProps {
  searchParams: Promise<{
    filter?: string
    category?: string
    sort?: string
    q?: string
    status?: string
  }>
}

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

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`
  return `₦${n.toLocaleString('en-NG')}`
}

export default async function FundingPage({ searchParams }: FundingPageProps) {
  const params = await searchParams

  const statusFilter: FundingStatusFilter =
    params.status === 'completed'
      ? 'completed'
      : params.status === 'all'
      ? 'all'
      : 'active'

  const filter: FundingFilter =
    params.filter === 'campaign' || params.filter === 'project'
      ? params.filter
      : 'all'

  const sort: FundingSort =
    params.sort === 'most_funded' || params.sort === 'highest_goal'
      ? params.sort
      : 'recent'

  const categoryId = params.category || 'all'
  const searchQuery = params.q || ''

  const [
    { campaigns: initialCampaigns, nextCursor: initialCursor },
    stats,
    categories,
  ] = await Promise.all([
    fetchCampaigns(null, 12, filter, categoryId, sort, searchQuery, statusFilter),
    fetchFundingStats(),
    fetchFundingCategories(),
  ])

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white shadow-xl"
        style={{
          background:
            'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #0f766e 100%)',
        }}
      >
        {/* Ambient Decorative Blurs */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, #34d399 0%, transparent 70%)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #2dd4bf 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" /> Hubnovo Crowdfunding
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white">
              Fund the Change You Want to See
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Back impactful community campaigns, grassroots causes, and innovative Nigerian projects. Every naira counts.
            </p>
          </div>

          <Link href="/app/funding/create" className="shrink-0">
            <Button
              size="lg"
              className="gap-2.5 font-bold shadow-lg bg-white text-emerald-950 hover:bg-emerald-50 px-6 py-6 rounded-2xl text-sm transition-transform hover:scale-105"
            >
              <PlusCircle className="h-5 w-5 text-emerald-700" />
              Start a Campaign
            </Button>
          </Link>
        </div>

        {/* Real-time Stats Grid */}
        <div
          className="relative z-10 mt-8 grid grid-cols-3 gap-4 pt-6"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}
        >
          {[
            {
              icon: TrendingUp,
              label: 'Total Raised',
              value: fmt(stats.totalRaised),
            },
            {
              icon: Users,
              label: 'Contributions',
              value: stats.totalDonors.toLocaleString(),
            },
            {
              icon: Zap,
              label: 'Active Causes',
              value: stats.activeCampaigns.toLocaleString(),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xl sm:text-3xl font-extrabold text-white">
                {value}
              </span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-200">
                <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Status Section Tabs & Primary Navigation ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        {/* Status Toggle Tabs: Active Causes | Completed & Funded | All Initiatives */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/80 shrink-0 overflow-x-auto">
          {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = statusFilter === value
            return (
              <Link
                key={value}
                href={`?status=${value}&filter=${filter}&category=${categoryId}&sort=${sort}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
              >
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-card border border-border shrink-0 self-start sm:self-auto">
          <span className="text-xs font-semibold text-muted-foreground px-2 hidden md:inline">Sort:</span>
          {SORT_OPTIONS.map(({ value, label }) => {
            const active = sort === value
            return (
              <Link
                key={value}
                href={`?status=${statusFilter}&filter=${filter}&category=${categoryId}&sort=${value}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
              >
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Filter Controls & Search ── */}
      <div className="space-y-4">
        {/* Search & Type pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <form method="GET" action="/app/funding" className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search initiatives, causes, keywords..."
              className="pl-10 rounded-2xl bg-card border-border/80 focus-visible:ring-emerald-500 text-sm h-11"
            />
            {statusFilter !== 'active' && <input type="hidden" name="status" value={statusFilter} />}
            {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
            {categoryId !== 'all' && <input type="hidden" name="category" value={categoryId} />}
            {sort !== 'recent' && <input type="hidden" name="sort" value={sort} />}
          </form>

          {/* Type Toggle Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border shrink-0 self-start md:self-auto">
            {FILTER_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = filter === value
              return (
                <Link
                  key={value}
                  href={`?status=${statusFilter}&filter=${value}&category=${categoryId}&sort=${sort}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                >
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Link
            href={`?status=${statusFilter}&filter=${filter}&category=all&sort=${sort}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
          >
            <span
              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                categoryId === 'all'
                  ? 'bg-foreground text-background border-foreground shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/40'
              }`}
            >
              All Categories
            </span>
          </Link>

          {categories.map((cat) => {
            const active = categoryId === cat.id
            return (
              <Link
                key={cat.id}
                href={`?status=${statusFilter}&filter=${filter}&category=${cat.id}&sort=${sort}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
              >
                <span
                  className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:border-emerald-600/50'
                  }`}
                >
                  {cat.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Campaign Grid ── */}
      <FundingList
        initialCampaigns={initialCampaigns}
        initialCursor={initialCursor}
        filter={filter}
        categoryId={categoryId}
        sort={sort}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
      />
    </main>
  )
}