import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Build a Supabase admin client that bypasses RLS for webhook writes.
// Falls back to anon client if service role key is not set.
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createSupabaseClient(url, serviceKey ?? anonKey, {
    auth: { persistSession: false },
  })
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

  // Verify HMAC-SHA512
  const expectedSig = crypto
    .createHmac('sha512', paystackSecret)
    .update(rawBody)
    .digest('hex')

  if (expectedSig !== signature) {
    console.warn('Paystack webhook: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.event as string

  // Only process charge.success
  if (eventType !== 'charge.success') {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const data = event.data as Record<string, unknown>
  const paystackRef = data.reference as string
  const amountKobo = data.amount as number
  const amountNGN = amountKobo / 100

  const metadata = (data.metadata ?? {}) as Record<string, unknown>
  const type = metadata.type as string
  const userId = metadata.userId as string
  const referenceId = metadata.referenceId as string | undefined

  if (!paystackRef || !userId || !type) {
    console.error('Paystack webhook: missing required metadata fields', { paystackRef, userId, type })
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const supabase = getAdminClient()

  // Idempotency check: skip if transaction already recorded
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('paystack_ref', paystackRef)
    .maybeSingle()

  if (existing) {
    // Already processed
    return NextResponse.json({ received: true }, { status: 200 })
  }

  try {
    if (type === 'campaign_donation' && referenceId) {
      // 1. Insert transaction
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'campaign_donation',
        amount: amountNGN,
        status: 'success',
        reference_id: referenceId,
        paystack_ref: paystackRef,
        description: `Donation to campaign`,
      })

      if (txError) {
        console.error('Paystack webhook: transaction insert error', txError)
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
      }

      // 2. Credit wallet (upsert)
      const { data: wallet } = await supabase
        .from('wallet')
        .select('id, balance')
        .eq('user_id', userId)
        .maybeSingle()

      if (wallet) {
        await supabase
          .from('wallet')
          .update({ balance: wallet.balance + amountNGN, updated_at: new Date().toISOString() })
          .eq('id', wallet.id)
      } else {
        await supabase.from('wallet').insert({
          user_id: userId,
          balance: amountNGN,
        })
      }

      // 3. Update campaign amount_raised and donor_count
      const { data: campaign } = await supabase
        .from('funding')
        .select('amount_raised, donor_count')
        .eq('id', referenceId)
        .maybeSingle()

      if (campaign) {
        await supabase
          .from('funding')
          .update({
            amount_raised: campaign.amount_raised + amountNGN,
            donor_count: campaign.donor_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', referenceId)
      }
    } else if (type === 'deposit') {
      // 1. Insert deposit transaction
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'deposit',
        amount: amountNGN,
        status: 'success',
        paystack_ref: paystackRef,
        description: 'Wallet deposit via Paystack',
      })

      if (txError) {
        console.error('Paystack webhook: deposit transaction insert error', txError)
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
      }

      // 2. Credit wallet
      const { data: wallet } = await supabase
        .from('wallet')
        .select('id, balance')
        .eq('user_id', userId)
        .maybeSingle()

      if (wallet) {
        await supabase
          .from('wallet')
          .update({ balance: wallet.balance + amountNGN, updated_at: new Date().toISOString() })
          .eq('id', wallet.id)
      } else {
        await supabase.from('wallet').insert({
          user_id: userId,
          balance: amountNGN,
        })
      }
    } else if (type === 'course_purchase' && referenceId) {
      // Insert transaction; enrollment is handled separately
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'course_purchase',
        amount: amountNGN,
        status: 'success',
        reference_id: referenceId,
        paystack_ref: paystackRef,
        description: 'Course purchase',
      })

      // Enrol user in the course
      await supabase.from('course_enrollments').upsert(
        {
          user_id: userId,
          course_id: referenceId,
          status: 'active',
          progress: 0,
        },
        { onConflict: 'user_id,course_id', ignoreDuplicates: true }
      )
    } else if (type === 'marketplace_purchase' && referenceId) {
      // referenceId = marketplace_orders.id
      const { data: order } = await supabase
        .from('marketplace_orders')
        .select('id,buyer_id,seller_id,total_amount,product_id,status,quantity')
        .eq('id', referenceId)
        .maybeSingle()

      if (order && order.status === 'pending_payment') {
        // 1. Insert buyer transaction
        await supabase.from('transactions').insert({
          user_id: order.buyer_id,
          type: 'transfer_debit',
          amount: order.total_amount,
          status: 'success',
          reference_id: referenceId,
          paystack_ref: paystackRef,
          description: 'Marketplace purchase — escrow held',
        })

        // 2. Update order to paid (escrow held — funds NOT yet released to seller)
        await supabase.from('marketplace_orders').update({
          status: 'paid',
          escrow_held: true,
          paystack_ref: paystackRef,
          updated_at: new Date().toISOString(),
        }).eq('id', referenceId)

        // 3. Decrement product stock
        const { data: product } = await supabase
          .from('marketplace_products')
          .select('stock_quantity')
          .eq('id', order.product_id)
          .maybeSingle()

        if (product) {
          const newStock = Math.max(0, (product.stock_quantity ?? 0) - (order.quantity ?? 1))
          await supabase.from('marketplace_products').update({
            stock_quantity: newStock,
            status: newStock === 0 ? 'sold' : 'active',
            updated_at: new Date().toISOString(),
          }).eq('id', order.product_id)
        }

        // 4. Notify seller
        await supabase.from('notifications').insert({
          user_id: order.seller_id,
          actor_id: order.buyer_id,
          type: 'marketplace_order',
          reference_id: referenceId,
          read: false,
        }).then(() => {})
      }
    } else if (type === 'insurance_premium' && referenceId) {
      // Idempotency: skip if policy already exists for this paystack_ref
      const { data: existingPolicy } = await supabase
        .from('fintech_insure_policies')
        .select('id')
        .eq('paystack_ref', paystackRef)
        .maybeSingle()

      if (!existingPolicy) {
        await supabase.from('transactions').insert({
          user_id: userId,
          type: 'insurance_premium',
          amount: amountNGN,
          status: 'success',
          reference_id: referenceId,
          paystack_ref: paystackRef,
          description: 'Insurance premium payment',
        })

        // Fetch the product to determine policy duration
        // DB column is `duration_months` (per schema); also check `coverage_months` as fallback
        const { data: product } = await supabase
          .from('fintech_insure_products')
          .select('duration_months, coverage_months')
          .eq('id', referenceId)
          .maybeSingle()

        const durationMonths =
          (product as any)?.duration_months ??
          (product as any)?.coverage_months ??
          12

        const startDate = new Date()
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + durationMonths)

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
  } catch (err) {
    console.error('Paystack webhook processing error:', err)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
