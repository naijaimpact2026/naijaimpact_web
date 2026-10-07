'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { requestPasswordReset } from '@/lib/actions/auth'
import AuthShell, {
    authFieldError,
    authInput,
    authLabel,
    authLink,
    authPrimaryButton,
} from '@/components/auth/AuthShell'

const forgotSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

function BackToLogin()
{
    return (
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
        </Link>
    )
}

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
            <AuthShell panel="secure">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
                    <Mail className="h-6 w-6 text-brand" />
                </span>
                <h1 className="mt-6 font-display text-3xl font-bold tracking-[-0.02em] text-ink">
                    Check your email
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                    We sent a 6-digit reset code to{' '}
                    <span className="font-semibold text-ink">{submittedEmail}</span>. Enter it on the
                    next screen to set a new password.
                </p>
                <button
                    type="button"
                    onClick={() =>
                        router.push(`/auth/reset-password?email=${encodeURIComponent(submittedEmail)}`)
                    }
                    className={`${authPrimaryButton} mt-8`}
                >
                    Enter reset code
                </button>
                <div className="mt-6 text-center">
                    <BackToLogin />
                </div>
            </AuthShell>
        )
    }

    return (
        <AuthShell panel="secure">
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink">
                Reset your password
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                Enter the email linked to your account and we&apos;ll send you a 6-digit reset code.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
                <div>
                    <label htmlFor="email" className={authLabel}>
                        Email address
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...register('email')}
                        className={authInput}
                    />
                    {errors.email && <p className={authFieldError}>{errors.email.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className={authPrimaryButton}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Sending…' : 'Send reset code'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Remember your password?{' '}
                <Link href="/auth/login" className={authLink}>
                    Sign in
                </Link>
            </p>
        </AuthShell>
    )
}
