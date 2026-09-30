import { cache } from 'react'
import type { User as SupabaseAuthUser } from '@supabase/supabase-js'
import { createClient } from './server'
import type { User } from '@/lib/types'

export interface CurrentUser
{
    authUser: SupabaseAuthUser | null
    profile: User | null
}

/**
 * Resolves the Supabase auth user + `users` profile row exactly once per
 * request. cache() dedupes this across every Server Component and directly
 * -called server action in the same render pass — layout, page, and the
 * action(s) that page calls all share one call instead of each doing their
 * own auth.getUser() + profile lookup.
 *
 * `authUser` and `profile` are reported separately (not collapsed into a
 * single null) because callers need to distinguish "not signed in" (redirect
 * to /auth/login) from "signed in but no `users` row yet" (redirect to
 * /app/settings/onboarding, e.g. a first-time OAuth sign-in) — the two
 * cases route differently across the app.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> =>
{
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { authUser: null, profile: null }

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single()

    return { authUser, profile: (profile as User | null) ?? null }
})
