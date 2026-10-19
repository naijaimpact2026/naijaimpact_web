'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ensureUserRow } from '@/lib/supabase/ensure-user-row'
import { clientIp, rateLimit, RATE_LIMITED } from '@/lib/rate-limit'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'

export async function signUp(formData: {
  fullName: string
  username: string
  email: string
  password: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const cleanUsername = formData.username.trim().toLowerCase()
  const cleanEmail = formData.email.trim().toLowerCase()

  if (!(await rateLimit(`signup:ip:${await clientIp()}`, 5, 3600, { failOpen: true }))) {
    return { error: RATE_LIMITED }
  }

  // 1. Pre-flight check: verify username and email availability in public.users
  // BEFORE creating an auth user in Supabase auth to avoid orphaned/stranded auth accounts.
  // Service role: signed-out callers can't read users.
  const { data: existingUser } = await createServiceClient()
    .from('users')
    .select('id, username, email')
    .or(`username.ilike.${cleanUsername},email.ilike.${cleanEmail}`)
    .maybeSingle()

  if (existingUser) {
    if (existingUser.username && existingUser.username.toLowerCase() === cleanUsername) {
      return { error: 'Username is already taken. Please choose another.' }
    }
    if (existingUser.email && existingUser.email.toLowerCase() === cleanEmail) {
      return { error: 'An account with this email already exists. Please log in.' }
    }
  }

  // 2. Call Supabase auth.signUp
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName.trim(),
        username: cleanUsername,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Failed to create account. Please try again.' }
  }

  // 3. Pre-insert user profile row using admin client to bypass RLS for unconfirmed accounts
  const admin = createServiceClient()
  const { error: insertError } = await admin.from('users').upsert({
    id: data.user.id,
    auth_id: data.user.id,
    email: cleanEmail,
    username: cleanUsername,
    display_name: formData.fullName.trim(),
    fullname: formData.fullName.trim(),
    onboarded: false,
  }, { onConflict: 'id' })

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'Username or email is already taken.' }
    }
    console.warn('Pre-inserting user row notice:', insertError.message)
  }

  return { success: true }
}

export async function verifySignupOtp(
  email: string,
  token: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const cleanToken = token.trim()
  const cleanEmail = email.trim().toLowerCase()

  if (!(await rateLimit(`otp:email:${cleanEmail}`, 10, 600, { failOpen: true }))) {
    return { error: RATE_LIMITED }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'signup',
  })

  if (error) {
    // Fallback: some Supabase templates use 'email' confirmation type
    const fallback = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email',
    })

    if (fallback.error) {
      return { error: fallback.error.message || error.message || 'Invalid or expired verification code.' }
    }

    if (fallback.data?.user) {
      await ensureUserRow(fallback.data.user)
    }
    return { success: true }
  }

  if (data?.user) {
    await ensureUserRow(data.user)
  }

  return { success: true }
}

export async function resendSignupOtp(
  email: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const cleanEmail = email.trim().toLowerCase()

  if (!(await rateLimit(`otp-resend:email:${cleanEmail}`, 3, 600, { failOpen: true }))) {
    return { error: RATE_LIMITED }
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: cleanEmail,
  })

  if (error) {
    return { error: error.message || 'Failed to resend verification code.' }
  }

  return { success: true }
}

export async function signIn(formData: {
  email: string
  password: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const cleanEmail = formData.email.trim().toLowerCase()

  const ip = await clientIp()
  const allowed =
    (await rateLimit(`signin:ip:${ip}`, 30, 600, { failOpen: true })) &&
    (await rateLimit(`signin:email:${cleanEmail}`, 10, 600, { failOpen: true }))
  if (!allowed) return { error: RATE_LIMITED }

  const { error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: formData.password,
  })

  if (error) {
    if (error.message?.toLowerCase().includes('email not confirmed')) {
      return { error: 'Email not confirmed' }
    }
    // Never reveal which credential is wrong
    return { error: 'Invalid email or password' }
  }

  return { success: true }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  try {
    const cookieStore = await cookies()
    cookieStore.delete('onboarded')
  } catch {
    // ignore
  }
  redirect('/')
}

export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const cleanEmail = email.trim().toLowerCase()

  const allowed =
    (await rateLimit(`reset:ip:${await clientIp()}`, 10, 3600, { failOpen: true })) &&
    (await rateLimit(`reset:email:${cleanEmail}`, 3, 3600, { failOpen: true }))
  if (!allowed) return { success: false, error: RATE_LIMITED }

  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    try {
      const headerStore = await headers()
      const host = headerStore.get('x-forwarded-host') || headerStore.get('host')
      const proto = headerStore.get('x-forwarded-proto') || 'https'
      if (host) {
        siteUrl = `${proto}://${host}`
      }
    } catch {
      // fallback
    }
  }
  if (!siteUrl && process.env.VERCEL_URL) {
    siteUrl = `https://${process.env.VERCEL_URL}`
  }
  if (!siteUrl) {
    siteUrl = 'http://localhost:3000'
  }

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery&next=/auth/reset-password`,
  })

  if (error) {
    console.error('Password reset error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

