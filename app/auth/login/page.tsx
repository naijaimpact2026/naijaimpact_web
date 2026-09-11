'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { signIn } from '@/lib/actions/auth'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage()
{
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [serverError, setServerError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (values: LoginFormValues) =>
    {
        setServerError('')
        const result = await signIn({ email: values.email, password: values.password })
        if (result?.error)
        {
            setServerError('Invalid email or password')
        } else if (result?.success)
        {
            // Use client-side navigation — server-action redirect() is unreliable
            // on iOS Safari/Chrome due to how it handles cookies + redirects.
            router.push('/app/feed')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left — brand panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 relative overflow-hidden flex-col items-center justify-center p-12">
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 30% 40%, hsl(166,76%,40%) 0%, transparent 50%), radial-gradient(circle at 70% 70%, hsl(199,100%,43%) 0%, transparent 50%)',
                    }}
                />
                <div className="relative z-10 text-center space-y-6">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <Image src="/logo.png" alt="HubNovo" width={52} height={52} className="rounded-xl" />
                        <span className="text-white font-bold text-2xl">HubNovo</span>
                    </div>
                    <h2 className="text-4xl font-bold text-white leading-tight">
                        Connect. Build.
                        <br />
                        Impact Nigeria.
                    </h2>
                    <p className="text-slate-300 text-lg max-w-sm">
                        Join 50,000+ community builders, entrepreneurs, and change-makers on one platform.
                    </p>
                    <div className="flex justify-center gap-8 pt-6">
                        {[
                            { n: '50K+', l: 'Members' },
                            { n: '100+', l: 'Projects' },
                            { n: '36', l: 'States' },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl font-bold text-emerald-400">{s.n}</div>
                                <div className="text-slate-400 text-sm">{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right — form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white dark:bg-slate-950">
                <div className="w-full max-w-sm space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-6 lg:hidden">
                            <Image src="/logo.png" alt="HubNovo" width={36} height={36} className="rounded-lg" />
                            <span className="font-bold text-lg text-gray-900 dark:text-white">HubNovo</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Sign in to your account</p>
                    </div>

                    {serverError && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Email
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

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    {...register('password')}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                            )}
                            <div className="text-right mt-1.5">
                                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        {"Don't have an account? "}
                        <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
