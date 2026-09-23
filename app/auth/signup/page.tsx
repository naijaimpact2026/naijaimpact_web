'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail } from 'lucide-react'
import Image from 'next/image'
import { signUp } from '@/lib/actions/auth'
import { signInWithGoogle } from '@/lib/auth/google'
import { authFields } from '@/lib/validation/auth'
import { Spinner } from '@/components/ui/spinner'
import HelpPopover from '@/components/auth/HelpPopover'
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
            ...authFields,
        })

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
            const searchParams = useSearchParams()
            const [showPassword, setShowPassword] = useState(false)
            const [serverError, setServerError] = useState('')
            const [successEmail, setSuccessEmail] = useState('')
            const [googleLoading, setGoogleLoading] = useState(false)

            const next = searchParams.get('next') || '/app'

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
                    setSuccessEmail(values.email)
                }
            }
        
            // Email confirmation success screen
            if (successEmail)
            {
                return (
                    <div className="min-h-screen flex items-center justify-center bg-background p-6">
                        <div className="text-center space-y-4 max-w-sm">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                                <Mail className="w-7 h-7 text-emerald-600" />
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
                <div className="h-screen flex bg-[#050F20] overflow-hidden">
            
                    {/* =========================================================
                        LEFT — SLIDESHOW
                    ========================================================= */}
                    <div className="hidden lg:block lg:w-[52%] h-screen overflow-hidden">
                        <SignupSlideshow />
                    </div>
            
            
                    {/* =========================================================
                        RIGHT — SIGNUP FORM
                    ========================================================= */}
                    <div className="w-full lg:w-[48%] h-screen relative flex items-center justify-center bg-[#050F20] px-6 overflow-hidden">
            
                        {/* Help */}
                        <div className="absolute top-8 right-10 hidden lg:block">
                            <HelpPopover
                                description="Having trouble creating your account? Check your details or contact the Hubnovo team."
                                links={[
                                    { href: '/auth/login', label: 'Already have an account? Sign in' },
                                    { href: '/#contact', label: 'Contact Hubnovo', primary: true },
                                ]}
                            />
                        </div>
        
                        <div className="w-full max-w-[440px]">
            
                            {/* =================================================
                                MOBILE LOGO
                            ================================================= */}
                            <Link
                                href="/"
                                className="flex items-center gap-2 mb-9 lg:hidden"
                            >
                                <Image
                                    src="/logo.png"
                                    alt="Hubnovo"
                                    width={40}
                                    height={40}
                                    className="rounded-xl"
                                />
            
                                <Image
                                    src="/logo-wordmark.png"
                                    alt="Hubnovo"
                                    width={120}
                                    height={40}
                                    className="h-10 w-auto"
                                />
                            </Link>
            
            
                            {/* =================================================
                                HEADER
                            ================================================= */}
                            <div className="mb-5">
            
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 mb-4">
            
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            
                                    <span className="text-[11px] font-medium tracking-wide text-cyan-300">
                                        JOIN HUBNOVO
                                    </span>
            
                                </div>
            
                                <h1 className="text-[34px] leading-tight font-bold tracking-tight text-white">
                                    Create account
                                </h1>
            
                                <p className="mt-2 text-[15px] text-slate-400">
                                    Join the community and start making an impact.
                                </p>
            
                            </div>
            
            
                            {/* =================================================
                                SERVER ERROR
                            ================================================= */}
                            {serverError && (
                                <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                    {serverError}
                                </div>
                            )}
            
            
                            {/* =================================================
                                FORM
                            ================================================= */}
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="space-y-3"
                            >
            
                                {/* Full Name */}
                                <div>
            
                                    <label className="block mb-2 text-sm font-medium text-slate-200">
                                        Full Name
                                    </label>
            
                                    <input
                                        type="text"
                                        placeholder="Chioma Okafor"
                                        {...register('fullName')}
                                        className="w-full h-[50px] rounded-xl border border-[#3A5D87] bg-[#132541] px-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 hover:border-[#5278A5]"
                                    />
            
                                    {errors.fullName && (
                                        <p className="mt-1.5 text-xs text-red-400">
                                            {errors.fullName.message}
                                        </p>
                                    )}
            
                                </div>
            
            
                                {/* Username */}
                                <div>
            
                                    <label className="block mb-2 text-sm font-medium text-slate-200">
                                        Username
                                    </label>
            
                                    <div className="relative">
            
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                            @
                                        </span>
            
                                        <input
                                            type="text"
                                            placeholder="chioma_builds"
                                            {...register('username')}
                                            className="w-full h-[50px] rounded-xl border border-[#3A5D87] bg-[#132541] pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 hover:border-[#5278A5]"
                                        />
            
                                    </div>
            
                                    {errors.username && (
                                        <p className="mt-1.5 text-xs text-red-400">
                                            {errors.username.message}
                                        </p>
                                    )}
            
                                </div>
            
            
                                {/* Email */}
                                <div>
            
                                    <label className="block mb-2 text-sm font-medium text-slate-200">
                                        Email
                                    </label>
            
                                    <div className="relative">
            
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            {...register('email')}
                                            className="w-full h-[50px] rounded-xl border border-[#3A5D87] bg-[#132541] pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 hover:border-[#5278A5]"
                                        />
            
                                    </div>
            
                                    {errors.email && (
                                        <p className="mt-1.5 text-xs text-red-400">
                                            {errors.email.message}
                                        </p>
                                    )}
            
                                </div>
            
            
                                {/* Password */}
                                <div>
            
                                    <label className="block mb-2 text-sm font-medium text-slate-200">
                                        Password
                                    </label>
            
                                    <div className="relative">
            
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Minimum 8 characters"
                                            {...register('password')}
                                            className="w-full h-[50px] rounded-xl border border-[#3A5D87] bg-[#132541] px-4 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 hover:border-[#5278A5]"
                                        />
            
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                            aria-label={
                                                showPassword
                                                    ? 'Hide password'
                                                    : 'Show password'
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
            
                                    </div>
            
                                    {errors.password && (
                                        <p className="mt-1.5 text-xs text-red-400">
                                            {errors.password.message}
                                        </p>
                                    )}
            
                                </div>
            
            
                                {/* =================================================
                                    CREATE ACCOUNT
                                ================================================= */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="group w-full h-[56px] mt-2 rounded-xl bg-gradient-to-r from-[#168BFF] via-[#12BCE0] to-[#2CE69B] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(20,190,220,0.22)] hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
            
                                    {isSubmitting ? (
                                        <>
                                            <Spinner className="w-5 h-5" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create account
            

                                        </>
                                    )}
            
                                </button>
            
                            </form>
            
            
                            {/* =================================================
                                DIVIDER
                            ================================================= */}
                            <div className="flex items-center gap-4 my-4">
            
                                <div className="flex-1 h-px bg-slate-800" />
            
                                <span className="text-xs text-slate-500">
                                    or
                                </span>
            
                                <div className="flex-1 h-px bg-slate-800" />
            
                            </div>
            
            
                            {/* =================================================
                                GOOGLE
                            ================================================= */}
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={googleLoading}
                                className="w-full h-[50px] rounded-xl border border-[#3A5D87] bg-transparent text-white font-medium text-sm flex items-center justify-center gap-3 transition-all hover:bg-white/[0.04] hover:border-[#5278A5] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
            
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-sm font-bold">
                                    <span className="text-[#4285F4]">
                                        G
                                    </span>
                                </span>
            
                                {googleLoading ? 'Connecting to Google...' : 'Sign up with Google'}
            
                            </button>
            
            
                            {/* =================================================
                                LOGIN
                            ================================================= */}
                            <p className="text-center text-sm text-slate-500 mt-4">
            
                                Already have an account?{' '}
            
                                <Link
                                    href="/auth/login"
                                    className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                    Sign in
                                </Link>
            
                            </p>
            
                        </div>
 
            
                    </div>
            

                    </div>
            )
        }
