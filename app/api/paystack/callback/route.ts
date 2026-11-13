import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { completeCharge, type CompleteKind } from '@/lib/payments/complete'
import { paystackVerify, parseMetadata } from '@/lib/payments/paystack'

/*
 * Paystack callback — set this as the Callback URL in the Paystack dashboard
 * (Settings → API Keys & Webhooks): https://<domain>/api/paystack/callback
 *
 * Paystack sends the customer here after a redirect checkout with
 * ?reference=…&trxref=…. The query string is NOT trusted: the reference is
 * verified with Paystack's API, the payment is completed (same code as the
 * webhook, idempotent), and the customer is redirected to the right page with
 * ?payment=success | review | pending | failed.
 *
 * Insurance premiums are left to the webhook (their table has no unique
 * reference key yet, so two writers at once could create two policies).
 */

export const dynamic = 'force-dynamic'

const REF_RE = /^[A-Za-z0-9_.=-]{6,120}$/

function destination(kind: CompleteKind | string, targetId?: string): string {
  switch (kind) {
    case 'deposit': return '/app/wallet'
    case 'marketplace_order': return '/app/market/orders'
    case 'campaign_donation': return targetId ? `/app/funding/${encodeURIComponent(targetId)}` : '/app/funding'
    case 'insurance_premium': return '/app/fintech/insure'
    default: return '/app/wallet'
  }
}

function go(request: NextRequest, path: string, status: 'success' | 'review' | 'pending' | 'failed', reference?: string) {
  const url = new URL(path, request.url)
  url.searchParams.set('payment', status)
  if (reference) url.searchParams.set('reference', reference)
  return NextResponse.redirect(url, 303)
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const reference = (params.get('reference') || params.get('trxref') || '').trim()
  if (!REF_RE.test(reference)) return go(request, '/app/wallet', 'failed')

  // Each hit calls the Paystack API; keep it bounded per visitor.
  if (!(await rateLimit(`paystack-callback:${await clientIp(request)}`, 30, 60, { failOpen: true }))) {
    return go(request, '/app/wallet', 'pending', reference)
  }

  const verified = await paystackVerify(reference)
  if (!verified.ok) {
    // Unknown reference (checkout closed before paying) or Paystack unreachable: the webhook/cron will catch up.
    return go(request, '/app/wallet', verified.notFound ? 'failed' : 'pending', reference)
  }

  const tx = { ...verified.tx, metadata: parseMetadata(verified.tx.metadata) }
  const metaType = typeof tx.metadata.type === 'string' ? tx.metadata.type : ''
  const metaTarget = typeof tx.metadata.referenceId === 'string' ? tx.metadata.referenceId : undefined

  if (tx.status !== 'success') {
    const failed = ['failed', 'abandoned', 'reversed'].includes(tx.status)
    return go(request, destination(metaType, metaTarget), failed ? 'failed' : 'pending', reference)
  }

  if (metaType === 'insurance_premium') return go(request, destination(metaType), 'pending', reference)

  const result = await completeCharge(createServiceClient(), tx)
  const page = destination(result.kind !== 'unknown' ? result.kind : metaType, result.targetId ?? metaTarget)
  if (result.outcome === 'done') return go(request, page, 'success', reference)
  if (result.outcome === 'needs_review') return go(request, page, 'review', reference)
  return go(request, page, 'pending', reference)
}
