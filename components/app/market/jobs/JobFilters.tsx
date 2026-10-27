'use client'

import { Search, MapPin, Briefcase, Laptop, Filter, X } from 'lucide-react'
import type { JobType, WorkplaceType } from '@/lib/types'

const NIGERIAN_STATES = [
  'All States',
  'Lagos',
  'Abuja (FCT)',
  'Rivers',
  'Oyo',
  'Kano',
  'Enugu',
  'Delta',
  'Ogun',
  'Kaduna',
  'Edo',
  'Anambra',
  'Akwa Ibom',
  'Imo',
  'Plateau',
  'Cross River',
  'Osun',
  'Ondo',
  'Kwara',
]

interface JobFiltersProps {
  search: string
  onSearchChange: (val: string) => void
  onSearchSubmit: (e: React.FormEvent) => void
  selectedJobType: JobType | 'all'
  onJobTypeChange: (val: JobType | 'all') => void
  selectedWorkplace: WorkplaceType | 'all'
  onWorkplaceChange: (val: WorkplaceType | 'all') => void
  selectedState: string
  onStateChange: (val: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export default function JobFilters({
  search,
  onSearchChange,
  onSearchSubmit,
  selectedJobType,
  onJobTypeChange,
  selectedWorkplace,
  onWorkplaceChange,
  selectedState,
  onStateChange,
  onClearFilters,
  hasActiveFilters,
}: JobFiltersProps) {
  const workplaceOptions: { label: string; value: WorkplaceType | 'all' }[] = [
    { label: 'All Workplaces', value: 'all' },
    { label: 'Remote', value: 'remote' },
    { label: 'On-site', value: 'on_site' },
    { label: 'Hybrid', value: 'hybrid' },
  ]

  const jobTypeOptions: { label: string; value: JobType | 'all' }[] = [
    { label: 'All Roles', value: 'all' },
    { label: 'Full-time', value: 'full_time' },
    { label: 'Part-time', value: 'part_time' },
    { label: 'Contract', value: 'contract' },
    { label: 'Internship', value: 'internship' },
    { label: 'Freelance / Gig', value: 'freelance' },
  ]

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      {/* Search Bar */}
      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search job title, skills, keyword or company…"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      {/* Filter Row: Workplace Chips, Job Type Dropdown, State Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Workplace pill toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Laptop className="hidden h-3.5 w-3.5 text-muted-foreground sm:inline-block" />
          {workplaceOptions.map((opt) => {
            const active = selectedWorkplace === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onWorkplaceChange(opt.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Dropdowns on right */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Job Type selector */}
          <div className="relative">
            <select
              value={selectedJobType}
              onChange={(e) => onJobTypeChange(e.target.value as any)}
              className="h-9 rounded-xl border border-border bg-background px-3 pr-8 text-xs font-medium text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary"
            >
              {jobTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* State selector */}
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => onStateChange(e.target.value)}
              className="h-9 rounded-xl border border-border bg-background px-3 pr-8 text-xs font-medium text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary"
            >
              {NIGERIAN_STATES.map((state) => (
                <option
                  key={state}
                  value={state === 'All States' ? 'all' : state}
                >
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button if active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-destructive/30 bg-destructive/10 px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
