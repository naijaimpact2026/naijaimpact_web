'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, Mail, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { requestPasswordReset } from '@/lib/actions/auth'

const forgotSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage()
{
    const router = useRouter()
    const [submittedEmail, setSubmittedEmail] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotFormValues>({
        resolver: zodResolver(forgotSchema),
    })

    const onSubmit = async (values: ForgotFormValues) =>
    {
        await requestPasswordReset(values.email)
        setSubmittedEmail(values.email)
    }

    // After sending — show confirmation and redirect to OTP entry
    if (submittedEmail)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="text-center space-y-5 max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                        <Mail className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Check your email</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        We sent a 6-digit reset code to{' '}
                        <strong className="text-gray-700 dark:text-gray-200">{submittedEmail}</strong>.
                        Enter it on the next screen to set your new password.
                    </p>
                    <button
                        onClick={() =>
                            router.push(
                                `/auth/reset-password?email=${encodeURIComponent(submittedEmail)}`
                            )
                        }
                        className="w-full py-3 flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-primary/30 transition-all"
                    >
                        Enter reset code <ArrowRight className="w-4 h-4" />
                    </button>
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-6">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Hubnovo" width={36} height={36} className="rounded-lg" />
                    <Image src="/logo-wordmark.png" alt="Hubnovo" width={108} height={36} className="h-9 w-auto" />
                </Link>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password?</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Enter your email and we&apos;ll send you a 6-digit reset code.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Email address
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            {...register('email')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Sending...' : 'Send reset code'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Remember your password?{' '}
                    <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
