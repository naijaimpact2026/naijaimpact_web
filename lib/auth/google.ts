import { createClient } from '@/lib/supabase/client'

/**
 * Kicks off the Google OAuth flow — redirects the browser to Google, which
 * redirects back to /auth/callback to exchange the code for a session.
 */
export async function signInWithGoogle(next = '/app'): Promise<{ error?: string }> {
  const supabase = createClient()
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })

  return { error: error?.message }
}
