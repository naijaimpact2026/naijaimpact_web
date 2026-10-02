import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { fetchCampaignById } from '@/lib/actions/funding'
import FundingDetailClient from '@/components/app/funding/FundingDetailClient'
import EditCampaignButton from '@/components/app/funding/EditCampaignButton'
import CloseCampaignButton from '@/components/app/funding/CloseCampaignButton'
import WithdrawCampaignButton from '@/components/app/funding/WithdrawCampaignButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Heart,
  Megaphone,
  Rocket,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { toPublicStorageUrl } from '@/lib/supabase-image'

export const dynamic = 'force-dynamic'

interface FundingDetailPageProps {
  params: Promise<{ id: string }>
}

function formatFullNGN(n: number): string {
  return `₦${n.toLocaleString('en-NG')}`
}

function formatCompactNGN(amount: number): string {
  if (amount >= 1_000_000_000) {
    const b = amount / 1_000_000_000
    return `₦${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000
    return `₦${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (amount >= 100_000) {
    const k = amount / 1_000
    return `₦${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}K`
  }
  return `₦${amount.toLocaleString('en-NG')}`
}

function formatNGN(n: number): string {
  return formatFullNGN(n)
}

export default async function FundingDetailPage({ params }: FundingDetailPageProps) {
  const { id } = await params

  const [campaign, supabase] = await Promise.all([
    fetchCampaignById(id),
    createClient(),
  ])

  if (!campaign) {
    notFound()
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const isCreator = authUser ? authUser.id === campaign.user_id : false
  const userEmail = authUser?.email ?? 'donor@hubnovo.com'

  let hasPin = false
  if (isCreator && authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('wallet_pin')
      .or(`id.eq.${authUser.id},auth_id.eq.${authUser.id}`)
      .maybeSingle()
    hasPin = Boolean(profile?.wallet_pin)
  }

  const goal = Number(campaign.goal_amount) || 0
  const raised = Number(campaign.amount_raised) || 0
  const rawPct = goal > 0 ? (raised / goal) * 100 : 0
  const barPct = Math.min(100, rawPct)
  const goalReached = goal > 0 && raised >= goal
  const isClosed = campaign.status === 'closed' || Boolean(campaign.impact?.startsWith('[CLOSED]'))
  const isCompleted = Boolean(goalReached || isClosed)
  const remaining = Math.max(0, goal - raised)

  const isCampaign = campaign.funding_type === 'campaign'
  const coverUrl = toPublicStorageUrl(campaign.cover_image_url || campaign.cover_url)

  const createdDate = new Date(campaign.created_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ── Breadcrumb / Back ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/funding"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Crowdfunding
        </Link>

        {isCreator && (
          <div className="flex items-center gap-2 flex-wrap">
            <WithdrawCampaignButton
              campaignId={campaign.id}
              campaignTitle={campaign.title}
              amountRaised={raised}
              hasPin={hasPin}
            />
            <CloseCampaignButton campaignId={campaign.id} isClosed={isClosed} />
            <div className="w-36">
              <EditCampaignButton campaignId={campaign.id} />
            </div>
          </div>
        )}
      </div>

      {/* ── Main Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Media, Details, Creator, Story, Backers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Media */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border/80 bg-muted shadow-sm">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={campaign.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-800 to-teal-900 text-white">
                <span className="text-7xl opacity-40">
                  {isCampaign ? '📣' : '🚀'}
                </span>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md backdrop-blur-md ${
                  isCampaign ? 'bg-emerald-600/95' : 'bg-amber-600/95'
                }`}
              >
                {isCampaign ? (
                  <Megaphone className="w-3.5 h-3.5" />
                ) : (
                  <Rocket className="w-3.5 h-3.5" />
                )}
                {isCampaign ? 'Community Campaign' : 'Project Venture'}
              </span>

              {campaign.category?.name && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-sm">
                  {campaign.category.name}
                </span>
              )}
            </div>

            {isClosed ? (
              <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-slate-800/90 backdrop-blur-md shadow-lg border border-white/20">
                Initiative Concluded
              </div>
            ) : goalReached ? (
              <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-emerald-600 shadow-lg">
                <Sparkles className="w-3.5 h-3.5" /> 100% Goal Reached!
              </div>
            ) : null}
          </div>

          {/* Title & Impact Header */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
              {campaign.title}
            </h1>

            {campaign.impact && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                  Expected Impact
                </p>
                <p className="text-sm font-medium leading-relaxed">
                  {campaign.impact}
                </p>
              </div>
            )}
          </div>

          {/* Creator Profile Card */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Initiator & Champion
            </div>
            <div className="flex items-start gap-4">
              <Link href={`/app/profile/${campaign.creator.username}`}>
                <Avatar className="h-14 w-14 border-2 border-border/80">
                  <AvatarImage src={campaign.creator.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-lg">
                    {campaign.creator.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/app/profile/${campaign.creator.username}`}
                    className="font-bold text-base text-foreground hover:text-primary transition-colors"
                  >
                    {campaign.creator.display_name || campaign.creator.username}
                  </Link>
                  {campaign.creator.verified && (
                    <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-xs px-2 py-0">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified Member
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-0.5">
                  @{campaign.creator.username}
                </p>

                {campaign.creator.profession && (
                  <p className="text-xs font-medium text-foreground/80 mt-1">
                    {campaign.creator.profession}
                  </p>
                )}

                {campaign.creator.bio && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                    {campaign.creator.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Full Story / Description */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-foreground">About this Initiative</h2>
            <div className="prose dark:prose-invert max-w-none text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {campaign.description ||
                'The initiator has not provided an extended description for this cause yet.'}
            </div>

            <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Launched on {createdDate}
              </span>
              <span className="text-primary font-medium">Hubnovo Impact Verified</span>
            </div>
          </div>

          {/* Recent Supporters / Donors */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                Recent Backers
              </h2>
              <span className="text-xs font-medium text-muted-foreground">
                {campaign.donor_count} total contributions
              </span>
            </div>

            {campaign.recent_donations && campaign.recent_donations.length > 0 ? (
              <div className="divide-y divide-border/50">
                {campaign.recent_donations.map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 ring-1 ring-border shrink-0">
                        <AvatarImage src={d.donor?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {d.donor?.username?.charAt(0).toUpperCase() || 'D'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {d.donor?.display_name || d.donor?.username || 'Generous Donor'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(d.created_at).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
                      +{formatNGN(d.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground text-xs">
                Be the first backer to support this initiative!
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Sidebar: Funding Progress & Donation Action */}
        <div className="space-y-4">
          <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-card via-card/95 to-background shadow-xl backdrop-blur-sm space-y-6 sticky top-6">
            {/* Ambient subtle glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Status Header */}
            <div className="flex items-center justify-between">
              {isClosed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                  Initiative Concluded
                </span>
              ) : goalReached ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5 fill-emerald-500" /> Goal Reached!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Actively Fundraising
                </span>
              )}
              <span className="text-xs font-bold text-foreground">
                {rawPct.toFixed(0)}% Funded
              </span>
            </div>

            {/* Funding Progress Meter */}
            <div className="space-y-3">
              <div className="space-y-1">
                <span
                  className="text-3xl sm:text-4xl font-black text-foreground tracking-tight break-words truncate block"
                  title={formatFullNGN(raised)}
                >
                  {raised >= 100_000_000 ? formatCompactNGN(raised) : formatFullNGN(raised)}
                </span>
                <p className="text-xs text-muted-foreground font-medium flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
                  <span>
                    pledged of <span className="font-semibold text-foreground">{formatCompactNGN(goal)}</span> goal
                  </span>
                  {goal > 0 && !goalReached && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      • {formatCompactNGN(remaining)} to go
                    </span>
                  )}
                </p>
              </div>

              {/* Progress bar */}
              <div className="h-3 w-full rounded-full bg-muted/80 p-0.5 border border-border/40 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    goalReached
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
                      : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.max(barPct, raised > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 flex flex-col justify-between min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium truncate">
                    {campaign.donor_count === 1 ? 'Backer' : 'Backers'}
                  </span>
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="text-lg font-black text-foreground truncate">
                  {campaign.donor_count.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 flex flex-col justify-between min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium truncate">Target Goal</span>
                  <div className="h-7 w-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <Target className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p
                  className="text-lg font-black text-foreground truncate"
                  title={goal > 0 ? formatFullNGN(goal) : undefined}
                >
                  {goal > 0 ? formatCompactNGN(goal) : 'Flexible'}
                </p>
              </div>
            </div>

            {/* Creator Payout Action in Sidebar */}
            {isCreator && raised > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-800 dark:text-emerald-300">Creator Funds Available</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{formatCompactNGN(raised)}</span>
                </div>
                <div className="w-full">
                  <WithdrawCampaignButton
                    campaignId={campaign.id}
                    campaignTitle={campaign.title}
                    amountRaised={raised}
                    hasPin={hasPin}
                  />
                </div>
              </div>
            )}

            {/* CTA Donate Button */}
            <div className="space-y-3 pt-1">
              <FundingDetailClient
                campaignId={campaign.id}
                campaignTitle={campaign.title}
                userEmail={userEmail}
                isCompleted={isCompleted}
                isClosed={isClosed}
                isGoalReached={goalReached}
              />

              <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verified & protected via Paystack</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
