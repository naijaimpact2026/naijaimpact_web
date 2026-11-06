'use server'

// Small, standalone action for the "funding opportunity ads" widget — kept
// separate from lib/actions/funding.ts (which is fully disabled elsewhere in
// the app, written against column names — amount_raised, status, deadline,
// donor_count, creator_id — that don't match the real `funding` table).
// This queries the real, current schema directly.

import { createClient } from '@/lib/supabase/server'

export type FundingAd = {
    id: string
    title: string
    description: string | null
    impact: string | null
    cover_image_url: string | null
    goal_amount: number
    funding_type: string
}

export async function fetchFeaturedFunding(limit: number = 3): Promise<FundingAd[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('funding')
        .select('id, title, description, impact, cover_image_url, goal_amount, funding_type')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('fetchFeaturedFunding error:', error)
        return []
    }

    return data ?? []
}
