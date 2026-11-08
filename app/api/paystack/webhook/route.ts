import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { settleSuccessfulCharge } from '@/lib/payments/settle'
import type { PaystackTransaction } from '@/lib/payments/paystack'

// Webhook writes bypass RLS; fails closed if the service role key is missing.
const getAdminClient = createServiceClient

type Admin = ReturnType<typeof getAdminClient>

/** Constant-time comparison of two hex digests. */
function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  return ab.length === bb.length && ab.length > 0 && crypto.timingSafeEqual(ab, bb)
}

/**
 * metadata comes from the browser that opened the checkout, so a user id in
 * it is only trusted when that account's email is the email that paid.
 */
async function verifiedPayer(supabase: Admin, userId: unknown, payerEmail: string): Promise<string | null> {
  if (typeof userId !== 'string' || !userId || userId === 'anonymous' || !payerEmail) return null
  const { data } = await supabase.from('users').select('id, email').eq('id', userId).maybeSingle()
  return data && String(data.email ?? '').trim().toLowerCase() === payerEmail ? data.id : null
}

export async function POST(request: NextRequest) {
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY

  if (!paystackSecret) {
    console.error('Paystack webhook: PAYSTACK_SECRET_KEY not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  // Read raw body for HMAC verification
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

  const supabase = getAdminClient()
  const data = (event.data ?? {}) as Record<string, unknown>
  const eventName = String(event.event ?? '')
  const paystackRef = typeof data.reference === 'string' ? data.reference : null

  // Log every verified event before acting on it (audit trail + replay).
  // A repeat delivery hits the unique (event, reference) index; processing
  // below is idempotent, so it still runs safely.
  await supabase.from('paystack_events').insert({ event: eventName, reference: paystackRef, payload: event })
  const markEvent = async (error?: string) => {
    if (!paystackRef) return
    await supabase
      .from('paystack_events')
      .update({ processed_at: new Date().toISOString(), error: error ?? null })
      .eq('event', eventName)
      .eq('reference', paystackRef)
  }

  // transfer.* / refund.* are logged only for now; payouts are reconciled separately.
  if (eventName !== 'charge.success') {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  if (!paystackRef) {
    await markEvent('missing reference')
    return NextResponse.json({ received: true }, { status: 200 })
  }

  // Deposits and marketplace orders (server-created intents, or legacy metadata).
  const settled = await settleSuccessfulCharge(supabase, data as unknown as PaystackTransaction)
  if (settled.outcome === 'error') {
    await markEvent(settled.detail ?? 'settle error')
    // 500 makes Paystack retry; the reconcile cron is the second safety net.
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }
  if (settled.outcome !== 'ignored') {
    await markEvent(settled.outcome === 'needs_review' ? `needs_review: ${settled.detail ?? ''}` : undefined)
    return NextResponse.json({ received: true }, { status: 200 })
  }

  // ── Other payment types (metadata-driven) ────────────────────────────────
  const amountNGN = (Number(data.amount) || 0) / 100
  const currency = data.currency as string | undefined
  const payerEmail = String((data.customer as { email?: string } | undefined)?.email ?? '').trim().toLowerCase()

  const metadata = (data.metadata ?? {}) as Record<string, unknown>
  const type = metadata.type as string
  const referenceId = typeof metadata.referenceId === 'string' ? metadata.referenceId : undefined

  if (!type || amountNGN <= 0 || (currency && currency !== 'NGN')) {
    console.error('Paystack webhook: missing or invalid fields', { paystackRef, type, currency })
    await markEvent('unhandled payment')
    return NextResponse.json({ received: true }, { status: 200 })
  }

  try {
    if (type === 'campaign_donation' && referenceId) {
      const { data: campaign } = await supabase
        .from('funding')
        .select('id, title, user_id, funding_type')
        .eq('id', referenceId)
        .maybeSingle()
      if (!campaign) return NextResponse.json({ received: true }, { status: 200 })

      const donorId = await verifiedPayer(supabase, metadata.userId, payerEmail)

      // Unique on reference: a replayed webhook / the verify action can't record it twice.
      const { error: ftError } = await supabase.from('funding_transactions').insert({
        funding_id: referenceId,
        funding_type: campaign.funding_type || 'campaign',
        user_id: donorId ?? campaign.user_id,
        amount: amountNGN,
        reference: paystackRef,
        transaction_status: 'success',
        donation_visibility: donorId ? 'public' : 'anonymous',
      })
      if (ftError) {
        if (ftError.code === '23505') return NextResponse.json({ received: true }, { status: 200 })
        console.error('Paystack webhook: funding_transactions insert error', ftError)
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
      }

      if (donorId) {
        await supabase.from('transactions').insert({
          user_id: donorId,
          type: 'campaign_donation',
          amount: amountNGN,
          status: 'success',
          ref: paystackRef,
        })
      }

      if (campaign.user_id !== donorId) {
        await supabase.from('notifications').insert({
          user_id: campaign.user_id,
          actor_id: donorId,
          type: 'funding_contribution',
          reference_id: referenceId,
          read: false,
        })
      }
    } else if (type === 'insurance_premium' && referenceId) {
      const userId = await verifiedPayer(supabase, metadata.userId, payerEmail)
      if (!userId) return NextResponse.json({ received: true }, { status: 200 })

      const { data: product } = await supabase
        .from('fintech_insure_products')
        .select('id, weekly_premium, is_active')
        .eq('id', referenceId)
        .maybeSingle()
      if (!product?.is_active || amountNGN < Number(product.weekly_premium || 0)) {
        console.error('Paystack webhook: insurance premium mismatch', { paystackRef, amountNGN })
        return NextResponse.json({ received: true }, { status: 200 })
      }

      const { data: existingPolicy } = await supabase
        .from('fintech_insure_policies')
        .select('id')
        .eq('paystack_ref', paystackRef)
        .maybeSingle()

      if (!existingPolicy) {
        const startDate = new Date()
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 12)

        await supabase.from('fintech_insure_policies').insert({
          user_id: userId,
          product_id: referenceId,
          status: 'active',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          paystack_ref: paystackRef,
        })
      }
    }
    // 'course_purchase' is intentionally not handled here: paid courses go
    // through the purchase_course RPC (wallet), and a card-paid course would
    // need its price checked server-side first.
  } catch (err) {
    console.error('Paystack webhook processing error:', err)
    await markEvent(err instanceof Error ? err.message : 'processing error')
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }

  await markEvent()
  return NextResponse.json({ received: true }, { status: 200 })
}
