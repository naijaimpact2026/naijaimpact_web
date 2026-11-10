import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { completeCharge } from '@/lib/payments/complete'
import { parseMetadata, type PaystackTransaction } from '@/lib/payments/paystack'

/*
 * Paystack webhook — set this as the Webhook URL in the Paystack dashboard
 * (Settings → API Keys & Webhooks): https://<domain>/api/paystack/webhook
 *
 * 1. Verifies the x-paystack-signature (HMAC SHA-512 of the raw body with PAYSTACK_SECRET_KEY).
 * 2. Logs every verified event to paystack_events (audit trail + replay).
 * 3. charge.success → completeCharge(): wallet deposit, marketplace order,
 *    campaign donation or insurance premium. Idempotent, so retries are safe.
 * 4. Responds 200 quickly; 500 only on a transient failure so Paystack retries
 *    (the reconcile cron is the second safety net).
 */

export const dynamic = 'force-dynamic'

/** Constant-time comparison of two hex digests. */
function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  return ab.length === bb.length && ab.length > 0 && crypto.timingSafeEqual(ab, bb)
}

// Events we only record. Withdrawals are paid out manually today (no Paystack
// Transfers are started by the app) and refunds are issued from the dashboard,
// so these need a person to reconcile; they stay in paystack_events with a note.
const LOG_ONLY: Record<string, string> = {
  'refund.pending': 'refund pending: check the wallet/order manually',
  'refund.processing': 'refund processing: check the wallet/order manually',
  'refund.processed': 'refund processed: reverse the credit/order manually if needed',
  'refund.failed': 'refund failed',
  'transfer.success': 'transfer succeeded (not started by the app)',
  'transfer.failed': 'transfer failed (not started by the app)',
  'transfer.reversed': 'transfer reversed (not started by the app)',
  'charge.dispute.create': 'chargeback opened: respond in the Paystack dashboard',
  'charge.dispute.remind': 'chargeback reminder: respond in the Paystack dashboard',
  'charge.dispute.resolve': 'chargeback resolved',
}

export async function POST(request: NextRequest) {
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY
  if (!paystackSecret) {
    console.error('Paystack webhook: PAYSTACK_SECRET_KEY not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  // Raw body for HMAC verification (must not be re-serialised).
  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature') ?? ''
  const expectedSig = crypto.createHmac('sha512', paystackSecret).update(rawBody).digest('hex')
  if (!safeEqualHex(expectedSig, signature)) {
    console.warn('Paystack webhook: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const data = (event.data ?? {}) as Record<string, unknown>
  const eventName = String(event.event ?? '')
  // Refund/dispute payloads carry the charge reference under data.transaction.
  const nested = (data.transaction ?? {}) as Record<string, unknown>
  const paystackRef =
    typeof data.reference === 'string' ? data.reference
      : typeof nested.reference === 'string' ? nested.reference
        : typeof data.transaction_reference === 'string' ? data.transaction_reference
          : null

  // Log every verified event before acting on it. A repeat delivery hits the
  // unique (event, reference) index; processing below is idempotent, so it still runs safely.
  await supabase.from('paystack_events').insert({ event: eventName, reference: paystackRef, payload: event })
  const markEvent = async (note?: string) => {
    if (!paystackRef) return
    await supabase
      .from('paystack_events')
      .update({ processed_at: new Date().toISOString(), error: note ?? null })
      .eq('event', eventName)
      .eq('reference', paystackRef)
  }

  if (eventName !== 'charge.success') {
    if (LOG_ONLY[eventName]) {
      console.warn(`Paystack webhook: ${eventName}`, { reference: paystackRef })
      await markEvent(LOG_ONLY[eventName])
    }
    return NextResponse.json({ received: true }, { status: 200 })
  }

  if (!paystackRef) {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  try {
    const tx = { ...(data as unknown as PaystackTransaction), metadata: parseMetadata(data.metadata as PaystackTransaction['metadata']) }
    const result = await completeCharge(supabase, tx)
    if (result.outcome === 'error') {
      await markEvent(result.detail ?? 'processing error')
      return NextResponse.json({ error: 'Processing error' }, { status: 500 })
    }
    await markEvent(
      result.outcome === 'needs_review' ? `needs_review: ${result.detail ?? ''}`
        : result.outcome === 'ignored' ? (result.detail ?? 'ignored')
          : undefined
    )
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error('Paystack webhook processing error:', err)
    await markEvent(err instanceof Error ? err.message : 'processing error')
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }
}
