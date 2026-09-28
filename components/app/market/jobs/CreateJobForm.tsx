'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  CheckCircle2,
  Globe,
  Calendar,
} from 'lucide-react'
import { createJob } from '@/lib/actions/jobs'
import { toast } from '@/components/toast'
import type { JobType, WorkplaceType, JobSalaryPeriod, User } from '@/lib/types'

const CATEGORIES = [
  'Technology & Software',
  'Design & Creative',
  'Marketing & Sales',
  'Finance & Accounting',
  'Operations & Logistics',
  'Customer Support & Success',
  'Artisan & Skilled Trades',
  'Healthcare & Wellness',
  'Education & Training',
  'Construction & Real Estate',
  'Agriculture & Agribusiness',
  'Other',
]

const NIGERIAN_STATES = [
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
  'Other',
]

const POPULAR_BENEFITS = [
  'Health Insurance',
  'Performance Bonus',
  'Flexible Hours',
  'Work From Home',
  'Paid Time Off',
  'Transport Allowance',
  'Retirement Pension',
  'Learning & Development Stipend',
]

interface CreateJobFormProps {
  currentUser: User
}

export default function CreateJobForm({ currentUser }: CreateJobFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Form Fields
  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState(
    currentUser.display_name || currentUser.fullname || ''
  )
  const [companyLogoUrl, setCompanyLogoUrl] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [jobType, setJobType] = useState<JobType>('full_time')
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>('on_site')
  const [locationState, setLocationState] = useState('Lagos')
  const [locationCity, setLocationCity] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [salaryPeriod, setSalaryPeriod] = useState<JobSalaryPeriod>('monthly')
  const [isSalaryNegotiable, setIsSalaryNegotiable] = useState(false)
  const [description, setDescription] = useState('')

  // Dynamic Lists
  const [responsibilities, setResponsibilities] = useState<string[]>([''])
  const [requirements, setRequirements] = useState<string[]>([''])
  const [benefits, setBenefits] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // Application Settings
  const [applicationUrl, setApplicationUrl] = useState('')
  const [applicationDeadline, setApplicationDeadline] = useState('')

  // Responsibilities Handlers
  const handleAddResponsibility = () => setResponsibilities((prev) => [...prev, ''])
  const handleUpdateResponsibility = (index: number, val: string) => {
    setResponsibilities((prev) => {
      const copy = [...prev]
      copy[index] = val
      return copy
    })
  }
  const handleRemoveResponsibility = (index: number) => {
    setResponsibilities((prev) => prev.filter((_, i) => i !== index))
  }

  // Requirements Handlers
  const handleAddRequirement = () => setRequirements((prev) => [...prev, ''])
  const handleUpdateRequirement = (index: number, val: string) => {
    setRequirements((prev) => {
      const copy = [...prev]
      copy[index] = val
      return copy
    })
  }
  const handleRemoveRequirement = (index: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index))
  }

  // Benefits Handler
  const handleToggleBenefit = (benefit: string) => {
    setBenefits((prev) =>
      prev.includes(benefit) ? prev.filter((b) => b !== benefit) : [...prev, benefit]
    )
  }

  // Tags Handler
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const clean = tagInput.trim().replace(/^#/, '')
      if (clean && !tags.includes(clean) && tags.length < 8) {
        setTags((prev) => [...prev, clean])
        setTagInput('')
      }
    }
  }
  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !companyName.trim() || !description.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    try {
      const res = await createJob({
        title: title.trim(),
        company_name: companyName.trim(),
        company_logo_url: companyLogoUrl.trim() || null,
        category,
        job_type: jobType,
        workplace_type: workplaceType,
        location_state: locationState,
        location_city: locationCity.trim() || null,
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
        salary_currency: 'NGN',
        salary_period: salaryPeriod,
        is_salary_negotiable: isSalaryNegotiable,
        description: description.trim(),
        responsibilities: responsibilities.filter((r) => r.trim().length > 0),
        requirements: requirements.filter((r) => r.trim().length > 0),
        benefits,
        tags,
        application_url: applicationUrl.trim() || null,
        application_deadline: applicationDeadline || null,
      })

      if (res.error || !res.job) {
        toast.error(res.error || 'Failed to post job')
      } else {
        toast.success('Job opening posted successfully!')
        router.push(`/app/market/jobs/${res.job.id}`)
      }
    } catch {
      toast.error('An unexpected error occurred while posting this job.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Back button */}
      <div>
        <Link
          href="/app/market/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          Employer Dashboard
        </span>
        <h1 className="mt-2 font-display text-2xl font-black text-foreground sm:text-3xl">
          Post a Job Opening
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reach thousands of qualified job seekers, artisans, and professionals across Hubnovo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Role Overview */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">1. Role & Company Overview</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Job Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Company / Organization Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Hubnovo Technologies"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Job Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Company Logo URL (Optional)
              </label>
              <input
                type="url"
                value={companyLogoUrl}
                onChange={(e) => setCompanyLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Employment Type & Workplace */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Employment Type
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance / Gig</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Workplace Model
              </label>
              <select
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value as WorkplaceType)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="remote">Remote (Anywhere)</option>
                <option value="on_site">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Location State & City */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                State / Region
              </label>
              <select
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                City / Area (Optional)
              </label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g. Lekki, Ikeja, Garki, Wuse"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Compensation */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">2. Compensation & Pay</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Minimum Pay (₦)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="e.g. 200000"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Maximum Pay (₦)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="e.g. 350000"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Payment Period
              </label>
              <select
                value={salaryPeriod}
                onChange={(e) => setSalaryPeriod(e.target.value as JobSalaryPeriod)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="monthly">Per Month</option>
                <option value="yearly">Per Year</option>
                <option value="hourly">Per Hour</option>
                <option value="project">Per Project</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isSalaryNegotiable}
              onChange={(e) => setIsSalaryNegotiable(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span>Salary is negotiable / open to discussion</span>
          </label>
        </div>

        {/* Section 3: Job Description & Details */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-5">
          <h2 className="font-display text-lg font-bold text-foreground">3. Job Description & Specifics</h2>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              Role Description <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive summary of the role, day-to-day context, team dynamics, and expectations…"
              className="w-full resize-none rounded-xl border border-border bg-background p-3.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          {/* Key Responsibilities */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Key Responsibilities (Add bullet points)
              </label>
              <button
                type="button"
                onClick={handleAddResponsibility}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {responsibilities.map((resp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => handleUpdateResponsibility(idx, e.target.value)}
                    placeholder={`e.g. Build and scale customer-facing web applications`}
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                  {responsibilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveResponsibility(idx)}
                      className="p-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Requirements & Qualifications
              </label>
              <button
                type="button"
                onClick={handleAddRequirement}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleUpdateRequirement(idx, e.target.value)}
                    placeholder={`e.g. 3+ years experience with Next.js and TypeScript`}
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                  {requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(idx)}
                      className="p-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Perks & Benefits */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground">
              Select Perks & Benefits
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_BENEFITS.map((benefit) => {
                const selected = benefits.includes(benefit)
                return (
                  <button
                    key={benefit}
                    type="button"
                    onClick={() => handleToggleBenefit(benefit)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      selected
                        ? 'border border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {benefit}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              Skills / Keyword Tags (Press Enter to add, max 8)
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
              {tags.length < 8 && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={tags.length === 0 ? 'Type tag and press enter…' : 'Add another…'}
                  className="min-w-[120px] flex-1 bg-transparent px-2 py-1 text-xs text-foreground outline-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Application Settings */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">4. Application Settings</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                External Application URL (Optional)
              </label>
              <input
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder="Leave blank to use Hubnovo's In-App ATS"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                If left blank, applicants submit CVs and pitches directly on Hubnovo.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Application Deadline (Optional)
              </label>
              <input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/app/market/jobs"
            className="rounded-2xl border border-border px-6 py-3 text-xs font-bold text-foreground hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform active:scale-95 hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing Role…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Publish Job Opening
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
