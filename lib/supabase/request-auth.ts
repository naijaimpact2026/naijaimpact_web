import { createClient as createSupabaseClient, type SupabaseClient, type User as SupabaseAuthUser } from '@supabase/supabase-js'
import { createClient } from './server'
import { getCurrentUser } from './auth'
import { createServiceClient } from './service'
import type { User } from '@/lib/types'

export interface RequestUser
{
    /** RLS client acting as the caller — use it for reads. */
    supabase: SupabaseClient
    authUser: SupabaseAuthUser | null
    profile: User | null
}

/**
 * Resolves the caller of an API route. The mobile app sends its Supabase
 * access token as `Authorization: Bearer <token>`; browsers fall back to the
 * usual cookie session, so the same routes work from both.
 */
export async function getRequestUser(request: Request): Promise<RequestUser>
{
    const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]

    if (!token)
    {
        const [supabase, { authUser, profile }] = await Promise.all([createClient(), getCurrentUser()])
        return { supabase: supabase as unknown as SupabaseClient, authUser, profile }
    }

    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
        },
    )

    const { data: { user: authUser } } = await supabase.auth.getUser(token)
    if (!authUser) return { supabase, authUser: null, profile: null }

    // Own profile via service role: users.email isn't readable with the user client.
    const { data: profile } = await createServiceClient()
        .from('users')
        .select('*')
        .or(`auth_id.eq.${authUser.id},id.eq.${authUser.id}`)
        .maybeSingle()

    return { supabase, authUser, profile: (profile as User | null) ?? null }
}

/** users columns any signed-in user may read (email / wallet_pin are private). */
export const PUBLIC_USER_COLUMNS =
    'id, username, fullname, profession, profile_image_url, created_at, updated_at, role, bio, referral_points, referred_by, referral_code, naija_points, display_name, auth_id, avatar_url, verified, onboarded, notifications_follows, notifications_reactions, notifications_comments, notifications_mentions, is_private, cover_url, location, website_url, quote, skills, impact_points, people_reached, people_trained, jobs_created, communities_impacted' as const
