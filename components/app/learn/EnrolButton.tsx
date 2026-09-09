'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Loader2,
    PlayCircle,
    LockKeyhole,
} from 'lucide-react'
import { enrolCourse } from '@/lib/actions/learn'

interface EnrolButtonProps
{
    courseId: string
    amount: number
    isFree: boolean
    alreadyEnrolled: boolean
}

export default function EnrolButton({
    courseId,
    amount,
    isFree,
    alreadyEnrolled,
}: EnrolButtonProps)
{
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /*
     * Already enrolled
     */
    if (alreadyEnrolled)
    {
        return (
            <button
                type="button"
                onClick={() => router.push('/app/learn')}
                className="
                    flex w-full items-center
                    justify-center gap-2
                    rounded-lg
                    bg-emerald-700
                    px-5 py-3
                    text-sm font-semibold
                    text-white
                    shadow-sm
                    transition-all
                    hover:bg-emerald-800
                    hover:shadow-md
                    active:scale-[0.99]
                "
            >
                <PlayCircle className="h-4 w-4" />
                Continue learning
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
            }
            else
            {
                // Paid courses — redirect to wallet/payment flow
                // Paystack can be wired here later.
                setError(
                    'Paid course purchase is coming soon. Add funds to your wallet.'
                )
            }
        }
        catch (err)
        {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Enrolment failed'
            )
        }
        finally
        {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-3">

            <button
                type="button"
                onClick={handleEnrol}
                disabled={loading}
                className="
                    flex w-full items-center
                    justify-center gap-2
                    rounded-lg
                    bg-emerald-700
                    px-5 py-3
                    text-sm font-semibold
                    text-white
                    shadow-sm
                    transition-all
                    hover:bg-emerald-800
                    hover:shadow-md
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                "
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isFree
                            ? 'Enrolling…'
                            : 'Processing…'
                        }
                    </>
                ) : isFree ? (
                    <>
                        <PlayCircle className="h-4 w-4" />
                        Enrol for free
                    </>
                ) : (
                    <>
                        <LockKeyhole className="h-4 w-4" />
                        Purchase — ₦
                        {amount.toLocaleString('en-NG')}
                    </>
                )}
            </button>

            {error && (
                <div className="
                    rounded-lg
                    border border-rose-100
                    bg-rose-50
                    px-3 py-2.5
                    text-center
                ">
                    <p className="
                        text-xs
                        leading-relaxed
                        text-rose-600
                    ">
                        {error}
                    </p>
                </div>
            )}

            {!alreadyEnrolled && (
                <p className="
                    text-center
                    text-[11px]
                    text-slate-400
                ">
                    {isFree
                        ? 'Start learning immediately'
                        : 'Secure payment coming soon'
                    }
                </p>
            )}
        </div>
    )
}