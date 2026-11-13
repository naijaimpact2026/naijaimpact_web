import type { SupabaseClient } from '@supabase/supabase-js'

/*
 * Auto-verified mission metrics. Each one counts real activity from existing
 * app tables, so it can't be self-reported. Server-only (service client).
 *
 * Rules that keep them honest:
 *  - Only activity inside the season window counts (from season start), so
 *    existing sellers don't max out every mission on day one.
 *  - Orders/reviews where the buyer is the seller don't count (no self-buys).
 *  - nm_* tables key users by auth id (users.auth_id), not users.id.
 */

export interface MetricSubject
{
    /** users.id */
    userId: string
    /** users.auth_id (falls back to users.id) — what nm_* tables reference */
    authId: string
    /** ISO timestamp; activity before this is ignored */
    since: string
}

type MetricFn = (db: SupabaseClient, s: MetricSubject) => Promise<number>

async function sellerProfileIds(db: SupabaseClient, authId: string): Promise<string[]>
{
    const { data } = await db.from('nm_seller_profiles').select('id').eq('user_id', authId)
    return (data ?? []).map((r: { id: string }) => r.id)
}

export const METRICS: Record<string, MetricFn> = {
    /** 1 when the seller profile has a business name, logo and state. */
    async seller_profile_complete(db, s)
    {
        const { data } = await db
            .from('nm_seller_profiles')
            .select('business_name, logo_url, state')
            .eq('user_id', s.authId)
            .limit(1)
            .maybeSingle()
        return data && data.business_name?.trim() && data.logo_url && data.state ? 1 : 0
    },

    /** Active listings created this season. */
    async listings_active(db, s)
    {
        const { count } = await db
            .from('nm_listings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', s.authId)
            .eq('is_active', true)
            .gte('created_at', s.since)
        return count ?? 0
    },

    /** Delivered orders this season, excluding self-purchases. */
    async orders_delivered(db, s)
    {
        const ids = await sellerProfileIds(db, s.authId)
        if (ids.length === 0) return 0
        const { count } = await db
            .from('nm_orders')
            .select('id', { count: 'exact', head: true })
            .in('seller_id', ids)
            .eq('status', 'delivered')
            .neq('buyer_id', s.authId)
            .gte('created_at', s.since)
        return count ?? 0
    },

    /** Reviews of 4★+ on the user's listings this season, excluding their own. */
    async good_reviews(db, s)
    {
        const { data: listings } = await db.from('nm_listings').select('id').eq('user_id', s.authId).limit(1000)
        const ids = (listings ?? []).map((r: { id: string }) => r.id)
        if (ids.length === 0) return 0
        const { count } = await db
            .from('nm_reviews')
            .select('id', { count: 'exact', head: true })
            .in('listing_id', ids)
            .gte('rating', 4)
            .neq('reviewer_id', s.authId)
            .gte('created_at', s.since)
        return count ?? 0
    },

    /** Livestreams the user actually went live on this season. */
    async live_sessions(db, s)
    {
        const { count } = await db
            .from('live_streams')
            .select('id', { count: 'exact', head: true })
            .eq('host_id', s.userId)
            .not('started_at', 'is', null)
            .gte('started_at', s.since)
        return count ?? 0
    },
}

/** Runs each distinct metric once. Unknown/failed metrics read as 0. */
export async function measureMetrics(db: SupabaseClient, subject: MetricSubject, metrics: string[]): Promise<Record<string, number>>
{
    const unique = [...new Set(metrics)]
    const values = await Promise.all(unique.map(async (m) =>
    {
        const fn = METRICS[m]
        if (!fn) return 0
        try { return await fn(db, subject) } catch { return 0 }
    }))
    return Object.fromEntries(unique.map((m, i) => [m, values[i]]))
}
