'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { signUp } from '@/lib/actions/auth'
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

const signupSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .regex(
            /^[a-zA-Z0-9_]+$/,
            'Username can only contain letters, numbers, and underscores'
        )
        .transform((v) => v.toLowerCase()),
    ...authFields,
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showPassword, setShowPassword] = useState(false)
    const [serverError, setServerError] = useState('')
    const [googleLoading, setGoogleLoading] = useState(false)

    const next = searchParams.get('next') || '/app/settings/onboarding'

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
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

    const onSubmit = async (values: SignupFormValues) =>
    {
        setServerError('')
        const result = await signUp({
            fullName: values.fullName,
            username: values.username,
            email: values.email,
            password: values.password,
        })
        if (result.error)
        {
            setServerError(result.error)
        } else
        {
            router.push(`/auth/verify?email=${encodeURIComponent(values.email)}&next=${encodeURIComponent(next)}`)
        }
    }

    return (
        <AuthShell
            panel="signup"
            topRight={
                <>
                    <span className="hidden sm:inline">Have an account? </span>
                    <Link href="/auth/login" className={authLink}>
                        Sign in
                    </Link>
                </>
            }
        >
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink">
                Create your free account
            </h1>
            <p className="mt-2 text-[15px] text-slate-500">
                It takes about two minutes. No fees to join.
            </p>

            <div className="mt-8">
                <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} label="Sign up with Google" />
            </div>

            <AuthDivider />

            {serverError && (
                <div className="mb-5">
                    <AuthAlert>{serverError}</AuthAlert>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                    <label htmlFor="fullName" className={authLabel}>
                        Full name
                    </label>
                    <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="Chioma Okafor"
                        {...register('fullName')}
                        className={authInput}
                    />
                    {errors.fullName && <p className={authFieldError}>{errors.fullName.message}</p>}
                </div>

                <div>
                    <label htmlFor="username" className={authLabel}>
                        Username
                    </label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-slate-400">
                            @
                        </span>
                        <input
                            id="username"
                            type="text"
                            autoComplete="username"
                            placeholder="chioma_builds"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            {...register('username')}
                            className={`${authInput} pl-8`}
                        />
                    </div>
                    {errors.username && <p className={authFieldError}>{errors.username.message}</p>}
                </div>

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
                    <label htmlFor="password" className={authLabel}>
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
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

                <button type="submit" disabled={isSubmitting} className={`${authPrimaryButton} !mt-6`}>
                    {isSubmitting ? (
                        <>
                            <Spinner className="h-5 w-5" />
                            Creating account…
                        </>
                    ) : (
                        'Create account'
                    )}
                </button>
            </form>

            <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
                By creating an account, you agree to our{' '}
                <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-ink">
                    Privacy Policy
                </Link>
                .
            </p>
        </AuthShell>
    )
}
