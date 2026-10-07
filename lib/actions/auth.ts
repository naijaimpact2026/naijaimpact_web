'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'

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

export async function ensureUserRow(
  user: { id: string; email?: string; user_metadata?: Record<string, any> },
  authenticatedClient?: SupabaseClient
) {
  const client = authenticatedClient ?? getAdminClient()
  const cleanEmail = (user.email || '').trim().toLowerCase()

  const { data: existing } = await client
    .from('users')
    .select('id, auth_id, username, display_name, fullname')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}${cleanEmail ? `,email.eq.${cleanEmail}` : ''}`)
    .maybeSingle()

  if (!existing) {
    const rawUsername = user.user_metadata?.username || (cleanEmail ? cleanEmail.split('@')[0] : `user_${user.id.slice(0, 8)}`)
    const cleanUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 25) || `user_${user.id.slice(0, 8)}`
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || 'Hubnovo Member'
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

    await client.from('users').upsert({
      id: user.id,
      auth_id: user.id,
      email: cleanEmail,
      username: cleanUsername,
      display_name: displayName,
      fullname: displayName,
      avatar_url: avatarUrl,
      onboarded: false,
    }, { onConflict: 'id' })
  } else if (!existing.auth_id || existing.auth_id !== user.id) {
    await client.from('users').update({ auth_id: user.id }).eq('id', existing.id)
  }
}

export async function signUp(formData: {
  fullName: string
  username: string
  email: string
  password: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const cleanUsername = formData.username.trim().toLowerCase()
  const cleanEmail = formData.email.trim().toLowerCase()

  // 1. Pre-flight check: verify username and email availability in public.users
  // BEFORE creating an auth user in Supabase auth to avoid orphaned/stranded auth accounts.
  const { data: existingUser } = await supabase
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
  const admin = getAdminClient()
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
      await ensureUserRow(fallback.data.user, supabase as unknown as SupabaseClient)
    }
    return { success: true }
  }

  if (data?.user) {
    await ensureUserRow(data.user, supabase as unknown as SupabaseClient)
  }

  return { success: true }
}

export async function resendSignupOtp(
  email: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
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

