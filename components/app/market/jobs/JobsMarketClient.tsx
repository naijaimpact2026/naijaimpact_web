'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Plus,
  Users,
  Search,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Building2,
  FileText,
  Loader2,
} from 'lucide-react'
import JobCard from './JobCard'
import JobFilters from './JobFilters'
import ApplyJobModal from './ApplyJobModal'
import EmployerATSModal from './EmployerATSModal'
import { fetchJobs, fetchMyApplications, fetchEmployerJobsWithApplicants, fetchSavedJobs } from '@/lib/actions/jobs'
import { toast } from '@/components/toast'
import type { Job, JobApplication, JobType, WorkplaceType, User } from '@/lib/types'

interface JobsMarketClientProps {
  initialJobs: Job[]
  initialNextCursor: string | null
  totalCount: number
  currentUser: User | null
}

const JOB_TABS = [
  { id: 'explore', label: 'Explore Jobs', icon: Briefcase },
  { id: 'applications', label: 'My Applications', icon: CheckCircle2 },
  { id: 'my_posts', label: 'My Job Posts', icon: Users },
  { id: 'saved', label: 'Saved Jobs', icon: Bookmark },
] as const

export default function JobsMarketClient({
  initialJobs,
  initialNextCursor,
  totalCount,
  currentUser,
}: JobsMarketClientProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'explore' | 'applications' | 'my_posts' | 'saved'>('explore')

  // Explore Jobs state
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filters state
  const [search, setSearch] = useState('')
  const [selectedJobType, setSelectedJobType] = useState<JobType | 'all'>('all')
  const [selectedWorkplace, setSelectedWorkplace] = useState<WorkplaceType | 'all'>('all')
  const [selectedState, setSelectedState] = useState('all')

  // Applications tab state
  const [myApplications, setMyApplications] = useState<JobApplication[]>([])
  const [loadingApps, setLoadingApps] = useState(false)

  // My Postings tab state
  const [employerJobs, setEmployerJobs] = useState<Job[]>([])
  const [employerApps, setEmployerApps] = useState<JobApplication[]>([])
  const [loadingEmployerData, setLoadingEmployerData] = useState(false)

  // Saved Jobs tab state
  const [savedJobs, setSavedJobs] = useState<Job[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)

  // Modals state
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null)
  const [selectedJobForATS, setSelectedJobForATS] = useState<Job | null>(null)

  // Run query with current filters
  const runFilterQuery = useCallback(
    async (overrideFilters?: Partial<{
      search: string
      job_type: JobType | 'all'
      workplace_type: WorkplaceType | 'all'
      state: string
    }>) => {
      setLoading(true)
      try {
        const s = overrideFilters?.search !== undefined ? overrideFilters.search : search
        const jt = overrideFilters?.job_type !== undefined ? overrideFilters.job_type : selectedJobType
        const wp = overrideFilters?.workplace_type !== undefined ? overrideFilters.workplace_type : selectedWorkplace
        const st = overrideFilters?.state !== undefined ? overrideFilters.state : selectedState

        const res = await fetchJobs({
          search: s,
          job_type: jt,
          workplace_type: wp,
          state: st,
        })
        setJobs(res.jobs)
        setNextCursor(res.nextCursor)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load jobs')
      } finally {
        setLoading(false)
      }
    },
    [search, selectedJobType, selectedWorkplace, selectedState]
  )

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await runFilterQuery()
  }

  const handleJobTypeChange = async (val: JobType | 'all') => {
    setSelectedJobType(val)
    await runFilterQuery({ job_type: val })
  }

  const handleWorkplaceChange = async (val: WorkplaceType | 'all') => {
    setSelectedWorkplace(val)
    await runFilterQuery({ workplace_type: val })
  }

  const handleStateChange = async (val: string) => {
    setSelectedState(val)
    await runFilterQuery({ state: val })
  }

  const handleClearFilters = async () => {
    setSearch('')
    setSelectedJobType('all')
    setSelectedWorkplace('all')
    setSelectedState('all')
    await runFilterQuery({
      search: '',
      job_type: 'all',
      workplace_type: 'all',
      state: 'all',
    })
  }

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetchJobs({
        search,
        job_type: selectedJobType,
        workplace_type: selectedWorkplace,
        state: selectedState,
        cursor: nextCursor,
      })
      setJobs((prev) => [...prev, ...res.jobs])
      setNextCursor(res.nextCursor)
    } catch {
      toast.error('Could not load more jobs')
    } finally {
      setLoadingMore(false)
    }
  }

  // Handle Tab changes & lazy-load tab data
  const handleTabChange = async (tab: 'explore' | 'applications' | 'my_posts' | 'saved') => {
    setActiveTab(tab)
    if (tab === 'applications' && myApplications.length === 0) {
      setLoadingApps(true)
      try {
        const apps = await fetchMyApplications()
        setMyApplications(apps)
      } catch {
        toast.error('Could not load applications')
      } finally {
        setLoadingApps(false)
      }
    } else if (tab === 'my_posts' && employerJobs.length === 0) {
      setLoadingEmployerData(true)
      try {
        const { jobs: empJobs, applications: empApps } = await fetchEmployerJobsWithApplicants()
        setEmployerJobs(empJobs)
        setEmployerApps(empApps)
      } catch {
        toast.error('Could not load your job postings')
      } finally {
        setLoadingEmployerData(false)
      }
    } else if (tab === 'saved' && savedJobs.length === 0) {
      setLoadingSaved(true)
      try {
        const saved = await fetchSavedJobs()
        setSavedJobs(saved)
      } catch {
        toast.error('Could not load saved jobs')
      } finally {
        setLoadingSaved(false)
      }
    }
  }

  const hasActiveFilters =
    Boolean(search) || selectedJobType !== 'all' || selectedWorkplace !== 'all' || selectedState !== 'all'

  return (
    <div className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ══ HERO BANNER ═════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white"
        style={{ background: 'linear-gradient(135deg, #091E3A 0%, #102A43 50%, #0E6EDC 120%)' }}
      >
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
              <Briefcase className="h-3.5 w-3.5" /> Hubnovo Opportunities
            </span>
            <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl text-white">
              Discover Jobs & Hire Top Talent
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Connect with leading companies, local enterprises, and innovative projects. Apply in one click or post your roles to reach verified candidates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/app/market/jobs/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-secondary shadow-lg transition-transform active:scale-95 hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Post a Job Opening
            </Link>
          </div>
        </div>
      </section>

      {/* ══ NAVIGATION TABS ═════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {JOB_TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'explore' && (
          <span className="text-xs font-semibold text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'Job' : 'Jobs'} Available
          </span>
        )}
      </div>

      {/* ══ TAB 1: EXPLORE JOBS ═════════════════════════════════════ */}
      {activeTab === 'explore' && (
        <div className="space-y-5">
          <JobFilters
            search={search}
            onSearchChange={setSearch}
            onSearchSubmit={handleSearchSubmit}
            selectedJobType={selectedJobType}
            onJobTypeChange={handleJobTypeChange}
            selectedWorkplace={selectedWorkplace}
            onWorkplaceChange={handleWorkplaceChange}
            selectedState={selectedState}
            onStateChange={handleStateChange}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-xs font-medium">Finding opportunities…</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                No matching jobs found
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Try loosening your filters or search keywords to discover more opportunities.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  currentUserId={currentUser?.id}
                  onApplyClick={(j) => setSelectedJobForApply(j)}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {nextCursor && !loading && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-2.5 text-xs font-bold text-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-muted disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Loading more…
                  </>
                ) : (
                  'Load More Jobs'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 2: MY APPLICATIONS ══════════════════════════════════ */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {!currentUser ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <p className="font-semibold text-foreground">Please sign in to track your applications</p>
              <Link
                href="/auth/login"
                className="mt-3 inline-block rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground"
              >
                Sign In
              </Link>
            </div>
          ) : loadingApps ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-xs font-medium">Loading your applications…</p>
            </div>
          ) : myApplications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                No applications submitted yet
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Browse our curated job postings and submit your first application.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                Explore Open Roles
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {myApplications.map((app) => {
                const job = app.job
                return (
                  <div
                    key={app.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-display text-base font-bold text-foreground">
                            {job?.title || 'Job Posting'}
                          </h4>
                          <p className="text-xs text-muted-foreground">{job?.company_name}</p>
                        </div>
                        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold capitalize text-primary">
                          {app.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{job?.location_state || 'Nigeria'}</span>
                        <span>•</span>
                        <span>Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-xs text-muted-foreground">
                        {app.resume_url ? 'CV Attached' : 'No CV'}
                      </span>
                      {job?.id && (
                        <Link
                          href={`/app/market/jobs/${job.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          View Job Details &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 3: MY JOB POSTS (EMPLOYER ATS) ══════════════════════ */}
      {activeTab === 'my_posts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-foreground">
              Your Posted Roles
            </h3>
            <Link
              href="/app/market/jobs/create"
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Post New Role
            </Link>
          </div>

          {!currentUser ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <p className="font-semibold text-foreground">Please sign in to view your postings</p>
              <Link
                href="/auth/login"
                className="mt-3 inline-block rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground"
              >
                Sign In
              </Link>
            </div>
          ) : loadingEmployerData ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-xs font-medium">Loading your job postings…</p>
            </div>
          ) : employerJobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                You haven&apos;t posted any jobs yet
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Post your job vacancies to reach qualified candidates across Nigeria.
              </p>
              <Link
                href="/app/market/jobs/create"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Create First Job Posting
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {employerJobs.map((job) => {
                const appsForJob = employerApps.filter((a) => a.job_id === job.id)
                return (
                  <div
                    key={job.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-display text-base font-bold text-foreground">
                            {job.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">{job.company_name}</p>
                        </div>
                        <span
                          className={`rounded-lg px-2.5 py-0.5 text-xs font-bold capitalize ${
                            job.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {appsForJob.length} {appsForJob.length === 1 ? 'Applicant' : 'Applicants'}
                        </span>
                        <span>•</span>
                        <span>{job.views_count} views</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <Link
                        href={`/app/market/jobs/${job.id}`}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        View Post
                      </Link>

                      <button
                        type="button"
                        onClick={() => setSelectedJobForATS(job)}
                        className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-secondary/90"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Manage Applicants ({appsForJob.length})
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 4: SAVED JOBS ════════════════════════════════════════ */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {!currentUser ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <p className="font-semibold text-foreground">Please sign in to view saved jobs</p>
              <Link
                href="/auth/login"
                className="mt-3 inline-block rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground"
              >
                Sign In
              </Link>
            </div>
          ) : loadingSaved ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-xs font-medium">Loading saved jobs…</p>
            </div>
          ) : savedJobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                No saved jobs yet
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Tap the bookmark icon on any job card to save it for later.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                Explore Open Roles
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {savedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  currentUserId={currentUser?.id}
                  onApplyClick={(j) => setSelectedJobForApply(j)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ APPLY MODAL ═════════════════════════════════════════════ */}
      {selectedJobForApply && (
        <ApplyJobModal
          job={selectedJobForApply}
          currentUser={currentUser}
          isOpen={!!selectedJobForApply}
          onClose={() => setSelectedJobForApply(null)}
          onSuccess={() => {
            // Update local job state to reflect has_applied
            setJobs((prev) =>
              prev.map((j) => (j.id === selectedJobForApply.id ? { ...j, has_applied: true } : j))
            )
          }}
        />
      )}

      {/* ══ EMPLOYER ATS MODAL ══════════════════════════════════════ */}
      {selectedJobForATS && (
        <EmployerATSModal
          job={selectedJobForATS}
          applications={employerApps.filter((a) => a.job_id === selectedJobForATS.id)}
          isOpen={!!selectedJobForATS}
          onClose={() => setSelectedJobForATS(null)}
          onStatusUpdated={async () => {
            const { applications: empApps } = await fetchEmployerJobsWithApplicants()
            setEmployerApps(empApps)
          }}
        />
      )}
    </div>
  )
}
