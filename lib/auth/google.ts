import { createClient } from '@/lib/supabase/client'

/**
 * Kicks off the Google OAuth flow — redirects the browser to Google, which
 * redirects back to /auth/callback to exchange the code for a session.
 */
export async function signInWithGoogle(next = '/app'): Promise<{ error?: string }> {
  const supabase = createClient()
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    return { error: error?.message }
  } catch (err) {
    // Network failure, unreachable auth endpoint, etc. — signInWithOAuth can
    // throw instead of resolving with { error }, so callers always get a
    // definite result either way and can safely reset their loading state.
    console.error('signInWithGoogle threw:', err)
    return { error: 'Google sign-in failed. Please try again.' }
  }
}
