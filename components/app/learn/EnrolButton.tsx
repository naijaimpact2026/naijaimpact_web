'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { enrolCourse } from '@/lib/actions/learn'

interface EnrolButtonProps
{
    courseId: string
    amount: number
    isFree: boolean
    alreadyEnrolled: boolean
}

export default function EnrolButton({ courseId, amount, isFree, alreadyEnrolled }: EnrolButtonProps)
{
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (alreadyEnrolled)
    {
        return (
            <button
                className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}
                onClick={() => router.push(`/app/learn`)}
            >
                Continue Learning
            </button>
        )
    }

    async function handleEnrol()
    {
        setLoading(true)
        setError(null)
        try
        {
            if (isFree)
            {
                await enrolCourse(courseId)
                router.refresh()
            } else
            {
                // Paid courses — redirect to wallet/payment flow
                // For now show a message; paid Paystack flow can be wired up later
                setError('Paid course purchase coming soon. Add funds to your wallet.')
            }
        } catch (err)
        {
            setError(err instanceof Error ? err.message : 'Enrolment failed')
        } finally
        {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleEnrol}
                disabled={loading}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isFree ? 'Enrolling…' : 'Processing…'}
                    </span>
                ) : isFree ? (
                    'Enrol for Free'
                ) : (
                    `Purchase — ₦${amount.toLocaleString('en-NG')}`
                )}
            </button>
            {error && <p className="text-xs text-rose-500 text-center">{error}</p>}
        </div>
    )
}
