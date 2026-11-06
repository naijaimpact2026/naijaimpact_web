import { cache } from 'react'
import type { User as SupabaseAuthUser } from '@supabase/supabase-js'
import { createClient } from './server'
import { createServiceClient } from './service'
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

    // Own profile via service role: users.email isn't readable with the user client.
    let { data: profile } = await createServiceClient()
        .from('users')
        .select('*')
        .or(`auth_id.eq.${authUser.id},id.eq.${authUser.id}`)
        .maybeSingle()

    // Service-role fallback to bypass RLS or unlinked auth_id issues
    if (!profile && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const admin = createServiceClient()
            const { data: adminProfile } = await admin
                .from('users')
                .select('*')
                .or(`auth_id.eq.${authUser.id},id.eq.${authUser.id}`)
                .maybeSingle()

            if (adminProfile) {
                profile = adminProfile
            } else if (authUser.email) {
                const cleanEmail = authUser.email.trim().toLowerCase()
                const { data: emailProfile } = await admin
                    .from('users')
                    .select('*')
                    .eq('email', cleanEmail)
                    .maybeSingle()

                if (emailProfile) {
                    profile = emailProfile
                    // Auto-heal unlinked auth_id in background
                    admin
                        .from('users')
                        .update({ auth_id: authUser.id })
                        .eq('id', emailProfile.id)
                        .then(() => {})
                }
            }
        } catch (err) {
            console.error('getCurrentUser service role fallback error:', err)
        }
    }

    return { authUser, profile: (profile as User | null) ?? null }
})
