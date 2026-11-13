'use server'

// Artisan hiring with escrow. Status changes that move money run inside the
// SQL functions in 20261108120000_artisan_jobs_escrow.sql (row locks,
// idempotent ledger refs); the rest are conditional updates here. Every
// action authenticates the user and checks they are the right party.

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { checkWalletPin } from '@/lib/wallet-pin'
import { rateLimit, RATE_LIMITED } from '@/lib/rate-limit'
import { normalizeRole } from '@/lib/modushive/config'
import {
  PLATFORM_FEE_BPS,
  type ArtisanJob,
  type DisputeOutcome,
  type DisputeReason,
  type JobDetail,
  type JobDispute,
  type JobParty,
} from '@/lib/artisan-jobs'

export type JobActionResult<T = void> = { success: true; data?: T } | { success: false; error: string }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PARTY_COLS = 'id, display_name, username, avatar_url'
const MIN_QUOTE_NGN = 100
const MAX_QUOTE_NGN = 50_000_000

// Messages raised by the SQL functions that are safe to show as-is.
const SQL_MESSAGES = [
  'Insufficient balance',
  'Job is not awaiting payment',
  'Only the customer can approve',
  'This job cannot be approved now',
  'Work has started; open a dispute instead',
  'This job cannot be disputed now',
  'You can open a dispute 3 days after submitting if the customer has not responded',
  'Write a short reason for the decision',
  'Use release or refund instead',
  'Not your job',
  'Admins only',
]

function friendly(err: { message?: string; code?: string } | null, fallback: string): string {
  const msg = err?.message ?? ''
  if (err?.code === '23505') return 'This job already has an open dispute.'
  const known = SQL_MESSAGES.find((m) => msg.includes(m))
  if (known === 'Insufficient balance') return 'Your wallet balance is too low. Add money and try again.'
  return known ?? fallback
}

async function me() {
  const { authUser, profile } = await getCurrentUser()
  if (!authUser || !profile) throw new Error('Please sign in again.')
  return { authUser, profile, isAdmin: normalizeRole(profile.role) === 'admin' }
}

function refresh(jobId?: string) {
  revalidatePath('/app/artisans/jobs')
  if (jobId) revalidatePath(`/app/artisans/jobs/${jobId}`)
  revalidatePath('/app/wallet')
}

/** Best-effort notification; never blocks the action. */
async function notify(userId: string, actorId: string, jobId: string) {
  const { error } = await createServiceClient().from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type: 'artisan_job',
    reference_id: jobId,
    read: false,
  })
  if (error) console.error('artisan job notification failed:', error.message)
}

async function logEvent(jobId: string, actorId: string, kind: string, note?: string) {
  await createServiceClient().from('artisan_job_events').insert({ job_id: jobId, actor_id: actorId, kind, note: note ?? null })
}

