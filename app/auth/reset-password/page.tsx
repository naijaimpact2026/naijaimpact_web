'use client'

// app/auth/reset-password/page.tsx
// Handles OTP-based password reset.
// Supabase sends a 6-digit code to the user's email.
// Step 1: enter the code to verify identity.
// Step 2: set a new password.

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OtpInput from '@/components/auth/OtpInput'
import AuthShell, {
    AuthAlert,
    authFieldError,
    authInput,
    authLabel,
    authLink,
    authPrimaryButton,
} from '@/components/auth/AuthShell'

// ── Schemas ───────────────────────────────────────────────────────────────────

const passwordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'At least 8 characters')
            .regex(/[A-Z]/, 'Must contain an uppercase letter')
            .regex(/[0-9]/, 'Must contain a number'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type PasswordFormValues = z.infer<typeof passwordSchema>

type Step = 'otp' | 'password' | 'success'

// ── Main page ─────────────────────────────────────────────────────────────────

function ResetPasswordContent()
{
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') ?? ''

    const [step, setStep] = useState<Step>('otp')
    const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
    const [otpError, setOtpError] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [formError, setFormError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) })

    // Automatically advance to password step if the user arrived via a verified recovery link
    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setStep('password')
            }
        })
    }, [])

    useEffect(() => {
        if (searchParams.get('error') === 'invalid_code') {
            setOtpError('The reset link is invalid or has expired. Please request a new one.')
        }
    }, [searchParams])


    // ── Step 1: verify OTP ────────────────────────────────────────────────────

    const verifyOtp = async () =>
    {
        const code = digits.join('')
        if (code.length < 6)
        {
            setOtpError('Enter all 6 digits.')
            return
        }

        if (!email)
        {
            setOtpError('Email not found. Please start from the forgot password page.')
            return
        }

        setVerifying(true)
        setOtpError('')

        const supabase = createClient()
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: 'recovery',
        })

        setVerifying(false)

        if (error)
        {
            setOtpError(error.message === 'Token has expired or is invalid'
                ? 'Code is incorrect or has expired. Request a new one.'
                : error.message)
            return
        }

        setStep('password')
    }

    // ── Step 2: set new password ──────────────────────────────────────────────

    const onSubmitPassword = async (values: PasswordFormValues) =>
    {
        setFormError('')
        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password: values.password })

        if (error)
        {
            setFormError(error.message)
            return
        }

        await supabase.auth.signOut()
        setStep('success')
        setTimeout(() => router.push('/auth/login'), 3000)
    }

    // ── Success ───────────────────────────────────────────────────────────────

    if (step === 'success')
    {
        return (
            <AuthShell panel="secure">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
                    <CheckCircle2 className="h-6 w-6 text-brand" />
                </span>
                <h1 className="mt-6 font-display text-3xl font-bold tracking-[-0.02em] text-ink">
                    Password updated
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                    Your password has been changed. Taking you to sign in…
                </p>
                <Link href="/auth/login" className={`${authPrimaryButton} mt-8`}>
                    Sign in now
                </Link>
            </AuthShell>
        )
    }

    return (
        <AuthShell panel="secure">
            {/* ── OTP step ── */}
            {step === 'otp' && (
                <>
                    <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink">
                        Enter reset code
                    </h1>
                    <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                        We sent a 6-digit code to{' '}
                        <span className="font-semibold text-ink">{email || 'your email'}</span>.
                    </p>

                    <div className="mt-8 space-y-6">
                        <OtpInput value={digits} onChange={setDigits} />

                        {otpError && <AuthAlert>{otpError}</AuthAlert>}

                        <button
                            type="button"
                            onClick={verifyOtp}
                            disabled={verifying || digits.join('').length < 6}
                            className={authPrimaryButton}
                        >
                            {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                            {verifying ? 'Verifying…' : 'Verify code'}
                        </button>

                        <p className="text-center text-sm text-slate-500">
                            Didn&apos;t get a code?{' '}
                            <Link href="/auth/forgot-password" className={authLink}>
                                Send a new one
                            </Link>
                        </p>
                    </div>
                </>
            )}

            {/* ── Password step ── */}
            {step === 'password' && (
                <>
                    <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink">
                        Set a new password
                    </h1>
                    <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                        Choose a strong password you haven&apos;t used before.
                    </p>

                    {formError && (
                        <div className="mt-6">
                            <AuthAlert>{formError}</AuthAlert>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmitPassword)} className="mt-8 space-y-5" noValidate>
                        <div>
                            <label htmlFor="password" className={authLabel}>
                                New password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    {...register('password')}
                                    className={`${authInput} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:text-ink"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password ? (
                                <p className={authFieldError}>{errors.password.message}</p>
                            ) : (
                                <p className="mt-1.5 text-sm text-slate-500">
                                    At least 8 characters, one uppercase letter and one number.
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className={authLabel}>
                                Confirm new password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    {...register('confirmPassword')}
                                    className={`${authInput} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:text-ink"
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className={authFieldError}>{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button type="submit" disabled={isSubmitting} className={`${authPrimaryButton} !mt-7`}>
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Updating…' : 'Update password'}
                        </button>
                    </form>
                </>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
                Remember your password?{' '}
                <Link href="/auth/login" className={authLink}>
                    Sign in
                </Link>
            </p>
        </AuthShell>
    )
}

// ── Page export — wraps content in Suspense for useSearchParams ───────────────

export default function ResetPasswordPage()
{
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-white">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
