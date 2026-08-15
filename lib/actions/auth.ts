'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  // Insert a row in the users table
  const { error: insertError } = await supabase.from('users').insert({
    auth_id: data.user.id,
    username: formData.username,
    display_name: formData.fullName,
    onboarded: false,
  })

  if (insertError) {
    // Surface duplicate username/email errors
    if (insertError.code === '23505') {
      return { error: 'Username or email is already taken.' }
    }
    // Log but don't block — auth user was created successfully
    console.error('Failed to insert users row:', insertError.message)
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
    // Never reveal which credential is wrong — Requirement 2.5
    return { error: 'Invalid email or password' }
  }

  // Return success signal — let the client handle navigation.
  // Using redirect() inside a server action called from a client component
  // fails silently on iOS Safari/Chrome (session sets but redirect never fires).
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

  // Always return success regardless of whether the email exists (security best practice)
  return { success: true }
}
