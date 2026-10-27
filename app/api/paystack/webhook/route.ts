import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

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

const sameAmount = (a: number, b: number) => Math.abs(a - b) < 0.01

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

  // Only process charge.success
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const data = event.data as Record<string, unknown>
  const paystackRef = data.reference as string
  const amountNGN = (Number(data.amount) || 0) / 100
  const currency = data.currency as string | undefined
  const payerEmail = String((data.customer as { email?: string } | undefined)?.email ?? '').trim().toLowerCase()

  const metadata = (data.metadata ?? {}) as Record<string, unknown>
  const type = metadata.type as string
  const referenceId = typeof metadata.referenceId === 'string' ? metadata.referenceId : undefined

  if (!paystackRef || !type || amountNGN <= 0 || (currency && currency !== 'NGN')) {
    console.error('Paystack webhook: missing or invalid fields', { paystackRef, type, currency })
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const supabase = getAdminClient()

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
    } else if (type === 'deposit') {
      const userId = await verifiedPayer(supabase, metadata.userId, payerEmail)
      if (!userId || amountNGN < 100) return NextResponse.json({ received: true }, { status: 200 })

      // Idempotent per reference (shared with verifyAndProcessDeposit).
      const { error } = await supabase.rpc('web_wallet_credit', {
        p_user_id: userId,
        p_amount: amountNGN,
        p_type: 'deposit',
        p_ref: paystackRef,
      })
      if (error) {
        console.error('Paystack webhook: deposit credit error', error)
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
      }
    } else if (type === 'marketplace_purchase') {
      const buyerId = await verifiedPayer(supabase, metadata.userId, payerEmail)
      const orderIds: string[] = Array.isArray(metadata.orderIds)
        ? (metadata.orderIds as unknown[]).filter((id): id is string => typeof id === 'string')
        : referenceId ? [referenceId] : []
      if (!buyerId || orderIds.length === 0) return NextResponse.json({ received: true }, { status: 200 })

      const { data: orders } = await supabase
        .from('nm_orders')
        .select('id, buyer_id, total_amount, status, seller_profile:nm_seller_profiles(user_id)')
        .in('id', orderIds)

      const payable = (orders ?? []).filter((o) => o.buyer_id === buyerId && o.status === 'pending')
      const due = payable.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

      // The amount paid must cover exactly these orders — metadata is client-supplied.
      if (payable.length !== orderIds.length || !sameAmount(due, amountNGN)) {
        console.error('Paystack webhook: marketplace amount/order mismatch', { paystackRef, due, amountNGN })
        return NextResponse.json({ received: true }, { status: 200 })
      }

      for (const order of payable) {
        // One ledger row per order; the unique (ref, type) index makes replays no-ops.
        const { error: txError } = await supabase.from('transactions').insert({
          user_id: order.buyer_id,
          type: 'marketplace_purchase',
          amount: order.total_amount,
          status: 'success',
          ref: `${paystackRef}:${order.id}`,
        })
        if (txError) continue

        // Confirm the order (paid — escrow held, not yet released to seller)
        await supabase
          .from('nm_orders')
          .update({ status: 'confirmed', updated_at: new Date().toISOString() })
          .eq('id', order.id)
          .eq('status', 'pending')

        await supabase
          .from('nm_escrow')
          .update({ status: 'funded', funded_at: new Date().toISOString() })
          .eq('order_id', order.id)

        const sellerUserId = (order as { seller_profile?: { user_id?: string } | null }).seller_profile?.user_id
        if (sellerUserId) {
          await supabase.from('notifications').insert({
            user_id: sellerUserId,
            actor_id: order.buyer_id,
            type: 'marketplace_order',
            reference_id: order.id,
            read: false,
          })
        }
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
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
