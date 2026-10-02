'use server'

// ============================================================
// lib/actions/jobs.ts
// Server actions for Hubnovo Jobs & Opportunities
// Supports: browsing, filtering, posting, applying, ATS candidate
// management, and bookmarks.
// ============================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import type {
  Job,
  JobApplication,
  JobBookmark,
  JobType,
  WorkplaceType,
  JobSalaryPeriod,
  JobStatus,
  ApplicationStatus,
} from '@/lib/types'

const PAGE_SIZE = 20

export interface JobFilterParams {
  search?: string
  category?: string
  job_type?: JobType | 'all'
  workplace_type?: WorkplaceType | 'all'
  state?: string
  salary_min?: number
  salary_max?: number
  cursor?: string
}

export interface CreateJobInput {
  title: string
  company_name: string
  company_logo_url?: string | null
  category: string
  job_type: JobType
  workplace_type: WorkplaceType
  location_state?: string | null
  location_city?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string
  salary_period?: JobSalaryPeriod
  is_salary_negotiable?: boolean
  description: string
  requirements?: string[]
  responsibilities?: string[]
  benefits?: string[]
  tags?: string[]
  application_url?: string | null
  application_deadline?: string | null
}

export interface ApplyJobInput {
  job_id: string
  full_name: string
  email: string
  phone?: string | null
  resume_url?: string | null
  cover_letter?: string | null
  portfolio_url?: string | null
  experience_years?: number
  expected_salary?: number | null
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getAuthContext() {
  const supabase = await createClient()
  const { authUser, profile } = await getCurrentUser()
  return { supabase, authUser, profile }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FETCH JOBS (with filters, pagination, saved & applied flags)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchJobs(
  filters: JobFilterParams = {},
  limit = PAGE_SIZE
): Promise<{ jobs: Job[]; nextCursor: string | null; totalCount: number }> {
  const { supabase, profile } = await getAuthContext()

  let query = supabase
    .from('jobs')
    .select(
      `
      *,
      employer:users(
        id,
        display_name,
        avatar_url,
        username,
        verified
      )
    `,
      { count: 'exact' }
    )
    .eq('status', 'active')

  if (filters.category && filters.category !== 'all' && filters.category !== 'All') {
    query = query.ilike('category', `%${filters.category}%`)
  }

  if (filters.job_type && filters.job_type !== 'all') {
    query = query.eq('job_type', filters.job_type)
  }

  if (filters.workplace_type && filters.workplace_type !== 'all') {
    query = query.eq('workplace_type', filters.workplace_type)
  }

  if (filters.state && filters.state !== 'all') {
    query = query.ilike('location_state', `%${filters.state}%`)
  }

  if (filters.salary_min) {
    query = query.gte('salary_max', filters.salary_min)
  }

  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim()
    query = query.or(
      `title.ilike.%${s}%,company_name.ilike.%${s}%,description.ilike.%${s}%,category.ilike.%${s}%`
    )
  }

  if (filters.cursor) {
    query = query.lt('created_at', filters.cursor)
  }

  query = query.order('created_at', { ascending: false }).limit(limit)

  const { data, count, error } = await query

  let rawJobs: any[] = []

  if (error) {
    console.warn('fetchJobs query notice, attempting fallback select:', error.message)
    const fallback = await supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (fallback.data) {
      rawJobs = fallback.data
    }
  } else {
    rawJobs = data ?? []
  }

  if (rawJobs.length === 0) {
    return { jobs: [], nextCursor: null, totalCount: count ?? 0 }
  }

  // Ensure employer profiles are attached if relation join was skipped
  const missingEmployerIds = rawJobs
    .filter((j) => !j.employer && j.employer_id)
    .map((j) => j.employer_id)

  if (missingEmployerIds.length > 0) {
    const { data: employersData } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, username, verified')
      .in('id', Array.from(new Set(missingEmployerIds)))

    if (employersData) {
      const empMap = new Map(employersData.map((e: any) => [e.id, e]))
      rawJobs = rawJobs.map((j) => (j.employer ? j : { ...j, employer: empMap.get(j.employer_id) ?? null }))
    }
  }

  // Fetch bookmarks & applications for the logged-in user if available
  let savedJobIds = new Set<string>()
  let appliedJobIds = new Set<string>()

  if (profile?.id && rawJobs.length > 0) {
    const jobIds = rawJobs.map((j) => j.id)

    const [savedRes, appliedRes] = await Promise.all([
      supabase
        .from('job_bookmarks')
        .select('job_id')
        .eq('user_id', profile.id)
        .in('job_id', jobIds),
      supabase
        .from('job_applications')
        .select('job_id')
        .eq('applicant_id', profile.id)
        .in('job_id', jobIds),
    ])

    if (savedRes.data) {
      savedRes.data.forEach((r: any) => savedJobIds.add(r.job_id))
    }
    if (appliedRes.data) {
      appliedRes.data.forEach((r: any) => appliedJobIds.add(r.job_id))
    }
  }

  const jobs: Job[] = rawJobs.map((j) => ({
    ...j,
    requirements: Array.isArray(j.requirements) ? j.requirements : [],
    responsibilities: Array.isArray(j.responsibilities) ? j.responsibilities : [],
    benefits: Array.isArray(j.benefits) ? j.benefits : [],
    tags: Array.isArray(j.tags) ? j.tags : [],
    is_saved: savedJobIds.has(j.id),
    has_applied: appliedJobIds.has(j.id),
  }))

  const nextCursor =
    jobs.length === limit ? jobs[jobs.length - 1].created_at : null

  return { jobs, nextCursor, totalCount: count ?? jobs.length }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. FETCH SINGLE JOB BY ID
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchJobById(id: string): Promise<Job | null> {
  const { supabase, profile } = await getAuthContext()

  let data: any = null

  const res = await supabase
    .from('jobs')
    .select(
      `
      *,
      employer:users(
        id,
        display_name,
        avatar_url,
        username,
        verified
      )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (res.data) {
    data = res.data
  } else {
    const fallback = await supabase.from('jobs').select('*').eq('id', id).maybeSingle()
    if (fallback.data) {
      data = fallback.data
      if (data.employer_id) {
        const { data: userRow } = await supabase
          .from('users')
          .select('id, display_name, avatar_url, username, verified')
          .eq('id', data.employer_id)
          .maybeSingle()
        data.employer = userRow ?? null
      }
    }
  }

  if (!data) {
    return null
  }

  // Best-effort view counter increment
  try {
    const { error: rpcErr } = await supabase.rpc('increment_job_views', { target_job_id: id })
    if (rpcErr) {
      await supabase
        .from('jobs')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id)
    }
  } catch {}

  let is_saved = false
  let has_applied = false

  if (profile?.id) {
    const [savedRes, appliedRes] = await Promise.all([
      supabase
        .from('job_bookmarks')
        .select('id')
        .eq('user_id', profile.id)
        .eq('job_id', id)
        .maybeSingle(),
      supabase
        .from('job_applications')
        .select('id')
        .eq('applicant_id', profile.id)
        .eq('job_id', id)
        .maybeSingle(),
    ])

    is_saved = !!savedRes.data
    has_applied = !!appliedRes.data
  }

  return {
    ...data,
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    is_saved,
    has_applied,
  } as Job
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST A JOB
// ─────────────────────────────────────────────────────────────────────────────

export async function createJob(
  input: CreateJobInput
): Promise<{ success: boolean; job?: Job; error?: string }> {
  const { supabase, profile } = await getAuthContext()

  if (!profile) {
    return { success: false, error: 'You must be signed in to post a job.' }
  }

  if (!input.title?.trim() || !input.company_name?.trim() || !input.description?.trim()) {
    return { success: false, error: 'Please provide job title, company name, and description.' }
  }

  const newJobPayload = {
    employer_id: profile.id,
    title: input.title.trim(),
    company_name: input.company_name.trim(),
    company_logo_url: input.company_logo_url || null,
    category: input.category || 'General',
    job_type: input.job_type || 'full_time',
    workplace_type: input.workplace_type || 'on_site',
    location_state: input.location_state || null,
    location_city: input.location_city || null,
    salary_min: input.salary_min ? Number(input.salary_min) : null,
    salary_max: input.salary_max ? Number(input.salary_max) : null,
    salary_currency: input.salary_currency || 'NGN',
    salary_period: input.salary_period || 'monthly',
    is_salary_negotiable: !!input.is_salary_negotiable,
    description: input.description.trim(),
    requirements: input.requirements || [],
    responsibilities: input.responsibilities || [],
    benefits: input.benefits || [],
    tags: input.tags || [],
    application_url: input.application_url?.trim() || null,
    application_deadline: input.application_deadline || null,
    status: 'active' as JobStatus,
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert(newJobPayload)
    .select(
      `
      *,
      employer:users!jobs_employer_id_fkey(
        id,
        display_name,
        avatar_url,
        username,
        verified
      )
    `
    )
    .single()

  if (error) {
    console.error('createJob error:', error)
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return {
        success: false,
        error: "Table 'jobs' has not been created in Supabase yet. Please run the migration SQL in your Supabase SQL editor.",
      }
    }
    return { success: false, error: error.message || 'Failed to create job posting.' }
  }

  // Increment user's jobs_created count if column exists
  try {
    await supabase
      .from('users')
      .update({ jobs_created: ((profile as any).jobs_created || 0) + 1 })
      .eq('id', profile.id)
  } catch {}

  revalidatePath('/app/market/jobs')
  revalidatePath('/app/market')

  return { success: true, job: data as Job }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPDATE JOB
// ─────────────────────────────────────────────────────────────────────────────

export async function updateJob(
  id: string,
  input: Partial<CreateJobInput> & { status?: JobStatus }
): Promise<{ success: boolean; error?: string }> {
  const { supabase, profile } = await getAuthContext()

  if (!profile) return { success: false, error: 'Unauthorized' }

  // Verify ownership
  const { data: existing } = await supabase
    .from('jobs')
    .select('employer_id')
    .eq('id', id)
    .maybeSingle()

  if (!existing || existing.employer_id !== profile.id) {
    return { success: false, error: 'You do not have permission to update this job.' }
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (input.title !== undefined) updateData.title = input.title.trim()
  if (input.company_name !== undefined) updateData.company_name = input.company_name.trim()
  if (input.company_logo_url !== undefined) updateData.company_logo_url = input.company_logo_url
  if (input.category !== undefined) updateData.category = input.category
  if (input.job_type !== undefined) updateData.job_type = input.job_type
  if (input.workplace_type !== undefined) updateData.workplace_type = input.workplace_type
  if (input.location_state !== undefined) updateData.location_state = input.location_state
  if (input.location_city !== undefined) updateData.location_city = input.location_city
  if (input.salary_min !== undefined) updateData.salary_min = input.salary_min ? Number(input.salary_min) : null
  if (input.salary_max !== undefined) updateData.salary_max = input.salary_max ? Number(input.salary_max) : null
  if (input.salary_currency !== undefined) updateData.salary_currency = input.salary_currency
  if (input.salary_period !== undefined) updateData.salary_period = input.salary_period
  if (input.is_salary_negotiable !== undefined) updateData.is_salary_negotiable = input.is_salary_negotiable
  if (input.description !== undefined) updateData.description = input.description.trim()
  if (input.requirements !== undefined) updateData.requirements = input.requirements
  if (input.responsibilities !== undefined) updateData.responsibilities = input.responsibilities
  if (input.benefits !== undefined) updateData.benefits = input.benefits
  if (input.tags !== undefined) updateData.tags = input.tags
  if (input.application_url !== undefined) updateData.application_url = input.application_url
  if (input.application_deadline !== undefined) updateData.application_deadline = input.application_deadline
  if (input.status !== undefined) updateData.status = input.status

  const { error } = await supabase.from('jobs').update(updateData).eq('id', id)

  if (error) {
    console.error('updateJob error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/app/market/jobs')
  revalidatePath(`/app/market/jobs/${id}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TOGGLE / DELETE JOB
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteJob(id: string): Promise<{ success: boolean; error?: string }> {
  const { supabase, profile } = await getAuthContext()
  if (!profile) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)
    .eq('employer_id', profile.id)

  if (error) {
    console.error('deleteJob error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/app/market/jobs')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. APPLY FOR A JOB
// ─────────────────────────────────────────────────────────────────────────────

export async function applyForJob(
  input: ApplyJobInput
): Promise<{ success: boolean; application?: JobApplication; error?: string }> {
  const { supabase, profile } = await getAuthContext()

  if (!profile) {
    return { success: false, error: 'You must be signed in to apply for a job.' }
  }

  if (!input.full_name?.trim() || !input.email?.trim()) {
    return { success: false, error: 'Full name and email are required.' }
  }

  // 1. Fetch job to verify status and get employer id
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, title, employer_id, status, applications_count')
    .eq('id', input.job_id)
    .maybeSingle()

  if (jobErr || !job) {
    return { success: false, error: 'Job posting not found.' }
  }

  if (job.status !== 'active') {
    return { success: false, error: 'This job posting is no longer accepting applications.' }
  }

  if (job.employer_id === profile.id) {
    return { success: false, error: 'You cannot apply to your own job posting.' }
  }

  // 2. Check if already applied
  const { data: existingApp } = await supabase
    .from('job_applications')
    .select('id')
    .eq('job_id', input.job_id)
    .eq('applicant_id', profile.id)
    .maybeSingle()

  if (existingApp) {
    return { success: false, error: 'You have already applied for this position.' }
  }

  // 3. Insert application
  const applicationPayload = {
    job_id: input.job_id,
    applicant_id: profile.id,
    full_name: input.full_name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    resume_url: input.resume_url?.trim() || null,
    cover_letter: input.cover_letter?.trim() || null,
    portfolio_url: input.portfolio_url?.trim() || null,
    experience_years: input.experience_years ? Number(input.experience_years) : 0,
    expected_salary: input.expected_salary ? Number(input.expected_salary) : null,
    status: 'submitted' as ApplicationStatus,
  }

  const { data: newApp, error: appErr } = await supabase
    .from('job_applications')
    .insert(applicationPayload)
    .select('*')
    .single()

  if (appErr) {
    console.error('applyForJob error:', appErr)
    if (appErr.message?.includes('schema cache') || appErr.message?.includes('cover_letter') || appErr.code === '23503') {
      return {
        success: false,
        error: "Job applications table needs to be updated. Please run migration 20261002170000_recreate_job_applications_for_jobs.sql in your Supabase SQL editor.",
      }
    }
    return { success: false, error: appErr.message || 'Failed to submit application.' }
  }

  // 4. Increment application count on job
  try {
    await supabase
      .from('jobs')
      .update({ applications_count: (job.applications_count || 0) + 1 })
      .eq('id', input.job_id)
  } catch {}

  // 5. Send in-app notification to employer (silent on failure)
  try {
    await supabase.from('notifications').insert({
      user_id: job.employer_id,
      actor_id: profile.id,
      type: 'job_application',
      reference_id: input.job_id,
      read: false,
    })
  } catch (err) {
    console.warn('Could not insert application notification:', err)
  }

  revalidatePath(`/app/market/jobs/${input.job_id}`)
  revalidatePath('/app/market/jobs')

  return { success: true, application: newApp as JobApplication }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. FETCH MY APPLICATIONS (Job seeker view)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchMyApplications(): Promise<JobApplication[]> {
  const { supabase, profile } = await getAuthContext()
  if (!profile) return []

  const { data, error } = await supabase
    .from('job_applications')
    .select(
      `
      *,
      job:jobs(
        id,
        title,
        company_name,
        company_logo_url,
        category,
        job_type,
        workplace_type,
        location_state,
        location_city,
        salary_min,
        salary_max,
        salary_currency,
        salary_period,
        status,
        created_at
      )
    `
    )
    .eq('applicant_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchMyApplications error:', error)
    return []
  }

  return (data ?? []) as JobApplication[]
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. FETCH EMPLOYER JOBS & APPLICANTS (Employer ATS view)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchEmployerJobsWithApplicants(): Promise<{
  jobs: Job[]
  applications: JobApplication[]
}> {
  const { supabase, profile } = await getAuthContext()
  if (!profile) return { jobs: [], applications: [] }

  // 1. Fetch all jobs posted by this employer
  const { data: jobsData, error: jobsErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('employer_id', profile.id)
    .order('created_at', { ascending: false })

  if (jobsErr || !jobsData) {
    console.error('fetchEmployerJobs error:', jobsErr)
    return { jobs: [], applications: [] }
  }

  const jobs = jobsData as Job[]
  if (jobs.length === 0) return { jobs: [], applications: [] }

  const jobIds = jobs.map((j) => j.id)

  // 2. Fetch all applications for these jobs
  let apps: JobApplication[] = []

  const { data: appsData, error: appsErr } = await supabase
    .from('job_applications')
    .select(
      `
      *,
      applicant:users(
        id,
        display_name,
        avatar_url,
        username,
        email
      )
    `
    )
    .in('job_id', jobIds)
    .order('created_at', { ascending: false })

  if (appsErr) {
    // Fallback: query without relational join, then attach applicants
    const { data: fallbackData } = await supabase
      .from('job_applications')
      .select('*')
      .in('job_id', jobIds)
      .order('created_at', { ascending: false })

    if (fallbackData && fallbackData.length > 0) {
      const applicantIds = Array.from(new Set(fallbackData.map((a: any) => a.applicant_id).filter(Boolean)))
      let usersMap = new Map<string, any>()
      if (applicantIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, display_name, avatar_url, username, email')
          .in('id', applicantIds)
        usersMap = new Map((usersData ?? []).map((u: any) => [u.id, u]))
      }
      apps = fallbackData.map((a: any) => ({
        ...a,
        applicant: usersMap.get(a.applicant_id) ?? null,
      })) as JobApplication[]
    }
  } else {
    apps = (appsData ?? []) as JobApplication[]
  }

  // Attach job details from already-fetched jobs
  const jobsMap = new Map(jobs.map((j) => [j.id, j]))
  const enrichedApplications = apps.map((a) => ({
    ...a,
    job: a.job ?? jobsMap.get(a.job_id) ?? null,
  }))

  return { jobs, applications: enrichedApplications }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. UPDATE APPLICATION STATUS (Employer action)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  employerNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, profile } = await getAuthContext()
  if (!profile) return { success: false, error: 'Unauthorized' }

  // 1. Verify that current user is the employer of this job
  const { data: application, error: appErr } = await supabase
    .from('job_applications')
    .select('id, applicant_id, job_id')
    .eq('id', applicationId)
    .maybeSingle()

  if (appErr || !application) {
    return { success: false, error: 'Application not found.' }
  }

  // Check job ownership
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, employer_id')
    .eq('id', application.job_id)
    .maybeSingle()

  if (!job || job.employer_id !== profile.id) {
    return { success: false, error: 'You are not authorized to update this application.' }
  }

  // 2. Update status and notes
  const updatePayload: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }
  if (employerNotes !== undefined) {
    updatePayload.employer_notes = employerNotes
  }

  const { error: updErr } = await supabase
    .from('job_applications')
    .update(updatePayload)
    .eq('id', applicationId)

  if (updErr) {
    console.error('updateApplicationStatus error:', updErr)
    return { success: false, error: updErr.message }
  }

  // 3. Notify applicant about status update (silent on failure)
  try {
    await supabase.from('notifications').insert({
      user_id: application.applicant_id,
      actor_id: profile.id,
      type: 'job_status_update',
      reference_id: application.job_id,
      read: false,
    })
  } catch {}

  revalidatePath('/app/market/jobs')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. BOOKMARKS / SAVED JOBS
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleSaveJob(jobId: string): Promise<{ isSaved: boolean; error?: string }> {
  const { supabase, profile } = await getAuthContext()
  if (!profile) return { isSaved: false, error: 'Please sign in to save jobs.' }

  const { data: existing } = await supabase
    .from('job_bookmarks')
    .select('id')
    .eq('user_id', profile.id)
    .eq('job_id', jobId)
    .maybeSingle()

  if (existing) {
    await supabase.from('job_bookmarks').delete().eq('id', existing.id)
    revalidatePath('/app/market/jobs')
    return { isSaved: false }
  } else {
    await supabase.from('job_bookmarks').insert({
      user_id: profile.id,
      job_id: jobId,
    })
    revalidatePath('/app/market/jobs')
    return { isSaved: true }
  }
}

export async function fetchSavedJobs(): Promise<Job[]> {
  const { supabase, profile } = await getAuthContext()
  if (!profile) return []

  const { data, error } = await supabase
    .from('job_bookmarks')
    .select(
      `
      job:jobs(
        *,
        employer:users!jobs_employer_id_fkey(
          id,
          display_name,
          avatar_url,
          username,
          verified
        )
      )
    `
    )
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('fetchSavedJobs error:', error)
    return []
  }

  return data
    .map((row: any) => row.job)
    .filter(Boolean)
    .map((j: any) => ({
      ...j,
      requirements: Array.isArray(j.requirements) ? j.requirements : [],
      responsibilities: Array.isArray(j.responsibilities) ? j.responsibilities : [],
      benefits: Array.isArray(j.benefits) ? j.benefits : [],
      tags: Array.isArray(j.tags) ? j.tags : [],
      is_saved: true,
    })) as Job[]
}
