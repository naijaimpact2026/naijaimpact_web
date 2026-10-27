'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { shouldSkipImageOptimization } from '@/lib/supabase-image'
import {
  Briefcase,
  MapPin,
  Building2,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { toggleSaveJob } from '@/lib/actions/jobs'
import { toast } from '@/components/toast'
import type { Job } from '@/lib/types'

interface JobCardProps {
  job: Job
  onApplyClick?: (job: Job) => void
  currentUserId?: string
}

function formatSalary(job: Job): string {
  if (job.is_salary_negotiable && !job.salary_min && !job.salary_max) {
    return 'Salary Negotiable'
  }
  const curr = job.salary_currency === 'NGN' ? '₦' : job.salary_currency + ' '
  const period =
    job.salary_period === 'monthly'
      ? '/mo'
      : job.salary_period === 'yearly'
      ? '/yr'
      : job.salary_period === 'hourly'
      ? '/hr'
      : ''

  if (job.salary_min && job.salary_max) {
    return `${curr}${job.salary_min.toLocaleString()} - ${curr}${job.salary_max.toLocaleString()} ${period}`
  }
  if (job.salary_min) {
    return `From ${curr}${job.salary_min.toLocaleString()} ${period}`
  }
  if (job.salary_max) {
    return `Up to ${curr}${job.salary_max.toLocaleString()} ${period}`
  }
  return 'Salary undisclosed'
}

function formatJobType(type: string): string {
  switch (type) {
    case 'full_time':
      return 'Full-time'
    case 'part_time':
      return 'Part-time'
    case 'contract':
      return 'Contract'
    case 'internship':
      return 'Internship'
    case 'freelance':
      return 'Freelance / Gig'
    default:
      return type
  }
}

function formatWorkplace(workplace: string): string {
  switch (workplace) {
    case 'remote':
      return 'Remote'
    case 'on_site':
      return 'On-site'
    case 'hybrid':
      return 'Hybrid'
    default:
      return workplace
  }
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function JobCard({ job, onApplyClick, currentUserId }: JobCardProps) {
  const [isSaved, setIsSaved] = useState(!!job.is_saved)
  const [saving, setSaving] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const isOwner = currentUserId && job.employer_id === currentUserId

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (saving) return
    setSaving(true)
    try {
      const res = await toggleSaveJob(job.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        setIsSaved(res.isSaved)
        toast.success(res.isSaved ? 'Job saved to bookmarks' : 'Job removed from bookmarks')
      }
    } catch {
      toast.error('Failed to update bookmark')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      {/* Top row: Company logo/avatar, Title, Bookmark */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            {/* Company Logo or Initial avatar */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-muted/60 text-base font-bold text-foreground">
              {job.company_logo_url && !logoError ? (
                <Image
                  src={job.company_logo_url}
                  alt={job.company_name}
                  fill
                  unoptimized={shouldSkipImageOptimization(job.company_logo_url)}
                  onError={() => setLogoError(true)}
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <span className="font-display font-black text-primary">
                  {job.company_name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <Link
                href={`/app/jobs/${job.id}`}
                className="font-display text-base font-bold text-foreground transition-colors hover:text-primary line-clamp-1"
              >
                {job.title}
              </Link>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground/80">{job.company_name}</span>
                {job.category && (
                  <>
                    <span>•</span>
                    <span>{job.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bookmark button */}
          <button
            type="button"
            onClick={handleBookmark}
            aria-label={isSaved ? 'Remove bookmark' : 'Bookmark job'}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              isSaved
                ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Location & Workplace badges */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary">
            <MapPin className="h-3 w-3" />
            {job.location_city ? `${job.location_city}, ` : ''}
            {job.location_state || 'Nigeria'}
          </span>

          <span
            className={`inline-flex items-center rounded-lg px-2.5 py-1 font-semibold ${
              job.workplace_type === 'remote'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : job.workplace_type === 'hybrid'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {formatWorkplace(job.workplace_type)}
          </span>

          <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 font-medium text-muted-foreground">
            <Briefcase className="mr-1 h-3 w-3" />
            {formatJobType(job.job_type)}
          </span>

          {job.has_applied && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-teal-500/10 px-2.5 py-1 font-semibold text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="h-3 w-3" /> Applied
            </span>
          )}

          {isOwner && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 font-semibold text-purple-600 dark:text-purple-400">
              <Sparkles className="h-3 w-3" /> Your Posting
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {job.description}
        </p>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground/75"
              >
                #{tag}
              </span>
            ))}
            {job.tags.length > 3 && (
              <span className="rounded-md px-1 py-0.5 text-[10px] text-muted-foreground">
                +{job.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom row: Salary, Posted time, Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">Compensation</p>
          <p className="font-display font-bold text-foreground">{formatSalary(job)}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
            <Clock className="h-3 w-3" />
            {timeAgo(job.created_at)}
          </span>

          <Link
            href={`/app/jobs/${job.id}`}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform active:scale-95 hover:bg-primary/90"
          >
            {job.has_applied ? 'View Details' : 'Details & Apply'}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
