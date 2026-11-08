// Shared types and labels for artisan hiring + escrow. Safe to import from
// client components (no server code here).

export const PLATFORM_FEE_BPS = 500 // 5%, also capped in the database
export const ARTISAN_DISPUTE_WAIT_DAYS = 3

export type JobStatus =
  | 'requested'
  | 'quoted'
  | 'declined'
  | 'cancelled'
  | 'expired'
  | 'funded'
  | 'in_progress'
  | 'submitted'
  | 'disputed'
  | 'completed'
  | 'refunded'

export type DisputeReason = 'not_done' | 'poor_quality' | 'no_show' | 'no_response' | 'other'
export type DisputeOutcome = 'release' | 'refund' | 'split'

export interface JobParty {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

export interface ArtisanJob {
  id: string
  customer_id: string
  artisan_id: string
  listing_id: string | null
  title: string
  description: string
  address: string | null
  preferred_date: string | null
  budget_kobo: number | null
  quote_kobo: number | null
  quote_note: string | null
  fee_bps: number
  status: JobStatus
  quoted_at: string | null
  funded_at: string | null
  started_at: string | null
  submitted_at: string | null
  completed_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  customer?: JobParty | null
  artisan?: JobParty | null
}

export interface EscrowHold {
  id: string
  job_id: string
  amount_kobo: number
  fee_kobo: number
  payee_kobo: number
  payer_refund_kobo: number
  status: 'held' | 'released' | 'refunded' | 'split'
  held_at: string
  settled_at: string | null
}

export interface JobDispute {
  id: string
  job_id: string
  opened_by: string
  reason: DisputeReason
  details: string
  status: 'open' | 'resolved'
  outcome: DisputeOutcome | null
  artisan_share_pct: number | null
  resolution_note: string | null
  created_at: string
  resolved_at: string | null
}

export interface JobEvent {
  id: number
  actor_id: string | null
  kind: string
  note: string | null
  created_at: string
}

export interface JobDetail {
  job: ArtisanJob
  hold: EscrowHold | null
  dispute: JobDispute | null
  events: JobEvent[]
  viewer: 'customer' | 'artisan' | 'admin'
}

export const STATUS_META: Record<JobStatus, { label: string; tone: 'neutral' | 'info' | 'warn' | 'good' | 'bad' }> = {
  requested: { label: 'Awaiting quote', tone: 'info' },
  quoted: { label: 'Quote sent', tone: 'info' },
  declined: { label: 'Declined', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
  funded: { label: 'Paid into escrow', tone: 'good' },
  in_progress: { label: 'In progress', tone: 'good' },
  submitted: { label: 'Awaiting approval', tone: 'warn' },
  disputed: { label: 'In dispute', tone: 'bad' },
  completed: { label: 'Completed', tone: 'good' },
  refunded: { label: 'Refunded', tone: 'neutral' },
}

export const DISPUTE_REASONS: Record<DisputeReason, string> = {
  not_done: 'The work was not done',
  poor_quality: 'The work is poor or incomplete',
  no_show: 'The artisan did not show up',
  no_response: 'The customer has not responded',
  other: 'Something else',
}

export const EVENT_LABELS: Record<string, string> = {
  requested: 'Job requested',
  quoted: 'Quote sent',
  funded: 'Paid into escrow',
  started: 'Work started',
  submitted: 'Work marked as done',
  approved: 'Approved and paid out',
  cancelled: 'Cancelled',
  declined: 'Declined by artisan',
  cancelled_refunded: 'Cancelled and refunded',
  expired: 'Expired',
  disputed: 'Dispute opened',
  dispute_release: 'Dispute resolved: paid to artisan',
  dispute_refund: 'Dispute resolved: refunded to customer',
  dispute_split: 'Dispute resolved: split',
}

/** Fee and artisan take-home for an amount in kobo. Mirrors the SQL rounding. */
export function feeBreakdown(amountKobo: number, feeBps = PLATFORM_FEE_BPS) {
  const fee = Math.round((amountKobo * feeBps) / 10000)
  return { fee, net: amountKobo - fee }
}

export function naira(kobo: number | null | undefined): string {
  const n = (kobo ?? 0) / 100
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
