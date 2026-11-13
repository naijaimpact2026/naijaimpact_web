// Server-only. The single place a successful Paystack charge turns into
// wallet credit or paid orders. Used by the webhook, the verify action and the
// reconcile cron, so all three behave identically.
//
// Every step is idempotent (unique ledger refs, conditional status updates),
// so settling the same reference twice, or from two places at once, is safe.

import type { createServiceClient } from '@/lib/supabase/service'
import { parseMetadata, type PaystackTransaction } from './paystack'

type Admin = ReturnType<typeof createServiceClient>

export type SettleOutcome =
  | 'settled' // money applied now
  | 'already_settled' // applied earlier
  | 'needs_review' // paid, but doesn't match what was expected; a person must look
  | 'ignored' // not a deposit / marketplace payment; caller handles it
  | 'error' // transient failure; safe to retry

export interface SettleResult {
  outcome: SettleOutcome
  purpose?: 'deposit' | 'marketplace_order'
  userId?: string
  amountNGN?: number
  detail?: string
}

const sameAmount = (a: number, b: number) => Math.abs(a - b) < 0.01

/** Update an intent unless it already succeeded (late webhooks may follow a cron "abandoned"). */
async function markIntent(
  admin: Admin,
  reference: string,
  patch: { status: 'succeeded' | 'failed' | 'abandoned' | 'needs_review'; paystack_status?: string; failure_reason?: string }
) {
  const now = new Date().toISOString()
  await admin
    .from('payment_intents')
    .update({
      ...patch,
      updated_at: now,
      ...(patch.status === 'succeeded' ? { settled_at: now } : {}),
    })
    .eq('reference', reference)
    .neq('status', 'succeeded')
}

/**
 * A metadata user id is only trusted when that account's email is the email
 * that paid (metadata comes from the browser).
 */
export async function verifiedPayer(admin: Admin, userId: unknown, payerEmail: string): Promise<string | null> {
  if (typeof userId !== 'string' || !userId || userId === 'anonymous' || !payerEmail) return null
  const { data } = await admin.from('users').select('id, email').eq('id', userId).maybeSingle()
  return data && String(data.email ?? '').trim().toLowerCase() === payerEmail ? data.id : null
}

async function creditDeposit(admin: Admin, userId: string, amountNGN: number, reference: string): Promise<SettleResult> {
  const { data, error } = await admin.rpc('web_wallet_credit', {
    p_user_id: userId,
    p_amount: amountNGN,
    p_type: 'deposit',
    p_ref: reference,
  })
  if (error) {
    console.error('settle: deposit credit failed', { reference, error })
    return { outcome: 'error', purpose: 'deposit', userId, detail: error.message }
  }
  return {
    outcome: data === 'already_credited' ? 'already_settled' : 'settled',
    purpose: 'deposit',
    userId,
    amountNGN,
  }
}

/**
 * Mark marketplace orders paid and their escrow funded.
 * `buyerUserId` is a users.id; nm_orders.buyer_id holds the auth id, which
 * differs for some accounts, so both are accepted.
 */
async function settleOrders(
  admin: Admin,
  buyerUserId: string,
  orderIds: string[],
  reference: string,
  amountNGN: number
): Promise<SettleResult> {
  const base = { purpose: 'marketplace_order' as const, userId: buyerUserId, amountNGN }
  if (orderIds.length === 0) return { ...base, outcome: 'needs_review', detail: 'No orders attached to payment' }

  const { data: buyer } = await admin.from('users').select('id, auth_id').eq('id', buyerUserId).maybeSingle()
  const buyerKeys = new Set([buyerUserId, buyer?.auth_id].filter(Boolean) as string[])

  const { data: orders, error: ordersError } = await admin
    .from('nm_orders')
    .select('id, buyer_id, total_amount, status, seller_profile:nm_seller_profiles(user_id)')
    .in('id', orderIds)
  if (ordersError) return { ...base, outcome: 'error', detail: ordersError.message }

  const owned = (orders ?? []).filter((o) => buyerKeys.has(o.buyer_id))
  if (owned.length !== orderIds.length) {
    return { ...base, outcome: 'needs_review', detail: 'Orders missing or not owned by payer' }
  }

  const due = owned.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  if (!sameAmount(due, amountNGN)) {
    return { ...base, outcome: 'needs_review', detail: `Paid ₦${amountNGN}, orders total ₦${due}` }
  }

  // Which orders were already settled under this reference?
  const refs = owned.map((o) => `${reference}:${o.id}`)
  const { data: existing } = await admin
    .from('transactions')
    .select('ref')
    .in('ref', refs)
    .eq('type', 'marketplace_purchase')
  const done = new Set((existing ?? []).map((t) => t.ref as string))

  const unsettled = owned.filter((o) => !done.has(`${reference}:${o.id}`))
  if (unsettled.length === 0) return { ...base, outcome: 'already_settled' }

  // An order cancelled (or otherwise moved on) before the money arrived needs a refund decision.
  const notPayable = unsettled.filter((o) => o.status !== 'pending')
  if (notPayable.length > 0) {
    return {
      ...base,
      outcome: 'needs_review',
      detail: `Paid for order(s) no longer pending: ${notPayable.map((o) => `${o.id}=${o.status}`).join(', ')}`,
    }
  }

  for (const order of unsettled) {
    // One ledger row per order; the unique (ref, type) index makes repeats no-ops.
    const { error: txError } = await admin.from('transactions').insert({
      user_id: buyerUserId,
      type: 'marketplace_purchase',
      amount: order.total_amount,
      status: 'success',
      ref: `${reference}:${order.id}`,
    })
    if (txError && txError.code !== '23505') {
      console.error('settle: ledger insert failed', { reference, order: order.id, txError })
      return { ...base, outcome: 'error', detail: txError.message }
    }
    if (txError) continue // settled concurrently by another caller

    const now = new Date().toISOString()
    const { error: orderError } = await admin
      .from('nm_orders')
      .update({ status: 'confirmed', updated_at: now })
      .eq('id', order.id)
      .eq('status', 'pending')
    const { error: escrowError } = await admin
      .from('nm_escrow')
      .update({ status: 'funded', funded_at: now })
      .eq('order_id', order.id)
    if (orderError || escrowError) {
      // Ledger row exists, so this won't re-run; surface it loudly for a manual fix.
      console.error('settle: order/escrow update failed after ledger insert', {
        reference,
        order: order.id,
        orderError,
        escrowError,
      })
    }

    const sellerUserId = (order as { seller_profile?: { user_id?: string } | null }).seller_profile?.user_id
    if (sellerUserId) {
      await admin.from('notifications').insert({
        user_id: sellerUserId,
        actor_id: buyerUserId,
        type: 'marketplace_order',
        reference_id: order.id,
        read: false,
      })
    }
  }

  return { ...base, outcome: 'settled' }
}

