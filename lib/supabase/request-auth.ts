import { createClient as createSupabaseClient, type SupabaseClient, type User as SupabaseAuthUser } from '@supabase/supabase-js'
import { createClient } from './server'
import { getCurrentUser } from './auth'
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

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .or(`auth_id.eq.${authUser.id},id.eq.${authUser.id}`)
        .maybeSingle()

    return { supabase, authUser, profile: (profile as User | null) ?? null }
}
