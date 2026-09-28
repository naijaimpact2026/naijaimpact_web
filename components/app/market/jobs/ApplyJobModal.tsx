'use client'

import { useState } from 'react'
import {
  X,
  Send,
  Loader2,
  FileText,
  Briefcase,
  Building2,
  CheckCircle2,
  Link as LinkIcon,
} from 'lucide-react'
import { applyForJob } from '@/lib/actions/jobs'
import { toast } from '@/components/toast'
import type { Job, User } from '@/lib/types'

interface ApplyJobModalProps {
  job: Job
  currentUser: User | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ApplyJobModal({
  job,
  currentUser,
  isOpen,
  onClose,
  onSuccess,
}: ApplyJobModalProps) {
  const [fullName, setFullName] = useState(
    currentUser?.fullname || currentUser?.display_name || ''
  )
  const [email, setEmail] = useState(currentUser?.email || '')
  const [phone, setPhone] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState(currentUser?.website_url || '')
  const [experienceYears, setExperienceYears] = useState(1)
  const [expectedSalary, setExpectedSalary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      toast.error('Please provide your full name and email.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await applyForJob({
        job_id: job.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        resume_url: resumeUrl.trim() || null,
        cover_letter: coverLetter.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
        experience_years: Number(experienceYears) || 0,
        expected_salary: expectedSalary ? Number(expectedSalary) : null,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        setIsSubmitted(true)
        toast.success('Your application has been submitted successfully!')
        onSuccess?.()
      }
    } catch {
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
              Application Submitted!
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your application for <span className="font-semibold text-foreground">{job.title}</span> at{' '}
              <span className="font-semibold text-foreground">{job.company_name}</span> has been received.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You can track your status in &ldquo;My Applications&rdquo;.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-2xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform active:scale-95 hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* Header info */}
            <div className="border-b border-border/80 pb-4">
              <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                Job Application
              </span>
              <h2 className="mt-1.5 font-display text-xl font-bold text-foreground">
                Apply for {job.title}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{job.company_name}</span>
                <span>•</span>
                <span>{job.location_state || 'Nigeria'}</span>
              </div>
            </div>

            {/* Application Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              {/* Full Name & Email */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chinedu Okafor"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-foreground">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. chinedu@example.com"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Phone & Experience */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 801 234 5678"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-foreground">
                    Years of Relevant Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Resume / CV Link */}
              <div>
                <label className="mb-1 flex items-center justify-between font-semibold text-foreground">
                  <span>Resume / CV Link</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    Google Drive, Dropbox, Notion, etc.
                  </span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Portfolio / LinkedIn Link */}
              <div>
                <label className="mb-1 block font-semibold text-foreground">
                  Portfolio / GitHub / LinkedIn URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://github.com/yourhandle or portfolio"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Expected Salary (Optional) */}
              <div>
                <label className="mb-1 block font-semibold text-foreground">
                  Expected Monthly Salary (₦) <span className="font-normal text-muted-foreground">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  placeholder="e.g. 350000"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              {/* Cover Letter / Pitch */}
              <div>
                <label className="mb-1 block font-semibold text-foreground">
                  Cover Letter / Brief Pitch
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Why are you a great fit for this role? Share relevant highlights and achievements…"
                  className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-transform active:scale-95 hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
