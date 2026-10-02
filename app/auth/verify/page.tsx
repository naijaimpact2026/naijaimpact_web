'use client'

import { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, ArrowLeft, Mail, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react'
import { verifySignupOtp, resendSignupOtp } from '@/lib/actions/auth'

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    refs.current[0]?.focus()
  }, [])

  const update = (idx: number, char: string) => {
    const next = [...value]
    next[idx] = char.slice(-1)
    onChange(next)
    if (char && idx < 5) refs.current[idx + 1]?.focus()
  }

  const onKey = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && idx < 5) {
      refs.current[idx + 1]?.focus()
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const next = Array(6).fill('')
    text.split('').forEach((c, i) => {
      next[i] = c
    })
    onChange(next)
    refs.current[Math.min(text.length, 5)]?.focus()
  }

  return (
    <div className="flex gap-2.5 sm:gap-3 justify-center">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            value={value[i] ?? ''}
            onChange={(e) => update(i, e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => onKey(i, e)}
            onPaste={onPaste}
            className="w-11 sm:w-12 h-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-xl sm:rounded-2xl border-2 border-[#1E3A58] bg-[#0c1f33] text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 transition-all disabled:opacity-50"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
    </div>
  )
}

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const next = searchParams.get('next') || '/app/settings/onboarding'

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Resend cooldown timer (60s)
  const [cooldown, setCooldown] = useState(60)
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Automatically verify when all 6 digits are entered
  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('')
    if (code.length < 6) {
      setError('Please enter all 6 digits.')
      return
    }

    if (!email) {
      setError('No email address provided. Please return to the signup page.')
      return
    }

    setVerifying(true)
    setError('')
    setResendStatus('')

    const res = await verifySignupOtp(email, code)

    if (res.error) {
      setVerifying(false)
      setError(
        res.error.toLowerCase().includes('expired') || res.error.toLowerCase().includes('invalid')
          ? 'Verification code is invalid or has expired. Please request a new code.'
          : res.error
      )
      return
    }

    setSuccess(true)
    setVerifying(false)

    // Smooth redirect to onboarding or next
    setTimeout(() => {
      router.push(next)
      router.refresh()
    }, 800)
  }

  // Handle digit change and auto-trigger on complete 6 digits
  const handleDigitsChange = (newDigits: string[]) => {
    setDigits(newDigits)
    setError('')
    const code = newDigits.join('')
    if (code.length === 6 && !verifying) {
      handleVerify(code)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return
    setResending(true)
    setError('')
    setResendStatus('')

    const res = await resendSignupOtp(email)
    setResending(false)

    if (res.error) {
      setError(res.error)
    } else {
      setResendStatus('A new 6-digit code has been sent to your email.')
      setCooldown(60)
      setDigits(Array(6).fill(''))
    }
  }

  return (
    <div className="min-h-screen flex bg-[#050F20] text-foreground">
      {/* ── Left Column: Brand Graphic / Hero (matching auth screens) ── */}
      <div
        className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col justify-between p-12 text-white"
        style={{
          background: 'linear-gradient(135deg, #0A1E33 0%, #102A43 55%, #004D73 100%)',
        }}
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/logo.png" alt="Hubnovo" width={36} height={36} className="rounded-xl shadow-md" />
            <Image src="/logo-wordmark.png" alt="Hubnovo" width={110} height={32} className="h-7 w-auto" />
          </Link>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 backdrop-blur-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Security & Trust in Every Step
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            We confirm every new member account with a secure one-time verification code to keep your identity, wallet, and community interactions safe.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} Hubnovo. People. Opportunities. Prosperity.
        </div>
      </div>

      {/* ── Right Column: Verification Form ── */}
      <div className="w-full lg:w-[52%] flex items-center justify-center px-6 py-12 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Hubnovo" width={32} height={32} className="rounded-lg" />
              <Image src="/logo-wordmark.png" alt="Hubnovo" width={95} height={28} className="h-6 w-auto" />
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Mail className="w-3.5 h-3.5" /> Email Verification
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enter verification code
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              We sent a 6-digit confirmation code to{' '}
              {email ? (
                <span className="font-semibold text-white break-all">{email}</span>
              ) : (
                'your email address'
              )}
              .
            </p>
          </div>

          {/* Status Banners */}
          {error && (
            <div className="p-3.5 rounded-xl border border-red-500/25 bg-red-500/10 text-red-400 text-xs sm:text-sm leading-relaxed">
              {error}
            </div>
          )}

          {resendStatus && (
            <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{resendStatus}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span className="font-semibold">Email verified! Redirecting to setup...</span>
            </div>
          )}

          {/* OTP Input Component */}
          <div className="space-y-6 pt-1">
            <OtpInput value={digits} onChange={handleDigitsChange} disabled={verifying || success} />

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={verifying || success || digits.join('').length < 6}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Code...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </div>

          {/* Resend & Navigation Links */}
          <div className="pt-2 border-t border-[#1E3A58]/60 space-y-3.5 text-center text-xs sm:text-sm">
            <div className="flex items-center justify-center gap-1.5 text-slate-400">
              <span>Didn't receive the code?</span>
              {cooldown > 0 ? (
                <span className="font-semibold text-slate-300">
                  Resend in <span className="text-cyan-400">{cooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Resend Code
                </button>
              )}
            </div>

            <div className="text-slate-500 text-xs">
              Wrong email address?{' '}
              <Link href="/auth/signup" className="text-slate-300 hover:text-white underline font-medium">
                Change email / Back to signup
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050F20]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
