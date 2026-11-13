'use server'

// Start a Paystack checkout. The server records a payment_intent (reference,
// amount, purpose, targets) BEFORE the popup opens, and returns the reference
// and amount the client must use. That record is what lets the reconcile cron
// recover a payment whose webhook never arrived.

import { getCurrentUser } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit, RATE_LIMITED } from '@/lib/rate-limit'

export type CheckoutResult =
  | { success: true; reference: string; amountKobo: number; email: string; userId: string }
  | { success: false; error: string }

const MIN_DEPOSIT = 100
const MAX_DEPOSIT = 10_000_000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const newRef = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`

async function payer() {
  const { authUser, profile } = await getCurrentUser()
  if (!authUser || !profile) return null
  const email = String(authUser.email ?? profile.email ?? '').trim()
  if (!email) return null
  return { authUser, profile, email }
}

async function createIntent(row: {
  reference: string
  user_id: string
  purpose: 'deposit' | 'marketplace_order'
  amount_kobo: number
  target_ids?: string[]
}): Promise<string | null> {
  const { error } = await createServiceClient().from('payment_intents').insert(row)
  if (error) {
    console.error('createIntent error:', error)
    return 'Could not start payment. Please try again.'
  }
  return null
}

/** Begin a wallet deposit of `amountNGN`. */
export async function startDeposit(amountNGN: number): Promise<CheckoutResult> {
  const me = await payer()
  if (!me) return { success: false, error: 'Please sign in again.' }

  if (!Number.isFinite(amountNGN) || amountNGN < MIN_DEPOSIT || amountNGN > MAX_DEPOSIT) {
    return { success: false, error: `Deposit must be between ₦${MIN_DEPOSIT} and ₦${MAX_DEPOSIT.toLocaleString()}.` }
  }
  if (!(await rateLimit(`checkout:${me.profile.id}`, 20, 600))) return { success: false, error: RATE_LIMITED }

  const reference = newRef('DEP')
  const amountKobo = Math.round(amountNGN * 100)
  const err = await createIntent({ reference, user_id: me.profile.id, purpose: 'deposit', amount_kobo: amountKobo })
  if (err) return { success: false, error: err }

  return { success: true, reference, amountKobo, email: me.email, userId: me.profile.id }
}

/**
 * Begin paying for one or more pending marketplace orders the signed-in user
 * placed. The amount is the orders' stored totals, never a client figure.
 */
export async function startOrderCheckout(orderIds: string[]): Promise<CheckoutResult> {
  const me = await payer()
  if (!me) return { success: false, error: 'Please sign in again.' }

  const ids = Array.from(new Set(orderIds))
  if (ids.length === 0 || ids.length > 20 || !ids.every((id) => UUID_RE.test(id))) {
    return { success: false, error: 'Invalid order selection.' }
  }
  if (!(await rateLimit(`checkout:${me.profile.id}`, 20, 600))) return { success: false, error: RATE_LIMITED }

  const { data: orders, error } = await createServiceClient()
    .from('nm_orders')
    .select('id, buyer_id, total_amount, status')
    .in('id', ids)
  if (error) {
    console.error('startOrderCheckout error:', error)
    return { success: false, error: 'Could not load your order. Please try again.' }
  }

  // nm_orders.buyer_id holds the auth id; accept the profile id too.
  const mine = new Set([me.authUser.id, me.profile.id])
  const payable = (orders ?? []).filter((o) => mine.has(o.buyer_id) && o.status === 'pending')
  if (payable.length !== ids.length) {
    return { success: false, error: 'One or more orders are no longer awaiting payment.' }
  }

  const amountKobo = Math.round(payable.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) * 100)
  if (amountKobo <= 0) return { success: false, error: 'Order total is invalid.' }

  const reference = newRef('MKT')
  const err = await createIntent({
    reference,
    user_id: me.profile.id,
    purpose: 'marketplace_order',
    amount_kobo: amountKobo,
    target_ids: ids,
  })
  if (err) return { success: false, error: err }

  return { success: true, reference, amountKobo, email: me.email, userId: me.profile.id }
}
