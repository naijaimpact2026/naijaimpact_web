'use client'

// app/auth/reset-password/page.tsx
// Handles OTP-based password reset.
// Supabase sends a 6-digit code to the user's email.
// Step 1: enter the code to verify identity.
// Step 2: set a new password.

import { useState, useRef, KeyboardEvent, ClipboardEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

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

// ── OTP digit input ───────────────────────────────────────────────────────────

function OtpInput({
    value,
    onChange,
}: {
    value: string[]
    onChange: (v: string[]) => void
})
{
    const refs = useRef<(HTMLInputElement | null)[]>([])

    const update = (idx: number, char: string) =>
    {
        const next = [...value]
        next[idx] = char.slice(-1)
        onChange(next)
        if (char && idx < 5) refs.current[idx + 1]?.focus()
    }

    const onKey = (idx: number, e: KeyboardEvent<HTMLInputElement>) =>
    {
        if (e.key === 'Backspace' && !value[idx] && idx > 0)
        {
            refs.current[idx - 1]?.focus()
        }
    }

    const onPaste = (e: ClipboardEvent<HTMLInputElement>) =>
    {
        e.preventDefault()
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (!text) return
        const next = Array(6).fill('')
        text.split('').forEach((c, i) => { next[i] = c })
        onChange(next)
        refs.current[Math.min(text.length, 5)]?.focus()
    }

    return (
        <div className="flex gap-3 justify-center">
            {Array(6).fill(0).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] ?? ''}
                    onChange={(e) => update(i, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => onKey(i, e)}
                    onPaste={onPaste}
                    className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                    aria-label={`Digit ${i + 1}`}
                />
            ))}
        </div>
    )
}

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

    const inputCls =
        'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'

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
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-6">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Password updated!</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Your password has been changed. Redirecting you to sign in…
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Sign in now
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-6">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="NaijaImpact" width={36} height={36} className="rounded-lg" />
                    <span className="font-bold text-lg text-gray-900 dark:text-white">NaijaImpact</span>
                </div>

                {/* ── OTP step ── */}
                {step === 'otp' && (
                    <>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enter reset code</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                                We sent a 6-digit code to{' '}
                                <strong className="text-gray-700 dark:text-gray-200">
                                    {email || 'your email'}
                                </strong>.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <OtpInput value={digits} onChange={setDigits} />

                            {otpError && (
                                <p className="text-center text-sm text-red-500">{otpError}</p>
                            )}

                            <button
                                onClick={verifyOtp}
                                disabled={verifying || digits.join('').length < 6}
                                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                                {verifying ? 'Verifying…' : 'Verify code'}
                            </button>

                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                Didn&apos;t receive a code?{' '}
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-primary font-semibold hover:underline"
                                >
                                    Resend
                                </Link>
                            </p>
                        </div>
                    </>
                )}

                {/* ── Password step ── */}
                {step === 'password' && (
                    <>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set new password</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                                Choose a strong password for your account.
                            </p>
                        </div>

                        {formError && (
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    New password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...register('password')}
                                        className={inputCls + ' pr-10'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        aria-label={showPassword ? 'Hide' : 'Show'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-400">
                                    At least 8 characters, one uppercase letter, one number
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Confirm new password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...register('confirmPassword')}
                                        className={inputCls + ' pr-10'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        aria-label={showConfirm ? 'Hide' : 'Show'}
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSubmitting ? 'Updating…' : 'Update password'}
                            </button>
                        </form>
                    </>
                )}

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

// ── Page export — wraps content in Suspense for useSearchParams ───────────────

export default function ResetPasswordPage()
{
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
