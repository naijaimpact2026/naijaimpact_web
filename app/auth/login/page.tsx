'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from '@/lib/actions/auth'
import { signInWithGoogle } from '@/lib/auth/google'
import { authFields } from '@/lib/validation/auth'
import { Spinner } from '@/components/ui/spinner'
import AuthShell, {
    AuthAlert,
    AuthDivider,
    GoogleButton,
    authFieldError,
    authInput,
    authLabel,
    authLink,
    authPrimaryButton,
} from '@/components/auth/AuthShell'

const loginSchema = z.object(authFields)

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const searchParams = useSearchParams()
    const [showPassword, setShowPassword] = useState(false)
    const [serverError, setServerError] = useState('')
    const [unconfirmedEmail, setUnconfirmedEmail] = useState('')
    const [googleLoading, setGoogleLoading] = useState(false)

    // Where to land after a successful sign-in — set by middleware when it
    // bounces an unauthenticated visitor here from a deep link, so they end
    // up back where they were headed instead of always on the generic /app.
    const next = searchParams.get('next') || '/app'

    useEffect(() =>
    {
        if (searchParams.get('error') === 'oauth')
        {
            setServerError('Google sign-in failed. Please try again.')
        }
    }, [searchParams])

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const handleGoogleSignIn = async () => {
        setServerError('')
        setGoogleLoading(true)

        const { error } = await signInWithGoogle(next)

        if (error) {
            setServerError(error)
            setGoogleLoading(false)
        }
        // On success the browser navigates away to Google, so googleLoading
        // is intentionally left true — there's no "after" state to reset it in.
    }

    const onSubmit = async (values: LoginFormValues) => {
        setServerError('')
        setUnconfirmedEmail('')

        const result = await signIn({
            email: values.email,
            password: values.password,
        })

        if (result?.error) {
            if (result.error.toLowerCase().includes('email not confirmed')) {
                setUnconfirmedEmail(values.email)
                setServerError('Your email address has not been verified yet.')
            } else {
                setServerError('Invalid email or password')
            }
        } else if (result?.success) {
            // Full document navigation ensures the browser immediately persists all auth cookies
            window.location.href = next
        }
    }

    return (
        <AuthShell
            panel="login"
            topRight={
                <>
                    <span className="hidden sm:inline">New to Hubnovo? </span>
                    <Link href="/auth/signup" className={authLink}>
                        Create account
                    </Link>
                </>
            }
        >
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink">
                Sign in to Hubnovo
            </h1>
            <p className="mt-2 text-[15px] text-slate-500">
                Welcome back. Enter your details to continue.
            </p>

            {serverError && (
                <div className="mt-6">
                    <AuthAlert>
                        <p>{serverError}</p>
                        {unconfirmedEmail && (
                            <Link
                                href={`/auth/verify?email=${encodeURIComponent(unconfirmedEmail)}`}
                                className="mt-1.5 inline-block font-semibold underline underline-offset-2"
                            >
                                Enter your 6-digit verification code
                            </Link>
                        )}
                    </AuthAlert>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
                <div>
                    <label htmlFor="email" className={authLabel}>
                        Email address
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        {...register('email')}
                        className={authInput}
                    />
                    {errors.email && <p className={authFieldError}>{errors.email.message}</p>}
                </div>

                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium text-ink">
                            Password
                        </label>
                        <Link href="/auth/forgot-password" className={`text-sm ${authLink}`}>
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="Enter your password"
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
                    {errors.password && <p className={authFieldError}>{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className={`${authPrimaryButton} !mt-7`}>
                    {isSubmitting ? (
                        <>
                            <Spinner className="h-5 w-5" />
                            Signing in…
                        </>
                    ) : (
                        'Sign in'
                    )}
                </button>
            </form>

            <AuthDivider />

            <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} label="Continue with Google" />
        </AuthShell>
    )
}
