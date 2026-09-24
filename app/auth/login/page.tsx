'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    Users,
    FolderCheck,
    MapPin,
} from 'lucide-react'
import Image from 'next/image'
import { signIn } from '@/lib/actions/auth'
import { signInWithGoogle } from '@/lib/auth/google'
import { authFields } from '@/lib/validation/auth'
import { Spinner } from '@/components/ui/spinner'
import HelpPopover from '@/components/auth/HelpPopover'

const loginSchema = z.object(authFields)

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showPassword, setShowPassword] = useState(false)
    const [serverError, setServerError] = useState('')
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

        const result = await signIn({
            email: values.email,
            password: values.password,
        })

        if (result?.error) {
            setServerError('Invalid email or password')
        } else if (result?.success) {
            // Use client-side navigation — server-action redirect()
            // is unreliable on iOS Safari/Chrome due to cookies + redirects.
            router.push(next)
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen flex bg-[#050F20]">

            {/* =========================================================
                LEFT — BRAND PANEL
            ========================================================= */}
            <div
                className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col"
                style={{
                    background:
                        'linear-gradient(135deg, #19B5E6 0%, #087FD0 45%, #064EB3 100%)',
                }}
            >



                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none">

                    <div
                        className="absolute inset-0"
                        style={{
                            background: `
                                radial-gradient(
                                    circle at 15% 15%,
                                    rgba(255,255,255,0.25) 0%,
                                    transparent 30%
                                ),
                                radial-gradient(
                                    circle at 85% 25%,
                                    rgba(0,255,214,0.20) 0%,
                                    transparent 30%
                                ),
                                radial-gradient(
                                    circle at 45% 80%,
                                    rgba(0,125,255,0.25) 0%,
                                    transparent 45%
                                )
                            `,
                        }}
                    />

                    {/* Decorative shapes */}
                    <div className="absolute -right-32 -bottom-32 w-[480px] h-[480px] rounded-full border border-white/10" />

                    <div className="absolute -right-20 -bottom-20 w-[350px] h-[350px] rounded-full bg-cyan-300/10 blur-sm" />

                    <div className="absolute right-[-100px] bottom-[-120px] w-[320px] h-[320px] rounded-full bg-emerald-300/20" />

                    <div className="absolute left-[-150px] top-[35%] w-[300px] h-[300px] rounded-full bg-white/5 blur-3xl" />

                </div>


                {/* =====================================================
                    LOGO
                ===================================================== */}
                <div className="relative z-10 px-14 pt-12">

                    <Link
                        href="/"
                        className="inline-flex items-center gap-3"
                    >
                        <Image
                            src="/logo.png"
                            alt="Hubnovo"
                            width={64}
                            height={64}
                            className="rounded-2xl shadow-xl"
                        />

                        <Image
                            src="/logo-wordmark.png"
                            alt="Hubnovo"
                            width={190}
                            height={64}
                            className="h-14 w-auto"
                        />

                    </Link>

                </div>


                {/* =====================================================
                    MAIN BRAND CONTENT
                ===================================================== */}
                <div className="relative z-10 flex-1 flex items-center px-14">

                    <div className="max-w-2xl">

                        {/* Label */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm mb-7">

                            <span className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,255,190,0.9)]" />

                            <span className="text-xs font-medium tracking-wide text-white/85">
                                BUILT FOR NIGERIA
                            </span>

                        </div>


                        {/* Heading */}
                        <h2 className="text-5xl xl:text-[62px] font-bold leading-[1.03] tracking-[-0.035em] text-white">

                            Connect.
                            <br />

                            Build.
                            <br />

                            <span
                                style={{
                                    backgroundImage:
                                        'linear-gradient(100deg, #FFFFFF 0%, #D9FBFF 35%, #42F2C8 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                Impact Nigeria.
                            </span>

                        </h2>


                        {/* Description */}
                        <p className="mt-7 max-w-xl text-lg xl:text-xl leading-relaxed text-white/80">
                            Join a growing community of builders,
                            entrepreneurs, and change-makers creating
                            opportunities and real impact across Nigeria.
                        </p>


                        {/* =================================================
                            STATS
                        ================================================= */}
                        <div className="flex items-center mt-11">

                            {/* Members */}
                            <div className="flex items-center gap-3 pr-8">

                                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-white/10">
                                    <Users className="w-5 h-5 text-emerald-200" />
                                </div>

                                <div>
                                    <div className="text-xl font-bold text-white">
                                        50K+
                                    </div>

                                    <div className="text-xs text-white/60 mt-0.5">
                                        Members
                                    </div>
                                </div>

                            </div>


                            <div className="w-px h-12 bg-white/20" />


                            {/* Projects */}
                            <div className="flex items-center gap-3 px-8">

                                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-white/10">
                                    <FolderCheck className="w-5 h-5 text-cyan-200" />
                                </div>

                                <div>
                                    <div className="text-xl font-bold text-white">
                                        100+
                                    </div>

                                    <div className="text-xs text-white/60 mt-0.5">
                                        Projects
                                    </div>
                                </div>

                            </div>


                            <div className="w-px h-12 bg-white/20" />


                            {/* States */}
                            <div className="flex items-center gap-3 pl-8">

                                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-white/10">
                                    <MapPin className="w-5 h-5 text-emerald-200" />
                                </div>

                                <div>
                                    <div className="text-xl font-bold text-white">
                                        36
                                    </div>

                                    <div className="text-xs text-white/60 mt-0.5">
                                        States
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    BOTTOM NAVIGATION
                ===================================================== */}
                <div className="relative z-10 px-14 pb-10">

                    <div className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.2em] text-white/55">

                        <span>IDEAS</span>
                        <span className="text-white/25">/</span>

                        <span>SKILLS</span>
                        <span className="text-white/25">/</span>

                        <span>OPPORTUNITIES</span>
                        <span className="text-white/25">/</span>

                        <span>IMPACT</span>

                    </div>

                </div>

            </div>



            {/* =========================================================
                RIGHT — LOGIN PANEL
            ========================================================= */}
            <div className="w-full lg:w-[48%] relative flex items-center justify-center bg-[#050F20] px-6 py-12">

                {/* Help */}
                <div className="absolute top-9 right-10 hidden lg:block">
                    <HelpPopover
                        description="Having trouble signing in? Check your details or contact the Hubnovo team."
                        links={[
                            { href: '/auth/forgot-password', label: 'Reset your password' },
                            { href: '/auth/signup', label: 'Create an account' },
                            { href: '/#contact', label: 'Contact Hubnovo', primary: true },
                        ]}
                    />
                </div>

                <div className="w-full max-w-[440px]">

                    {/* Mobile logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 mb-10 lg:hidden"
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
                    <div className="mb-9">

                        <h1 className="text-[38px] leading-tight font-bold tracking-tight text-white">
                            Welcome back
                        </h1>

                        <p className="mt-2 text-[15px] text-slate-400">
                            Sign in to continue to Hubnovo
                        </p>


                    </div>


                    {/* Server error */}
                    {serverError && (
                        <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {serverError}
                        </div>
                    )}


                    {/* =================================================
                        LOGIN FORM
                    ================================================= */}
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-5"
                    >

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
                                    className="w-full h-[56px] rounded-xl border border-[#3A5D87] bg-[#132541] pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 hover:border-[#5278A5]"
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

                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />

                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    {...register('password')}
                                    className="w-full h-[56px] rounded-xl border border-[#3A5D87] bg-[#132541] pl-12 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 hover:border-[#5278A5]"
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

                            <div className="flex justify-end mt-2.5">

                                <Link
                                    href="/auth/forgot-password"
                                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                    Forgot password?
                                </Link>

                            </div>

                        </div>


                        {/* =================================================
                            SIGN IN BUTTON
                        ================================================= */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group w-full h-[56px] rounded-xl bg-gradient-to-r from-[#168BFF] via-[#12BCE0] to-[#2CE69B] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(20,190,220,0.22)] hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
                        >

                            {isSubmitting ? (
                                <>
                                    <Spinner className="w-5 h-5" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                </>
                            )}

                        </button>

                    </form>

                    {/* =================================================
                        DIVIDER
                    ================================================= */}
                    <div className="flex items-center gap-4 my-7">

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
                        className="w-full h-[54px] rounded-xl border border-[#3A5D87] bg-transparent text-white font-medium text-sm flex items-center justify-center gap-3 transition-all hover:bg-white/[0.04] hover:border-[#5278A5] disabled:opacity-60 disabled:cursor-not-allowed"
                    >

                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-sm font-bold">
                            <span className="text-[#4285F4]">
                                G
                            </span>
                        </span>

                        {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}

                    </button>


                    {/* =================================================
                        SIGN UP
                    ================================================= */}
                    <p className="text-center text-sm text-slate-500 mt-9">

                        Don't have an account?{' '}

                        <Link
                            href="/auth/signup"
                            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            Sign up
                        </Link>

                    </p>

                </div>

            </div>

        </div>
    )
}
