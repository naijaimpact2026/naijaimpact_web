'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  Bookmark,
  Share2,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Users,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Eye,
} from 'lucide-react'
import ApplyJobModal from './ApplyJobModal'
import EmployerATSModal from './EmployerATSModal'
import { toggleSaveJob, updateJob } from '@/lib/actions/jobs'
import { toast } from '@/components/toast'
import type { Job, JobApplication, User } from '@/lib/types'

interface JobDetailClientProps {
  job: Job
  currentUser: User | null
  employerApplications?: JobApplication[]
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
      return 'Freelance'
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

export default function JobDetailClient({
  job: initialJob,
  currentUser,
  employerApplications = [],
}: JobDetailClientProps) {
  const router = useRouter()
  const [job, setJob] = useState<Job>(initialJob)
  const [isSaved, setIsSaved] = useState(!!initialJob.is_saved)
  const [saving, setSaving] = useState(false)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isATSModalOpen, setIsATSModalOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  const isOwner = currentUser && job.employer_id === currentUser.id

  const handleBookmark = async () => {
    if (saving) return
    setSaving(true)
    try {
      const res = await toggleSaveJob(job.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        setIsSaved(res.isSaved)
        toast.success(res.isSaved ? 'Job saved' : 'Job removed from saved')
      }
    } catch {
      toast.error('Failed to update bookmark')
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} at ${job.company_name}`,
          text: `Check out this opening for ${job.title} on Hubnovo`,
          url,
        })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Job link copied to clipboard')
    }
  }

  const handleToggleJobStatus = async () => {
    const nextStatus = job.status === 'active' ? 'paused' : 'active'
    try {
      const res = await updateJob(job.id, { status: nextStatus })
      if (res.error) {
        toast.error(res.error)
      } else {
        setJob((prev) => ({ ...prev, status: nextStatus }))
        toast.success(`Job marked as ${nextStatus}`)
      }
    } catch {
      toast.error('Could not update job status')
    }
  }

  return (
    <div className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all jobs
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            aria-label="Share job"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleBookmark}
            disabled={saving}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
              isSaved
                ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
            aria-label="Save job"
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (Job Details), Right Column (Company & Quick Actions) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-muted/60 text-xl font-bold text-foreground">
                  {job.company_logo_url && !logoError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.company_logo_url}
                      alt={job.company_name}
                      onError={() => setLogoError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display font-black text-primary">
                      {job.company_name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
                    {job.title}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{job.company_name}</span>
                    {job.employer?.verified && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs font-semibold">Verified</span>
                      </span>
                    )}
                    <span>•</span>
                    <span>{job.category}</span>
                  </div>
                </div>
              </div>

              {/* Status pill if closed/paused */}
              {job.status !== 'active' && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Position {job.status}
                </span>
              )}
            </div>

            {/* Badges strip */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-border/60 pt-5 text-xs">
              <span className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 font-semibold text-primary">
                <MapPin className="h-3.5 w-3.5" />
                {job.location_city ? `${job.location_city}, ` : ''}
                {job.location_state || 'Nigeria'}
              </span>

              <span
                className={`inline-flex items-center rounded-xl px-3 py-1.5 font-semibold ${
                  job.workplace_type === 'remote'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : job.workplace_type === 'hybrid'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {formatWorkplace(job.workplace_type)}
              </span>

              <span className="inline-flex items-center rounded-xl bg-muted px-3 py-1.5 font-medium text-muted-foreground">
                <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                {formatJobType(job.job_type)}
              </span>

              <span className="inline-flex items-center rounded-xl bg-muted px-3 py-1.5 font-medium text-muted-foreground">
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                {job.views_count} Views
              </span>

              <span className="inline-flex items-center rounded-xl bg-muted px-3 py-1.5 font-medium text-muted-foreground">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                {job.applications_count} Applicants
              </span>
            </div>

            {/* Compensation Box */}
            <div className="mt-5 rounded-2xl border border-border/80 bg-muted/30 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Offered Compensation
              </span>
              <p className="mt-0.5 font-display text-xl font-black text-foreground">
                {formatSalary(job)}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-foreground">About the Role</h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </div>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold text-foreground">
                Key Responsibilities
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {job.responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold text-foreground">
                Requirements & Qualifications
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {job.requirements.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold text-foreground">Perks & Benefits</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.benefits.map((benefit, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <Sparkles className="h-3 w-3" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold text-foreground">Skills & Tags</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Action & Company Card */}
        <div className="space-y-6">
          {/* Apply / Owner Action Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-base font-bold text-foreground">
              {isOwner ? 'Manage Your Posting' : 'Ready to Apply?'}
            </h3>

            {isOwner ? (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setIsATSModalOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-3 text-sm font-bold text-white shadow-md transition-transform active:scale-95 hover:bg-secondary/90"
                >
                  <Users className="h-4 w-4" />
                  View Applicants ({job.applications_count})
                </button>

                <button
                  type="button"
                  onClick={handleToggleJobStatus}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  {job.status === 'active' ? 'Pause Posting' : 'Reactivate Posting'}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {job.has_applied ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
                    <p className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Application Submitted
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Track status under &ldquo;My Applications&rdquo;.
                    </p>
                  </div>
                ) : job.status !== 'active' ? (
                  <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground">
                      This job is no longer accepting applications.
                    </p>
                  </div>
                ) : job.application_url ? (
                  <a
                    href={job.application_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-95 hover:bg-primary/90"
                  >
                    Apply on Company Site
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-95 hover:bg-primary/90"
                  >
                    Apply for this Position
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}

                {job.application_deadline && (
                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Employer Card */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              About Employer
            </h3>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-bold text-primary">
                {job.employer?.avatar_url && !avatarError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.employer.avatar_url}
                    alt={job.employer.display_name}
                    onError={() => setAvatarError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>
                    {(job.employer?.display_name || job.company_name).slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-display font-bold text-foreground">
                  {job.employer?.display_name || job.company_name}
                </h4>
                {job.employer?.username && (
                  <p className="text-xs text-muted-foreground">@{job.employer.username}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {job.employer?.username && (
                <Link
                  href={`/app/profile/${job.employer.username}`}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  View Profile
                </Link>
              )}

              {!isOwner && (
                <Link
                  href="/app/chat"
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-white hover:bg-secondary/90"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Message Employer
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <ApplyJobModal
          job={job}
          currentUser={currentUser}
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          onSuccess={() => {
            setJob((prev) => ({
              ...prev,
              has_applied: true,
              applications_count: prev.applications_count + 1,
            }))
          }}
        />
      )}

      {/* Employer ATS Modal */}
      {isATSModalOpen && (
        <EmployerATSModal
          job={job}
          applications={employerApplications}
          isOpen={isATSModalOpen}
          onClose={() => setIsATSModalOpen(false)}
          onStatusUpdated={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
