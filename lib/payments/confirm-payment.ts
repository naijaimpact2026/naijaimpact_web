'use client'

import { checkMyPendingPayments } from '@/lib/actions/wallet'

export type ConfirmOutcome =
    | { status: 'settled'; amountNGN: number }
    | { status: 'pending' } // Paystack hasn't confirmed yet (e.g. bank transfer); credited automatically later
    | { status: 'failed' }
    | { status: 'error'; message: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Confirm one Paystack payment (deposit or marketplace order) with the server
 * right after checkout. Paystack can take a few seconds to mark a charge
 * successful, so this retries while it is still pending.
 */
export async function confirmPayment(
    reference: string,
    { attempts = 6, intervalMs = 3000 }: { attempts?: number; intervalMs?: number } = {}
): Promise<ConfirmOutcome>
{
    let lastError = ''
    for (let i = 0; i < attempts; i++)
    {
        if (i > 0) await sleep(intervalMs)
        const res = await checkMyPendingPayments(reference).catch((err: unknown) => ({
            success: false as const,
            error: err instanceof Error ? err.message : 'Network error',
        }))
        if (!res.success)
        {
            lastError = res.error
            continue
        }
        const data = res.data!
        const hit = data.settled.find((s) => s.reference === reference)
        if (hit) return { status: 'settled', amountNGN: hit.amountNGN }
        if (data.failed.includes(reference)) return { status: 'failed' }
    }
    return lastError ? { status: 'error', message: lastError } : { status: 'pending' }
}
