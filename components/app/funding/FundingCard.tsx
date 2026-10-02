'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BadgeCheck, Users, Sparkles, Megaphone, Rocket, ArrowRight } from 'lucide-react'
import type { CampaignWithCreator } from '@/lib/types'
import { toPublicStorageUrl } from '@/lib/supabase-image'

function formatNGN(amount: number): string {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`
  return `₦${amount.toLocaleString('en-NG')}`
}

interface FundingCardProps {
  campaign: CampaignWithCreator
}

export default function FundingCard({ campaign }: FundingCardProps) {
  const goal = Number(campaign.goal_amount) || 0
  const raised = Number(campaign.amount_raised) || 0
  const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0
  const rawPct = goal > 0 ? (raised / goal) * 100 : 0
  const reached = goal > 0 && raised >= goal
  const isClosed = campaign.status === 'closed' || campaign.impact?.startsWith('[CLOSED]')
  const isCompleted = reached || isClosed
  const cleanImpact = campaign.impact?.replace(/^\[CLOSED\]\s*/, '') || null
  const coverUrl = toPublicStorageUrl(campaign.cover_image_url || campaign.cover_url)

  const isCampaign = campaign.funding_type === 'campaign'

  return (
    <Link
      href={`/app/funding/${campaign.id}`}
      className="group block h-full focus-visible:outline-none"
    >
      <div className="relative flex flex-col h-full overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card to-card/95 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40">
        {/* Cover Media */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted shrink-0">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={campaign.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0c2237] via-[#102a43] to-[#081827] text-white">
              <span className="text-5xl opacity-40">
                {isCampaign ? '📣' : '🚀'}
              </span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20" />

          {/* Top Left: Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm backdrop-blur-md ${
                isCampaign ? 'bg-emerald-600/90' : 'bg-amber-600/90'
              }`}
            >
              {isCampaign ? (
                <Megaphone className="w-3 h-3" />
              ) : (
                <Rocket className="w-3 h-3" />
              )}
              {isCampaign ? 'Campaign' : 'Project'}
            </span>

            {campaign.category?.name && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/50 text-white/90 backdrop-blur-md border border-white/10">
                {campaign.category.name}
              </span>
            )}
          </div>

          {/* Top Right: Status / Goal Badge */}
          <div className="absolute top-3 right-3">
            {isClosed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-slate-800/90 backdrop-blur-md shadow-md border border-white/20">
                Concluded
              </span>
            ) : reached ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-emerald-600 shadow-md">
                <Sparkles className="w-3 h-3 fill-white" /> Funded
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/15">
                {rawPct.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-col gap-3.5 p-5 flex-1 justify-between">
          <div className="space-y-2">
            {/* Creator Profile */}
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5 shrink-0 ring-1 ring-border">
                <AvatarImage src={campaign.creator.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                  {campaign.creator.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex items-center gap-1">
                <span className="text-xs text-muted-foreground truncate font-medium">
                  {campaign.creator.display_name || campaign.creator.username}
                </span>
                {campaign.creator.verified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
              </div>
            </div>

            <h3 className="font-bold text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {campaign.title}
            </h3>

            {cleanImpact && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {cleanImpact}
              </p>
            )}
          </div>

          {/* Progress Section */}
          <div className="space-y-3 pt-3 border-t border-border/40">
            {/* Raised / Target line */}
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <span className="text-base font-extrabold text-foreground">
                  {formatNGN(raised)}
                </span>
                <span className="text-xs text-muted-foreground ml-1 font-medium">
                  raised of {formatNGN(goal)}
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                {rawPct.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-muted/80 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  reached
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                }`}
                style={{ width: `${Math.max(pct, raised > 0 ? 3 : 0)}%` }}
              />
            </div>

            {/* Bottom Meta & Action Link */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                <Users className="w-3.5 h-3.5 text-primary" />
                {campaign.donor_count.toLocaleString()} {campaign.donor_count === 1 ? 'donor' : 'donors'}
              </span>

              {isCompleted ? (
                <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
                  View Initiative <ArrowRight className="w-3 h-3" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  Donate Now <ArrowRight className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
