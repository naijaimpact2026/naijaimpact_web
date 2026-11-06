'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  X,
  User,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  MessageCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  ChevronDown,
  Building2,
  Loader2,
} from 'lucide-react'
import { updateApplicationStatus } from '@/lib/actions/jobs'
import { toast } from '@/components/toast'
import type { Job, JobApplication, ApplicationStatus } from '@/lib/types'

interface EmployerATSModalProps {
  job: Job
  applications: JobApplication[]
  isOpen: boolean
  onClose: () => void
  onStatusUpdated?: () => void
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string }
> = {
  submitted: {
    label: 'Submitted',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
  },
  in_review: {
    label: 'In Review',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
  },
  shortlisted: {
    label: 'Shortlisted',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  interviewed: {
    label: 'Interviewed',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
  },
  hired: {
    label: 'Hired',
    bg: 'bg-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
  },
}

export default function EmployerATSModal({
  job,
  applications: initialApplications,
  isOpen,
  onClose,
  onStatusUpdated,
}: EmployerATSModalProps) {
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  if (!isOpen) return null

  const filtered = applications.filter((app) =>
    filterStatus === 'all' ? true : app.status === filterStatus
  )

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setUpdatingId(appId)
    try {
      const res = await updateApplicationStatus(appId, newStatus)
      if (res.error) {
        toast.error(res.error)
      } else {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        )
        toast.success(`Candidate status updated to ${STATUS_CONFIG[newStatus].label}`)
        onStatusUpdated?.()
      }
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-border bg-card shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/80 p-6">
          <div>
            <span className="rounded-md bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Candidate Pipeline
            </span>
            <h2 className="mt-1 font-display text-xl font-bold text-foreground">
              Applicants for {job.title}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{job.company_name}</span>
              <span>•</span>
              <span className="font-semibold text-foreground">
                {applications.length} Total {applications.length === 1 ? 'Applicant' : 'Applicants'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 overflow-x-auto border-b border-border/60 px-6 py-3 scrollbar-none">
          {['all', 'submitted', 'in_review', 'shortlisted', 'interviewed', 'hired', 'rejected'].map(
            (statusKey) => {
              const active = filterStatus === statusKey
              const count =
                statusKey === 'all'
                  ? applications.length
                  : applications.filter((a) => a.status === statusKey).length
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setFilterStatus(statusKey)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {statusKey === 'all' ? 'All Applicants' : statusKey.replace('_', ' ')}
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            }
          )}
        </div>

        {/* Applicants List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 font-display font-semibold text-foreground">
                No applicants in this stage
              </p>
              <p className="text-xs text-muted-foreground">
                Candidates who apply will appear here.
              </p>
            </div>
          ) : (
            filtered.map((app) => {
              const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted
              const isUpdating = updatingId === app.id
              return (
                <div
                  key={app.id}
                  className="rounded-2xl border border-border/80 bg-background/50 p-4 transition-all hover:border-primary/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-sm font-bold text-foreground">
                          {app.full_name}
                        </h4>
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${config.bg} ${config.text}`}
                        >
                          {config.label}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <a
                            href={`mailto:${app.email}`}
                            className="hover:text-primary hover:underline"
                          >
                            {app.email}
                          </a>
                        </span>
                        {app.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${app.phone}`} className="hover:text-primary">
                              {app.phone}
                            </a>
                          </span>
                        )}
                        <span>•</span>
                        <span>{app.experience_years} yrs exp</span>
                        {app.expected_salary && (
                          <span>• Expecting ₦{app.expected_salary.toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      <div className="relative">
                        <select
                          disabled={isUpdating}
                          value={app.status}
                          onChange={(e) =>
                            handleStatusChange(app.id, e.target.value as ApplicationStatus)
                          }
                          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground outline-none transition-colors hover:border-primary focus:border-primary disabled:opacity-50"
                        >
                          <option value="submitted">Submitted</option>
                          <option value="in_review">In Review</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interviewed">Interviewed</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Cover letter snippet */}
                  {app.cover_letter && (
                    <div className="mt-3 rounded-xl bg-muted/30 p-3 text-xs leading-relaxed text-foreground/90">
                      <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                        Cover Pitch:
                      </p>
                      <p className="whitespace-pre-line">{app.cover_letter}</p>
                    </div>
                  )}

                  {/* Attachments & Links */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3 text-xs">
                    {app.resume_url && (
                      <a
                        href={app.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary hover:bg-primary/20"
                      >
                        <FileText className="h-3 w-3" />
                        View CV / Resume
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {app.portfolio_url && (
                      <a
                        href={app.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1 font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Portfolio / GitHub
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {app.applicant?.username && (
                      <Link
                        href={`/app/profile/${app.applicant.username}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1 font-semibold text-muted-foreground hover:text-foreground"
                      >
                        <User className="h-3 w-3" />
                        Profile
                      </Link>
                    )}
                    <Link
                      href="/app/chat"
                      className="ml-auto inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1 font-semibold text-white hover:bg-secondary/90"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Message
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
