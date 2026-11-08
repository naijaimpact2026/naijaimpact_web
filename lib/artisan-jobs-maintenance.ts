// Server-only daily housekeeping for artisan jobs. No money moves here:
// escrow is only released by the customer or an admin.

import type { createServiceClient } from '@/lib/supabase/service'

type Admin = ReturnType<typeof createServiceClient>

const DAY = 86_400_000
const EXPIRE_AFTER_DAYS = 14
const REMIND_AFTER_DAYS = 2

export async function runJobMaintenance(admin: Admin, now = Date.now()) {
  const summary = { expired: 0, reminded: 0, errors: 0 }

  // 1. Requests/quotes nobody acted on for 14 days → expired (nothing was paid).
  const staleBefore = new Date(now - EXPIRE_AFTER_DAYS * DAY).toISOString()
  const { data: stale, error: staleErr } = await admin
    .from('artisan_jobs')
    .update({ status: 'expired', closed_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString() })
    .in('status', ['requested', 'quoted'])
    .lt('updated_at', staleBefore)
    .select('id, customer_id, artisan_id')
  if (staleErr) {
    console.error('job maintenance: expire failed', staleErr)
    summary.errors++
  } else if (stale?.length) {
    summary.expired = stale.length
    await admin.from('artisan_job_events').insert(stale.map((j) => ({ job_id: j.id, kind: 'expired' })))
    await admin.from('notifications').insert(
      stale.flatMap((j) => [
        { user_id: j.customer_id, actor_id: null, type: 'artisan_job', reference_id: j.id, read: false },
        { user_id: j.artisan_id, actor_id: null, type: 'artisan_job', reference_id: j.id, read: false },
      ])
    )
  }

  // 2. Work submitted 2–3 days ago and not yet approved → one reminder to the customer.
  //    (Runs daily, so the 24h window sends exactly one reminder.)
  const { data: waiting, error: waitErr } = await admin
    .from('artisan_jobs')
    .select('id, customer_id, artisan_id')
    .eq('status', 'submitted')
    .lt('submitted_at', new Date(now - REMIND_AFTER_DAYS * DAY).toISOString())
    .gte('submitted_at', new Date(now - (REMIND_AFTER_DAYS + 1) * DAY).toISOString())
  if (waitErr) {
    console.error('job maintenance: reminder query failed', waitErr)
    summary.errors++
  } else if (waiting?.length) {
    const { error } = await admin.from('notifications').insert(
      waiting.map((j) => ({ user_id: j.customer_id, actor_id: j.artisan_id, type: 'artisan_job', reference_id: j.id, read: false }))
    )
    if (error) console.error('job maintenance: reminder insert failed', error.message)
    else summary.reminded = waiting.length
  }

  return summary
}
