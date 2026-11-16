'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { checkMyPendingPayments } from '@/lib/actions/wallet'

const POLL_MS = 15_000
const MAX_POLLS = 8 // ~2 minutes while payments are still in progress

/**
 * Invisible. On mount, checks the signed-in user's unconfirmed Paystack
 * payments and credits any that went through, then refreshes the page. While
 * some are still in progress (e.g. a bank transfer), it re-checks for a couple
 * of minutes. Drop it on any page that shows balances or orders.
 */
export default function PendingPaymentsCheck()
{
    const router = useRouter()

    useEffect(() =>
    {
        let cancelled = false
        let timer: ReturnType<typeof setTimeout> | undefined
        let polls = 0

        const run = async () =>
        {
            const res = await checkMyPendingPayments().catch(() => null)
            if (cancelled || !res?.success || !res.data) return

            const fresh = res.data.settled.filter((s) => !s.alreadyProcessed)
            if (fresh.length > 0)
            {
                const total = fresh.reduce((sum, s) => sum + s.amountNGN, 0)
                toast.success(
                    fresh.length === 1
                        ? `Payment of ₦${total.toLocaleString('en-NG')} confirmed.`
                        : `${fresh.length} payments (₦${total.toLocaleString('en-NG')}) confirmed.`
                )
                router.refresh()
            }

            if (res.data.pending.length > 0 && ++polls < MAX_POLLS)
            {
                timer = setTimeout(run, POLL_MS)
            }
        }

        void run()
        return () =>
        {
            cancelled = true
            if (timer) clearTimeout(timer)
        }
    }, [router])

    return null
}
