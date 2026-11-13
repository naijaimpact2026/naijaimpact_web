'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, ChevronRight, Hammer, Search } from 'lucide-react'
import { naira, type ArtisanJob } from '@/lib/artisan-jobs'
import { JobStatusBadge } from './JobDialogs'

type Tab = 'hired' | 'work'

// Jobs that need the viewer to do something, per side.
const NEEDS_ME: Record<Tab, ArtisanJob['status'][]> = {
  hired: ['quoted', 'submitted'],
  work: ['requested', 'funded', 'in_progress'],
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

function JobRow({ job, tab }: { job: ArtisanJob; tab: Tab }) {
  const other = tab === 'hired' ? job.artisan : job.customer
  const name = other?.display_name || (other?.username ? `@${other.username}` : 'Hubnovo user')
  const needsMe = NEEDS_ME[tab].includes(job.status)

  return (
    <Link
      href={`/app/artisans/jobs/${job.id}`}
      className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:px-5"
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-sm font-bold text-primary">
        {other?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={other.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
        {needsMe && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {name} · {fmtDate(job.updated_at)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {job.quote_kobo ? <span className="text-sm font-bold text-foreground">{naira(job.quote_kobo)}</span> : null}
        <JobStatusBadge status={job.status} />
      </div>
      <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
    </Link>
  )
}

export default function JobsListClient({ hired, work }: { hired: ArtisanJob[]; work: ArtisanJob[] }) {
  // Artisans with incoming work land on their requests first.
  const [tab, setTab] = useState<Tab>(work.length > 0 && hired.length === 0 ? 'work' : 'hired')
  const jobs = tab === 'hired' ? hired : work

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'hired', label: 'I hired', count: hired.filter((j) => NEEDS_ME.hired.includes(j.status)).length },
    { id: 'work', label: 'My work', count: work.filter((j) => NEEDS_ME.work.includes(j.status)).length },
  ]

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">My jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Artisans you&apos;ve hired, and work you&apos;ve been hired for.</p>
      </div>

      <div className="inline-flex rounded-2xl border border-border bg-muted/50 p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              {tab === 'hired' ? <Briefcase className="h-5 w-5" /> : <Hammer className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {tab === 'hired' ? "You haven't hired anyone yet" : 'No work requests yet'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tab === 'hired'
                  ? 'Find a trusted artisan and send a request. You only pay when you accept their quote.'
                  : 'When a customer requests your service, it shows up here for you to quote.'}
              </p>
            </div>
            {tab === 'hired' && (
              <Link
                href="/app/artisans"
                className="mt-1 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Search className="h-4 w-4" /> Find an artisan
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {jobs.map((j) => (
              <JobRow key={j.id} job={j} tab={tab} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
