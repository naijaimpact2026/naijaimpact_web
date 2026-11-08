import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { paystackVerify } from '@/lib/payments/paystack'
import { closeIntent, settleSuccessfulCharge } from '@/lib/payments/settle'
import { runJobMaintenance } from '@/lib/artisan-jobs-maintenance'

// Recovers payments whose webhook never arrived (or failed): every pending
// payment_intent older than a few minutes is checked against Paystack and
// settled through the same code as the webhook. Safe to run repeatedly or
// concurrently — settlement is idempotent.
//
// Also runs the daily artisan-job housekeeping (expire stale requests, remind
// customers to approve), since the Vercel Hobby plan limits cron jobs to
// once a day.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const JOB = 'reconcile-payments'
const BATCH = 50
const MIN_AGE_MS = 10 * 60 * 1000 // give the webhook 10 minutes first
const GIVE_UP_MS = 48 * 60 * 60 * 1000 // unpaid after 48h → abandoned
const TIME_BUDGET_MS = 45_000 // stay inside maxDuration

function authorized(request: NextRequest): boolean {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; refuse if it's unset.
  const cronSecret = process.env.CRON_SECRET
  const expected = Buffer.from(`Bearer ${cronSecret ?? ''}`)
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  return !!cronSecret && given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const started = Date.now()
  const admin = createServiceClient()
  const summary = { checked: 0, settled: 0, already: 0, needsReview: 0, failed: 0, abandoned: 0, waiting: 0, errors: 0 }

  const { data: run } = await admin.from('cron_runs').insert({ job: JOB }).select('id').single()

  const { data: intents, error } = await admin
    .from('payment_intents')
    .select('reference, created_at, check_attempts')
    .eq('status', 'pending')
    .lt('created_at', new Date(started - MIN_AGE_MS).toISOString())
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
    .limit(BATCH)

  if (error) {
    console.error(`${JOB}: load failed`, error)
    if (run) {
      await admin
        .from('cron_runs')
        .update({ finished_at: new Date().toISOString(), ok: false, summary: { error: error.message } })
        .eq('id', run.id)
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  for (const intent of intents ?? []) {
    if (Date.now() - started > TIME_BUDGET_MS) break
    summary.checked++

    const age = started - new Date(intent.created_at).getTime()
    const verified = await paystackVerify(intent.reference)

    await admin
      .from('payment_intents')
      .update({
        check_attempts: (intent.check_attempts ?? 0) + 1,
        last_checked_at: new Date().toISOString(),
        ...(verified.ok ? { paystack_status: verified.tx.status } : {}),
      })
      .eq('reference', intent.reference)

    if (!verified.ok) {
      if (verified.notFound && age > GIVE_UP_MS) {
        await closeIntent(admin, intent.reference, 'abandoned', undefined, 'Never paid (not found on Paystack)')
        summary.abandoned++
      } else if (verified.notFound) {
        summary.waiting++
      } else {
        console.error(`${JOB}: verify failed`, intent.reference, verified.message)
        summary.errors++
      }
      continue
    }

    const { tx } = verified
    if (tx.status === 'success') {
      const result = await settleSuccessfulCharge(admin, tx)
      if (result.outcome === 'settled') summary.settled++
      else if (result.outcome === 'already_settled') summary.already++
      else if (result.outcome === 'needs_review') summary.needsReview++
      else summary.errors++
    } else if (tx.status === 'failed' || tx.status === 'reversed') {
      await closeIntent(admin, intent.reference, 'failed', tx.status, tx.gateway_response || `Paystack: ${tx.status}`)
      summary.failed++
    } else if (age > GIVE_UP_MS) {
      // abandoned / ongoing / pending / processing / queued for 48h+
      await closeIntent(admin, intent.reference, 'abandoned', tx.status, `Still ${tx.status} after 48h`)
      summary.abandoned++
    } else {
      summary.waiting++
    }
  }

  let jobs: Awaited<ReturnType<typeof runJobMaintenance>> | { error: string }
  try {
    jobs = await runJobMaintenance(admin)
  } catch (err) {
    jobs = { error: err instanceof Error ? err.message : 'job maintenance failed' }
  }

  const ok = summary.errors === 0 && !('error' in jobs) && jobs.errors === 0
  if (run) {
    await admin
      .from('cron_runs')
      .update({ finished_at: new Date().toISOString(), ok, summary: { ...summary, jobs } })
      .eq('id', run.id)
  }
  if (summary.needsReview > 0) {
    console.error(`${JOB}: ${summary.needsReview} payment(s) need manual review (payment_intents.status = 'needs_review')`)
  }

  return NextResponse.json({ ok, ...summary, jobs, timestamp: new Date().toISOString() })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request)
}
