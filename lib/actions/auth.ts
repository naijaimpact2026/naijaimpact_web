'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

/**
 * Admin Supabase client that bypasses RLS to safely manage user profile records.
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, serviceKey ?? anonKey, {
    auth: { persistSession: false },
  })
}

async function ensureUserRow(user: { id: string; user_metadata?: Record<string, any> }) {
  const admin = getAdminClient()
  const { data: existing } = await admin
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!existing) {
    const username = user.user_metadata?.username || `user_${user.id.slice(0, 8)}`
    const displayName = user.user_metadata?.full_name || 'Hubnovo Member'
    await admin.from('users').insert({
      id: user.id,
      auth_id: user.id,
      username,
      display_name: displayName,
      onboarded: false,
    })
  }
}

export async function signUp(formData: {
  fullName: string
  username: string
  email: string
  password: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
        username: formData.username,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Failed to create account. Please try again.' }
  }

  // Pre-insert user profile row using admin client to bypass RLS for unconfirmed accounts
  const admin = getAdminClient()
  const { error: insertError } = await admin.from('users').insert({
    id: data.user.id,
    auth_id: data.user.id,
    username: formData.username,
    display_name: formData.fullName,
    onboarded: false,
  })

  if (insertError) {
    // Duplicate username or email
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

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: cleanToken,
    type: 'signup',
  })

  if (error) {
    // Fallback: some Supabase templates use 'email' confirmation type
    const fallback = await supabase.auth.verifyOtp({
      email,
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

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
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

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
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
  redirect('/')
}

export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/reset-password`,
  })

  return { success: true }
}