async function loadJob(jobId: string): Promise<ArtisanJob | null> {
  if (!UUID_RE.test(jobId)) return null
  const { data } = await createServiceClient().from('artisan_jobs').select('*').eq('id', jobId).maybeSingle()
  return (data as ArtisanJob) ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer: request a job from an artisan's service listing
// ─────────────────────────────────────────────────────────────────────────────

export async function requestJob(input: {
  listingId: string
  title: string
  description: string
  address?: string
  preferredDate?: string
  budgetNGN?: number
}): Promise<JobActionResult<{ jobId: string }>> {
  try {
    const { profile } = await me()
    if (!(await rateLimit(`job-request:${profile.id}`, 10, 3600))) return { success: false, error: RATE_LIMITED }

    const title = input.title?.trim() ?? ''
    const description = input.description?.trim() ?? ''
    const address = input.address?.trim() || null
    if (title.length < 3 || title.length > 120) return { success: false, error: 'Give the job a short title (3–120 characters).' }
    if (description.length < 10 || description.length > 2000) {
      return { success: false, error: 'Describe the job in at least 10 characters.' }
    }
    if (address && address.length > 300) return { success: false, error: 'Address is too long.' }
    const preferredDate = input.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(input.preferredDate) ? input.preferredDate : null
    const budget = input.budgetNGN && input.budgetNGN > 0 ? Math.round(input.budgetNGN * 100) : null

    if (!UUID_RE.test(input.listingId)) return { success: false, error: 'Service not found.' }
    const admin = createServiceClient()
    const { data: listing } = await admin
      .from('nm_listings')
      .select('id, user_id, is_active')
      .eq('id', input.listingId)
      .maybeSingle()
    if (!listing || listing.is_active === false) return { success: false, error: 'This service is no longer available.' }

    // nm_listings.user_id is the artisan's auth id; jobs use users.id.
    const { data: artisan } = await admin
      .from('users')
      .select('id')
      .or(`auth_id.eq.${listing.user_id},id.eq.${listing.user_id}`)
      .limit(1)
      .maybeSingle()
    if (!artisan) return { success: false, error: 'This artisan account could not be found.' }
    if (artisan.id === profile.id) return { success: false, error: 'You cannot hire yourself.' }

    const { data: job, error } = await admin
      .from('artisan_jobs')
      .insert({
        customer_id: profile.id,
        artisan_id: artisan.id,
        listing_id: listing.id,
        title,
        description,
        address,
        preferred_date: preferredDate,
        budget_kobo: budget,
      })
      .select('id')
      .single()
    if (error || !job) {
      console.error('requestJob error:', error)
      return { success: false, error: 'Could not send your request. Please try again.' }
    }

    await logEvent(job.id, profile.id, 'requested')
    await notify(artisan.id, profile.id, job.id)
    refresh(job.id)
    return { success: true, data: { jobId: job.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Something went wrong.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Artisan: quote, start, submit
// ─────────────────────────────────────────────────────────────────────────────

export async function quoteJob(jobId: string, amountNGN: number, note?: string): Promise<JobActionResult> {
  try {
    const { profile } = await me()
    if (!Number.isFinite(amountNGN) || amountNGN < MIN_QUOTE_NGN || amountNGN > MAX_QUOTE_NGN) {
      return { success: false, error: `Quote must be between ₦${MIN_QUOTE_NGN} and ₦${MAX_QUOTE_NGN.toLocaleString()}.` }
    }
    const cleanNote = note?.trim().slice(0, 1000) || null
    const job = await loadJob(jobId)
    if (!job || job.artisan_id !== profile.id) return { success: false, error: 'Job not found.' }

    // Re-quoting is allowed until the customer pays.
    const { data, error } = await createServiceClient()
      .from('artisan_jobs')
      .update({
        quote_kobo: Math.round(amountNGN * 100),
        quote_note: cleanNote,
        fee_bps: PLATFORM_FEE_BPS,
        status: 'quoted',
        quoted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('artisan_id', profile.id)
      .in('status', ['requested', 'quoted'])
      .select('id')
    if (error || !data?.length) return { success: false, error: 'This job can no longer be quoted.' }

    await logEvent(jobId, profile.id, 'quoted')
    await notify(job.customer_id, profile.id, jobId)
    refresh(jobId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Something went wrong.' }
  }
}

async function artisanStep(
  jobId: string,
  from: string[],
  patch: Record<string, unknown>,
  event: string,
  note?: string
): Promise<JobActionResult> {
  try {
    const { profile } = await me()
    const job = await loadJob(jobId)
    if (!job || job.artisan_id !== profile.id) return { success: false, error: 'Job not found.' }

    const { data, error } = await createServiceClient()
      .from('artisan_jobs')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('artisan_id', profile.id)
      .in('status', from)
      .select('id')
    if (error || !data?.length) return { success: false, error: 'This step is not available right now.' }

    await logEvent(jobId, profile.id, event, note)
    await notify(job.customer_id, profile.id, jobId)
    refresh(jobId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Something went wrong.' }
  }
}

export async function startJob(jobId: string): Promise<JobActionResult> {
  return artisanStep(jobId, ['funded'], { status: 'in_progress', started_at: new Date().toISOString() }, 'started')
}

export async function submitJob(jobId: string, note?: string): Promise<JobActionResult> {
  return artisanStep(
    jobId,
    ['funded', 'in_progress'],
    { status: 'submitted', submitted_at: new Date().toISOString() },
    'submitted',
    note?.trim().slice(0, 500) || undefined
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Money: fund, approve (release), cancel
// ─────────────────────────────────────────────────────────────────────────────

/** Customer accepts the quote and pays it from their wallet into escrow. */
export async function fundJob(jobId: string, pin: string): Promise<JobActionResult> {
  try {
    const { profile } = await me()
    if (!(await rateLimit(`job-money:${profile.id}`, 10, 600))) return { success: false, error: RATE_LIMITED }
    const job = await loadJob(jobId)
    if (!job || job.customer_id !== profile.id) return { success: false, error: 'Job not found.' }

    const pinResult = await checkWalletPin(profile.id, pin)
    if (!pinResult.ok) return { success: false, error: pinResult.error }

    const { error } = await createServiceClient().rpc('escrow_fund_job', { p_job_id: jobId, p_customer: profile.id })
    if (error) {
      console.error('escrow_fund_job error:', error)
      return { success: false, error: friendly(error, 'Payment failed. Please try again.') }
    }

    await notify(job.artisan_id, profile.id, jobId)
    refresh(jobId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Something went wrong.' }
  }
}

/** Customer approves the work; escrow is paid to the artisan minus the fee. */
export async function approveJob(jobId: string, pin: string): Promise<JobActionResult> {
  try {
    const { profile } = await me()
    if (!(await rateLimit(`job-money:${profile.id}`, 10, 600))) return { success: false, error: RATE_LIMITED }
    const job = await loadJob(jobId)
    if (!job || job.customer_id !== profile.id) return { success: false, error: 'Job not found.' }

    const pinResult = await checkWalletPin(profile.id, pin)
    if (!pinResult.ok) return { success: false, error: pinResult.error }

    const { error } = await createServiceClient().rpc('escrow_release_job', { p_job_id: jobId, p_customer: profile.id })
    if (error) {
      console.error('escrow_release_job error:', error)
      return { success: false, error: friendly(error, 'Could not release payment. Please try again.') }
    }

    await notify(job.artisan_id, profile.id, jobId)
    refresh(jobId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Something went wrong.' }
  }
}

/** Cancel before work starts (refunds the customer if already paid). Artisans "decline". */
export async function cancelJob(jobId: string): Promise<JobActionResult> {
  try {
    const { profile } = await me()
    const job = await loadJob(jobId)
    if (!job || (job.customer_id !== profile.id && job.artisan_id !== profile.id)) {
      return { success: false, error: 'Job not found.' }
    }

    const { error } = await createServiceClient().rpc('escrow_cancel_job', { p_job_id: jobId, p_actor: profile.id })
    if (error) {
      console.error('escrow_cancel_job error:', error)
      return { success: false, error: friendly(error, 'Could not cancel this job.') }
    }

    await notify(job.customer_id === profile.id ? job.artisan_id : job.customer_id, profile.id, jobId)
    refresh(jobId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Something went wrong.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Disputes
// ─────────────────────────────────────────────────────────────────────────────

const REASONS: DisputeReason[] = ['not_done', 'poor_quality', 'no_show', 'no_response', 'other']

export async function openJobDispute(jobId: string, reason: DisputeReason, details: string): Promise<JobActionResult> {
  try {
    const { profile } = await me()
    if (!REASONS.includes(reason)) return { success: false, error: 'Choose a reason.' }
    const text = details?.trim() ?? ''
    if (text.length < 10 || text.length > 2000) return { success: false, error: 'Explain what happened in at least 10 characters.' }
    if (!(await rateLimit(`job-dispute:${profile.id}`, 5, 3600))) return { success: false, error: RATE_LIMITED }

    const job = await loadJob(jobId)
    if (!job || (job.customer_id !== profile.id && job.artisan_id !== profile.id)) {
      return { success: false, error: 'Job not found.' }
    }

    const { error } = await createServiceClient().rpc('open_job_dispute', {
      p_job_id: jobId,
      p_actor: profile.id,
      p_reason: reason,
      p_details: text,
      p_evidence: [],
    })
    if (error) {
      console.error('open_job_dispute error:', error)
      return { success: false, error: friendly(error, 'Could not open a dispute. Please try again.') }
    }

    await notify(job.customer_id === profile.id ? job.artisan_id : job.customer_id, profile.id, jobId)
    refresh(jobId)
    revalidatePath('/app/admin/disputes')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Something went wrong.' }
  }
}

export async function resolveJobDispute(
  disputeId: string,
  outcome: DisputeOutcome,
  artisanPct: number,
  note: string
): Promise<JobActionResult> {
  try {
    const { profile, isAdmin } = await me()
    if (!isAdmin) return { success: false, error: 'Admins only.' }
    if (!UUID_RE.test(disputeId)) return { success: false, error: 'Dispute not found.' }

    const admin = createServiceClient()
    const { data: dispute } = await admin.from('job_disputes').select('job_id').eq('id', disputeId).maybeSingle()
    if (!dispute) return { success: false, error: 'Dispute not found.' }

    const { error } = await admin.rpc('resolve_job_dispute', {
      p_dispute_id: disputeId,
      p_admin: profile.id,
      p_outcome: outcome,
      p_artisan_pct: Math.round(artisanPct),
      p_note: note,
    })
    if (error) {
      console.error('resolve_job_dispute error:', error)
      return { success: false, error: friendly(error, 'Could not resolve this dispute.') }
    }

    const job = await loadJob(dispute.job_id)
    if (job) {
      await notify(job.customer_id, profile.id, job.id)
      await notify(job.artisan_id, profile.id, job.id)
    }
    refresh(dispute.job_id)
    revalidatePath('/app/admin/disputes')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Something went wrong.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

async function attachParties(jobs: ArtisanJob[]): Promise<ArtisanJob[]> {
  const ids = Array.from(new Set(jobs.flatMap((j) => [j.customer_id, j.artisan_id])))
  if (ids.length === 0) return jobs
  const { data } = await createServiceClient().from('users').select(PARTY_COLS).in('id', ids)
  const byId = new Map((data ?? []).map((u) => [u.id, u as JobParty]))
  return jobs.map((j) => ({ ...j, customer: byId.get(j.customer_id) ?? null, artisan: byId.get(j.artisan_id) ?? null }))
}

export async function fetchMyJobs(): Promise<{ hired: ArtisanJob[]; work: ArtisanJob[] }> {
  const { profile } = await me()
  const admin = createServiceClient()
  const [hired, work] = await Promise.all([
    admin.from('artisan_jobs').select('*').eq('customer_id', profile.id).order('updated_at', { ascending: false }).limit(50),
    admin.from('artisan_jobs').select('*').eq('artisan_id', profile.id).order('updated_at', { ascending: false }).limit(50),
  ])
  return {
    hired: await attachParties((hired.data ?? []) as ArtisanJob[]),
    work: await attachParties((work.data ?? []) as ArtisanJob[]),
  }
}

export async function fetchJobDetail(jobId: string): Promise<JobDetail | null> {
  const { profile, isAdmin } = await me()
  const job = await loadJob(jobId)
  if (!job) return null

  const viewer = job.customer_id === profile.id ? 'customer' : job.artisan_id === profile.id ? 'artisan' : isAdmin ? 'admin' : null
  if (!viewer) return null

  const admin = createServiceClient()
  const [[withParties], hold, dispute, events] = await Promise.all([
    attachParties([job]),
    admin.from('escrow_holds').select('*').eq('job_id', jobId).maybeSingle(),
    admin.from('job_disputes').select('*').eq('job_id', jobId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('artisan_job_events').select('id, actor_id, kind, note, created_at').eq('job_id', jobId).order('created_at'),
  ])

  return {
    job: withParties,
    hold: hold.data ?? null,
    dispute: (dispute.data as JobDispute) ?? null,
    events: events.data ?? [],
    viewer,
  }
}

export async function fetchOpenDisputes(): Promise<Array<JobDispute & { job: ArtisanJob; amount_kobo: number }>> {
  const { isAdmin } = await me()
  if (!isAdmin) return []
  const admin = createServiceClient()
  const { data: disputes } = await admin
    .from('job_disputes')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(100)
  if (!disputes?.length) return []

  const jobIds = disputes.map((d) => d.job_id)
  const [{ data: jobs }, { data: holds }] = await Promise.all([
    admin.from('artisan_jobs').select('*').in('id', jobIds),
    admin.from('escrow_holds').select('job_id, amount_kobo').in('job_id', jobIds),
  ])
  const jobsById = new Map((await attachParties((jobs ?? []) as ArtisanJob[])).map((j) => [j.id, j]))
  const amounts = new Map((holds ?? []).map((h) => [h.job_id, Number(h.amount_kobo)]))

  return disputes
    .filter((d) => jobsById.has(d.job_id))
    .map((d) => ({ ...(d as JobDispute), job: jobsById.get(d.job_id)!, amount_kobo: amounts.get(d.job_id) ?? 0 }))
}

/** The signed-in user's escrow: paid out for jobs, and waiting to be released to them. */
export async function fetchEscrowSummary(): Promise<{ payingKobo: number; earningKobo: number }> {
  const userId = (await me()).profile.id
  const admin = createServiceClient()
  const [{ data: paying }, { data: earning }] = await Promise.all([
    admin.from('escrow_holds').select('amount_kobo').eq('payer_id', userId).eq('status', 'held'),
    admin
      .from('escrow_holds')
      .select('amount_kobo, job:artisan_jobs(fee_bps)')
      .eq('payee_id', userId)
      .eq('status', 'held'),
  ])
  const payingKobo = (paying ?? []).reduce((s, h) => s + Number(h.amount_kobo), 0)
  const earningKobo = (earning ?? []).reduce((s, h) => {
    const bps = Number((h as { job?: { fee_bps?: number } | null }).job?.fee_bps ?? PLATFORM_FEE_BPS)
    return s + Number(h.amount_kobo) - Math.round((Number(h.amount_kobo) * bps) / 10000)
  }, 0)
  return { payingKobo, earningKobo }
}
