'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ensureUserRow } from '@/lib/supabase/ensure-user-row'
import {
  clientIp,
  rateLimit,
  RATE_LIMITED,
} from '@/lib/rate-limit'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'

type ActionResult = {
  success?: boolean
  error?: string
}

// ============================================================
// SIGN UP
// ============================================================

export async function signUp(formData: {
  email: string
  password: string
  fullName?: string
}): Promise<ActionResult> {
  const supabase = await createClient()

  const cleanEmail = formData.email.trim().toLowerCase()
  const cleanFullName = formData.fullName?.trim() || ''

  // Rate limit sign-up attempts by IP.
  const ip = await clientIp()

  if (
    !(await rateLimit(`signup:ip:${ip}`, 5, 3600, {
      failOpen: true,
    }))
  ) {
    return { error: RATE_LIMITED }
  }

  // Check whether a profile with this email already exists.
  const admin = createServiceClient()

  const { data: existingUser, error: lookupError } = await admin
    .from('users')
    .select('id')
    .ilike('email', cleanEmail)
    .maybeSingle()

  if (lookupError) {
    console.error('Sign-up email lookup failed:', lookupError.message)
    return { error: 'Unable to create your account right now. Please try again.' }
  }

  if (existingUser) {
    return {
      error: 'An account with this email already exists. Please log in.',
    }
  }

  // Temporary username used until onboarding is completed.
  const temporaryUsername = `user_${crypto.randomUUID()
    .replace(/-/g, '')
    .slice(0, 12)}`

  // Create the Supabase Auth user.
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: formData.password,
    options: {
      data: {
        ...(cleanFullName
          ? {
              full_name: cleanFullName,
              name: cleanFullName,
            }
          : {}),
        username: temporaryUsername,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return {
      error: 'Failed to create account. Please try again.',
    }
  }

  // Create the public profile row using the service-role client.
  // The service key must never be exposed to the browser.
  const displayName = cleanFullName || 'Hubnovo Member'

  const { error: insertError } = await admin.from('users').upsert(
    {
      id: data.user.id,
      auth_id: data.user.id,
      email: cleanEmail,
      username: `user_${data.user.id.replace(/-/g, '').slice(0, 12)}`,
      display_name: displayName,
      fullname: displayName,
      onboarded: false,
    },
    { onConflict: 'id' }
  )

  if (insertError) {
    console.error('User profile creation failed:', insertError.message)

    return {
      error:
        'Your authentication account was created, but your profile could not be saved. Please contact support if this persists.',
    }
  }

  return { success: true }
}

// ============================================================
// VERIFY SIGN-UP OTP
// ============================================================

export async function verifySignupOtp(
  email: string,
  token: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const cleanEmail = email.trim().toLowerCase()
  const cleanToken = token.trim()

  if (
    !(await rateLimit(`otp:email:${cleanEmail}`, 10, 600, {
      failOpen: true,
    }))
  ) {
    return { error: RATE_LIMITED }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'signup',
  })

  // Some Supabase email templates use the "email" OTP type.
  if (error) {
    const fallback = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email',
    })

    if (fallback.error) {
      return {
        error:
          fallback.error.message ||
          error.message ||
          'Invalid or expired verification code.',
      }
    }

    if (fallback.data.user) {
      await ensureUserRow(fallback.data.user)
    }

    return { success: true }
  }

  if (data.user) {
    await ensureUserRow(data.user)
  }

  return { success: true }
}

// ============================================================
// RESEND SIGN-UP OTP
// ============================================================

export async function resendSignupOtp(
  email: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const cleanEmail = email.trim().toLowerCase()

  if (
    !(await rateLimit(
      `otp-resend:email:${cleanEmail}`,
      3,
      600,
      { failOpen: true }
    ))
  ) {
    return { error: RATE_LIMITED }
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: cleanEmail,
  })

  if (error) {
    return {
      error: error.message || 'Failed to resend verification code.',
    }
  }

  return { success: true }
}

// ============================================================
// SIGN IN
// ============================================================

export async function signIn(formData: {
  email: string
  password: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const cleanEmail = formData.email.trim().toLowerCase()

  const ip = await clientIp()

  const ipAllowed = await rateLimit(
    `signin:ip:${ip}`,
    30,
    600,
    { failOpen: true }
  )

  const emailAllowed = await rateLimit(
    `signin:email:${cleanEmail}`,
    10,
    600,
    { failOpen: true }
  )

  if (!ipAllowed || !emailAllowed) {
    return { error: RATE_LIMITED }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: formData.password,
  })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Email not confirmed' }
    }

    return { error: 'Invalid email or password.' }
  }

  return { success: true }
}

// ============================================================
// SIGN-OUT FEEDBACK
// ============================================================

export async function recordSignOutFeedback(feedback: {
  rating?: string
  note?: string
}): Promise<void> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (feedback.rating || feedback.note) {
      console.info('[SignOut Feedback]', {
        userId: user?.id ?? null,
        rating: feedback.rating,
        note: feedback.note,
        timestamp: new Date().toISOString(),
      })
    }
  } catch {
    // Feedback is optional and must not interrupt sign-out.
  }
}

// ============================================================
// SIGN OUT
// ============================================================

export async function signOut(): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign-out failed:', error.message)
  }

  try {
    const cookieStore = await cookies()
    cookieStore.delete('onboarded')
  } catch {
    // Ignore cookie cleanup errors.
  }

  redirect('/')
}

// ============================================================
// REQUEST PASSWORD RESET
// ============================================================

export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const cleanEmail = email.trim().toLowerCase()

  const ip = await clientIp()

  const ipAllowed = await rateLimit(
    `reset:ip:${ip}`,
    10,
    3600,
    { failOpen: true }
  )

  const emailAllowed = await rateLimit(
    `reset:email:${cleanEmail}`,
    3,
    3600,
    { failOpen: true }
  )

  if (!ipAllowed || !emailAllowed) {
    return { success: false, error: RATE_LIMITED }
  }

  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!siteUrl) {
    try {
      const headerStore = await headers()
      const host =
        headerStore.get('x-forwarded-host') ||
        headerStore.get('host')

      const proto =
        headerStore.get('x-forwarded-proto') || 'https'

      if (host) {
        siteUrl = `${proto}://${host}`
      }
    } catch {
      // Continue to environment-variable fallbacks.
    }
  }

  if (!siteUrl && process.env.VERCEL_URL) {
    siteUrl = `https://${process.env.VERCEL_URL}`
  }

  if (!siteUrl) {
    siteUrl = 'http://localhost:3000'
  }

  const { error } = await supabase.auth.resetPasswordForEmail(
    cleanEmail,
    {
      redirectTo: `${siteUrl}/auth/callback?type=recovery&next=/auth/reset-password`,
    }
  )

  if (error) {
    console.error('Password reset error:', error.message)

    return {
      success: false,
      error: error.message,
    }
  }

  return { success: true }
}