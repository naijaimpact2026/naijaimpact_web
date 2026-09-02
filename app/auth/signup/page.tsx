'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { signUp } from '@/lib/actions/auth'
import SignupSlideshow from '../signup-slideshow/signupSlideshow'

const signupSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .regex(
            /^[a-z0-9_]+$/,
            'Username can only contain lowercase letters, numbers, and underscores'
        ),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage()
{
    const [showPassword, setShowPassword] = useState(false)
    const [serverError, setServerError] = useState('')
    const [successEmail, setSuccessEmail] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    })

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
            setSuccessEmail(values.email)
        }
    }

    // Email confirmation success screen
    if (successEmail)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-6">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                        <span className="text-3xl">📧</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Check your email</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        We sent a confirmation link to{' '}
                        <strong className="text-gray-700 dark:text-gray-200">{successEmail}</strong>. Click it
                        to activate your account.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex">
    
            {/* Left — slideshow */}
            <div className="hidden lg:block lg:w-1/2 min-h-screen">
                <SignupSlideshow />
            </div>
    
            {/* Right — form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white dark:bg-slate-950 overflow-y-auto">
                <div className="w-full max-w-sm space-y-7 py-8">
    
                    <div>
                        <div className="flex items-center gap-2 mb-6 lg:hidden">
                            <Image src="/logo.png" alt="NaijaImpact" width={36} height={36} className="rounded-lg" />
                            <span className="font-bold text-lg text-gray-900 dark:text-white">NaijaImpact</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                            Free forever. No credit card needed.
                        </p>
                    </div>

                    {serverError && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                placeholder="Chioma Okafor"
                                {...register('fullName')}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                            {errors.fullName && (
                                <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Username
                            </label>
                            <input
                                type="text"
                                placeholder="chioma_builds"
                                {...register('username')}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                            {errors.username && (
                                <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
                            )}
                        </div>

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
                                    placeholder="Min. 8 characters"
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
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