/**
 * Apply a charge Paystack reports as successful.
 *
 * Payments started from a server-created payment_intent are settled from the
 * intent (trusted amount, purpose, user and targets). Older references with no
 * intent fall back to the metadata checks the webhook always used.
 *
 * @param legacyDepositUserId users.id already verified by the caller (the
 *   signed-in user whose email paid) — lets old deposit refs be recovered.
 */
export async function settleSuccessfulCharge(
  admin: Admin,
  tx: PaystackTransaction,
  opts: { legacyDepositUserId?: string } = {}
): Promise<SettleResult> {
  const reference = tx.reference
  const amountKobo = Math.round(Number(tx.amount) || 0)
  const amountNGN = amountKobo / 100
  const payerEmail = String(tx.customer?.email ?? '').trim().toLowerCase()

  if (tx.status !== 'success') return { outcome: 'ignored', detail: `Paystack status ${tx.status}` }
  if (tx.currency && tx.currency !== 'NGN') return { outcome: 'needs_review', detail: `Currency ${tx.currency}` }

  const { data: intent, error: intentError } = await admin
    .from('payment_intents')
    .select('reference, user_id, purpose, amount_kobo, target_ids, status')
    .eq('reference', reference)
    .maybeSingle()
  // Table not created yet (code deployed before the migration): settle as legacy.
  const missingTable = intentError && (intentError.code === '42P01' || intentError.code === 'PGRST205')
  if (intentError && !missingTable) return { outcome: 'error', detail: intentError.message }

  // ── Server-created intent ────────────────────────────────────────────────
  if (intent) {
    let result: SettleResult
    if (amountKobo !== Number(intent.amount_kobo)) {
      result = {
        outcome: 'needs_review',
        purpose: intent.purpose,
        userId: intent.user_id,
        amountNGN,
        detail: `Paid ${amountKobo} kobo, expected ${intent.amount_kobo}`,
      }
    } else if (intent.purpose === 'deposit') {
      result = await creditDeposit(admin, intent.user_id, amountNGN, reference)
    } else {
      result = await settleOrders(admin, intent.user_id, intent.target_ids ?? [], reference, amountNGN)
    }

    if (result.outcome === 'settled' || result.outcome === 'already_settled') {
      await markIntent(admin, reference, { status: 'succeeded', paystack_status: tx.status })
    } else if (result.outcome === 'needs_review') {
      console.error('settle: payment needs review', { reference, detail: result.detail })
      await markIntent(admin, reference, { status: 'needs_review', paystack_status: tx.status, failure_reason: result.detail })
    }
    return result
  }

  // ── Legacy reference (no intent): trust only what we can verify ─────────
  const metadata = parseMetadata(tx.metadata)
  const type = metadata.type

  if (type === 'deposit') {
    const userId = opts.legacyDepositUserId ?? (await verifiedPayer(admin, metadata.userId, payerEmail))
    if (!userId) return { outcome: 'needs_review', purpose: 'deposit', amountNGN, detail: 'Unverified payer' }
    if (amountNGN < 100) return { outcome: 'needs_review', purpose: 'deposit', userId, amountNGN, detail: 'Below ₦100 minimum' }
    return creditDeposit(admin, userId, amountNGN, reference)
  }

  if (type === 'marketplace_purchase') {
    const buyerId = await verifiedPayer(admin, metadata.userId, payerEmail)
    const orderIds = Array.isArray(metadata.orderIds)
      ? (metadata.orderIds as unknown[]).filter((id): id is string => typeof id === 'string')
      : typeof metadata.referenceId === 'string'
        ? [metadata.referenceId]
        : []
    if (!buyerId) return { outcome: 'needs_review', purpose: 'marketplace_order', amountNGN, detail: 'Unverified payer' }
    return settleOrders(admin, buyerId, orderIds, reference, amountNGN)
  }

  return { outcome: 'ignored' }
}

/** Record that Paystack reports a pending intent as failed or abandoned. */
export async function closeIntent(
  admin: Admin,
  reference: string,
  status: 'failed' | 'abandoned',
  paystackStatus: string | undefined,
  reason: string
) {
  await admin
    .from('payment_intents')
    .update({
      status,
      paystack_status: paystackStatus ?? null,
      failure_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('reference', reference)
    .eq('status', 'pending')
}
