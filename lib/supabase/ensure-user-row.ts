import { createServiceClient } from '@/lib/supabase/service'

/**
 * Make sure a public.users row exists and is linked to this auth user.
 *
 * Server-only on purpose (not a server action): `user` must come from a
 * verified Supabase session (auth.getUser / verifyOtp / code exchange), since
 * it writes with the service client. Clients can't write users.auth_id or
 * users.onboarded themselves.
 */
export async function ensureUserRow(user: { id: string; email?: string; user_metadata?: Record<string, any> }) {
  const client = createServiceClient()
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
