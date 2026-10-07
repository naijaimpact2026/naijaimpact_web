'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import { verifySignupOtp, resendSignupOtp } from '@/lib/actions/auth'
import OtpInput from '@/components/auth/OtpInput'
import AuthShell, { AuthAlert, authLink, authPrimaryButton } from '@/components/auth/AuthShell'

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
    <AuthShell
      panel="secure"
      topRight={
        <Link href="/auth/signup" className={authLink}>
          Back to sign up
        </Link>
      }
    >
      <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink">
        Verify your email
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
        Enter the 6-digit code we sent to{' '}
        {email ? <span className="break-all font-semibold text-ink">{email}</span> : 'your email address'}.
      </p>

      <div className="mt-8 space-y-6">
        <OtpInput value={digits} onChange={handleDigitsChange} disabled={verifying || success} />

        {error && <AuthAlert>{error}</AuthAlert>}

        {resendStatus && <AuthAlert tone="success">{resendStatus}</AuthAlert>}

        {success && (
          <AuthAlert tone="success">
            <span className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              Email verified. Setting up your account…
            </span>
          </AuthAlert>
        )}

        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={verifying || success || digits.join('').length < 6}
          className={authPrimaryButton}
        >
          {verifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : success ? (
            'Verified'
          ) : (
            'Verify and continue'
          )}
        </button>
      </div>

      <div className="mt-8 space-y-3 border-t border-line pt-6 text-center text-sm text-slate-500">
        <p>
          Didn&apos;t get the code?{' '}
          {cooldown > 0 ? (
            <span className="font-medium text-ink">Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className={`inline-flex items-center gap-1 ${authLink}`}
            >
              {resending && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Resend code
            </button>
          )}
        </p>
        <p>
          Wrong email?{' '}
          <Link href="/auth/signup" className={authLink}>
            Change it
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
