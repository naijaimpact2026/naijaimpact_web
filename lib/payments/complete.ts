// Server-only. Turns ONE verified, successful Paystack charge into whatever
// it paid for. Used by the webhook (POST /api/paystack/webhook) and the
// customer callback (GET /api/paystack/callback), so both complete a payment
// the same way. Every branch is idempotent: running it twice for the same
// reference never applies money twice.
//
// Order of checks:
//   1. Wallet deposits and marketplace orders → settleSuccessfulCharge (payment_intents)
//   2. Campaign donations (metadata.type = 'campaign_donation')
//   3. Insurance premiums (metadata.type = 'insurance_premium')

import type { createServiceClient } from '@/lib/supabase/service'
import { parseMetadata, type PaystackTransaction } from './paystack'
import { settleSuccessfulCharge, verifiedPayer } from './settle'

type Admin = ReturnType<typeof createServiceClient>

export type CompleteKind = 'deposit' | 'marketplace_order' | 'campaign_donation' | 'insurance_premium' | 'unknown'

export interface CompleteResult {
  /** done: applied now or earlier · needs_review: paid but a person must look · ignored: nothing to apply · error: retry */
  outcome: 'done' | 'needs_review' | 'ignored' | 'error'
  kind: CompleteKind
  /** e.g. the campaign id, for redirecting the customer back to the right page. */
  targetId?: string
  detail?: string
}

export async function completeCharge(admin: Admin, tx: PaystackTransaction): Promise<CompleteResult> {
  // 1. Deposits + marketplace orders.
  const settled = await settleSuccessfulCharge(admin, tx)
  if (settled.outcome === 'error') return { outcome: 'error', kind: settled.purpose ?? 'unknown', detail: settled.detail ?? 'settle error' }
  if (settled.outcome === 'needs_review') return { outcome: 'needs_review', kind: settled.purpose ?? 'unknown', detail: settled.detail }
  if (settled.outcome !== 'ignored') return { outcome: 'done', kind: settled.purpose ?? 'unknown' }

  // 2–3. Other payment types (metadata-driven).
  const reference = tx.reference
  const amountNGN = (Number(tx.amount) || 0) / 100
  const payerEmail = String(tx.customer?.email ?? '').trim().toLowerCase()
  const metadata = parseMetadata(tx.metadata)
  const type = typeof metadata.type === 'string' ? metadata.type : ''
  const referenceId = typeof metadata.referenceId === 'string' ? metadata.referenceId : undefined

  if (!type || amountNGN <= 0 || (tx.currency && tx.currency !== 'NGN')) {
    console.error('completeCharge: missing or invalid fields', { reference, type, currency: tx.currency })
    return { outcome: 'ignored', kind: 'unknown', detail: 'unhandled payment' }
  }

  if (type === 'campaign_donation' && referenceId) return completeDonation(admin, { reference, amountNGN, payerEmail, metadata, campaignId: referenceId })
  if (type === 'insurance_premium' && referenceId) return completeInsurance(admin, { reference, amountNGN, payerEmail, metadata, productId: referenceId })

  // 'course_purchase' is intentionally not handled: paid courses go through the
  // purchase_course RPC (wallet); a card-paid course would need its price checked first.
  return { outcome: 'ignored', kind: 'unknown', detail: `unhandled type: ${type}` }
}

async function completeDonation(
  admin: Admin,
  p: { reference: string; amountNGN: number; payerEmail: string; metadata: Record<string, unknown>; campaignId: string }
): Promise<CompleteResult> {
  const base = { kind: 'campaign_donation' as const, targetId: p.campaignId }
  const { data: campaign } = await admin
    .from('funding')
    .select('id, title, user_id, funding_type')
    .eq('id', p.campaignId)
    .maybeSingle()
  if (!campaign) return { ...base, outcome: 'needs_review', detail: 'campaign not found' }

  const donorId = await verifiedPayer(admin, p.metadata.userId, p.payerEmail)

  // Unique on reference: a replayed webhook / the verify action can't record it twice.
  const { error: ftError } = await admin.from('funding_transactions').insert({
    funding_id: p.campaignId,
    funding_type: campaign.funding_type || 'campaign',
    user_id: donorId ?? campaign.user_id,
    amount: p.amountNGN,
    reference: p.reference,
    transaction_status: 'success',
    donation_visibility: donorId ? 'public' : 'anonymous',
  })
  if (ftError) {
    if (ftError.code === '23505') return { ...base, outcome: 'done' } // already recorded
    console.error('completeCharge: funding_transactions insert error', ftError)
    return { ...base, outcome: 'error', detail: 'DB error' }
  }

  if (donorId) {
    await admin.from('transactions').insert({
      user_id: donorId,
      type: 'campaign_donation',
      amount: p.amountNGN,
      status: 'success',
      ref: p.reference,
    })
  }

  if (campaign.user_id !== donorId) {
    await admin.from('notifications').insert({
      user_id: campaign.user_id,
      actor_id: donorId,
      type: 'funding_contribution',
      reference_id: p.campaignId,
      read: false,
    })
  }
  return { ...base, outcome: 'done' }
}

async function completeInsurance(
  admin: Admin,
  p: { reference: string; amountNGN: number; payerEmail: string; metadata: Record<string, unknown>; productId: string }
): Promise<CompleteResult> {
  const base = { kind: 'insurance_premium' as const, targetId: p.productId }
  const userId = await verifiedPayer(admin, p.metadata.userId, p.payerEmail)
  if (!userId) return { ...base, outcome: 'needs_review', detail: 'unverified payer' }

  const { data: product } = await admin
    .from('fintech_insure_products')
    .select('id, weekly_premium, is_active')
    .eq('id', p.productId)
    .maybeSingle()
  if (!product?.is_active || p.amountNGN < Number(product.weekly_premium || 0)) {
    console.error('completeCharge: insurance premium mismatch', { reference: p.reference, amountNGN: p.amountNGN })
    return { ...base, outcome: 'needs_review', detail: 'premium mismatch' }
  }

  const { data: existingPolicy } = await admin
    .from('fintech_insure_policies')
    .select('id')
    .eq('paystack_ref', p.reference)
    .maybeSingle()

  if (!existingPolicy) {
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 12)

    const { error } = await admin.from('fintech_insure_policies').insert({
      user_id: userId,
      product_id: p.productId,
      status: 'active',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      paystack_ref: p.reference,
    })
    if (error) {
      console.error('completeCharge: insurance policy insert error', error)
      return { ...base, outcome: 'error', detail: 'DB error' }
    }
  }
  return { ...base, outcome: 'done' }
}
