// Server-only Paystack helpers. Never import from client components.

export interface PaystackTransaction {
  reference: string
  status: string // success | failed | abandoned | ongoing | pending | processing | queued | reversed
  amount: number // kobo
  currency: string
  gateway_response?: string
  customer?: { email?: string }
  metadata?: Record<string, unknown> | string | null
}

export type VerifyResult =
  | { ok: true; tx: PaystackTransaction }
  | { ok: false; notFound: boolean; message: string }

/** Look a transaction up on Paystack by reference. Never throws. */
export async function paystackVerify(reference: string): Promise<VerifyResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return { ok: false, notFound: false, message: 'PAYSTACK_SECRET_KEY is not set' }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    const body = await res.json().catch(() => null)
    if (res.ok && body?.status && body.data) return { ok: true, tx: body.data as PaystackTransaction }

    const message: string = body?.message ?? `Paystack returned ${res.status}`
    // Paystack answers 400 "Transaction reference not found" for refs it never saw
    // (the buyer closed checkout before paying).
    return { ok: false, notFound: /not found/i.test(message), message }
  } catch (err) {
    return { ok: false, notFound: false, message: err instanceof Error ? err.message : 'Network error' }
  }
}

/** Paystack sends metadata as an object, but older clients may send a JSON string. */
export function parseMetadata(metadata: PaystackTransaction['metadata']): Record<string, unknown> {
  if (!metadata) return {}
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return metadata
}
