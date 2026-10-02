import Link from 'next/link'
import {
  fetchCampaigns,
  fetchFundingCategories,
  fetchFundingStats,
} from '@/lib/actions/funding'
import type { FundingFilter, FundingSort, FundingStatusFilter } from '@/lib/actions/funding'
import FundingExplorer from '@/components/app/funding/FundingExplorer'
import { Button } from '@/components/ui/button'
import { PlusCircle, TrendingUp, Users, Zap, Sparkles } from 'lucide-react'

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
      {/* ── Hero Banner (Matching Hubnovo Brand Theme) ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-white/10"
        style={{
          background:
            'linear-gradient(135deg, #0A1E33 0%, #102A43 55%, #004D73 100%)',
        }}
      >
        {/* Ambient Decorative Blurs */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #00B8D9 0%, transparent 70%)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #00A86B 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-cyan-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Hubnovo Crowdfunding
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white">
              Fund the Change You Want to See
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Back impactful community campaigns, grassroots causes, and innovative Nigerian projects. Every naira counts.
            </p>
          </div>

          <Link href="/app/funding/create" className="shrink-0">
            <Button
              size="lg"
              className="gap-2.5 font-bold shadow-lg shadow-emerald-500/25 bg-emerald-500 text-slate-950 hover:bg-emerald-400 px-6 py-6 rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="h-5 w-5 text-slate-950" />
              Start a Campaign
            </Button>
          </Link>
        </div>

        {/* Real-time Stats Grid */}
        <div
          className="relative z-10 mt-8 grid grid-cols-3 gap-4 pt-6"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}
        >
          {[
            {
              icon: TrendingUp,
              label: 'Total Raised',
              value: fmt(stats.totalRaised),
              iconColor: 'text-cyan-300',
            },
            {
              icon: Users,
              label: 'Contributions',
              value: stats.totalDonors.toLocaleString(),
              iconColor: 'text-cyan-300',
            },
            {
              icon: Zap,
              label: 'Active Causes',
              value: stats.activeCampaigns.toLocaleString(),
              iconColor: 'text-emerald-400',
            },
          ].map(({ icon: Icon, label, value, iconColor }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xl sm:text-3xl font-black text-white tracking-tight">
                {value}
              </span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} /> {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Interactive Funding Explorer (Instant responsive filters + search + grid) ── */}
      <FundingExplorer
        initialCampaigns={initialCampaigns}
        initialCursor={initialCursor}
        categories={categories}
        initialStatus={statusFilter}
        initialFilter={filter}
        initialCategoryId={categoryId}
        initialSort={sort}
        initialSearchQuery={searchQuery}
      />
    </main>
  )
}