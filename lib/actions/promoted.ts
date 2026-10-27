'use server'

import { fetchListings } from '@/lib/actions/marketplace'
import { fetchCourses } from '@/lib/actions/learn'
import { toPublicStorageUrl } from '@/lib/supabase-image'

export type PromotedKind = 'market' | 'learn'

export interface PromotedItem
{
    id: string
    kind: PromotedKind
    title: string
    subtitle: string
    image_url: string | null
    href: string
}

/**
 * Real cross-promotion content pulled from Marketplace listings and Learn
 * courses — used to seed the feed's top carousel and the promoted circles
 * in the story row. No third-party ad network; everything links to a real
 * listing or course on the platform.
 */
export async function fetchPromotedContent(limit: number = 8): Promise<PromotedItem[]>
{
    const [{ listings }, { courses }] = await Promise.all([
        fetchListings({}, limit),
        fetchCourses(null, limit),
    ])

    const marketItems: PromotedItem[] = listings
        .filter((l) => l.cover_image_url)
        .map((l) => ({
            id: `market-${l.id}`,
            kind: 'market' as const,
            title: l.title,
            subtitle: l.price > 0 ? `₦${l.price.toLocaleString('en-NG')}` : 'New on Market',
            image_url: l.cover_image_url,
            href: `/app/market/${l.id}`,
        }))

    const learnItems: PromotedItem[] = courses
        .filter((c) => c.cover_image_url)
        .map((c) => ({
            id: `learn-${c.id}`,
            kind: 'learn' as const,
            title: c.title,
            subtitle: c.is_free ? 'New on Learn' : `₦${c.amount.toLocaleString('en-NG')}`,
            image_url: toPublicStorageUrl(c.cover_image_url),
            href: `/app/learn/${c.id}`,
        }))

    // Interleave the two sources so one category doesn't dominate
    const merged: PromotedItem[] = []
    const max = Math.max(marketItems.length, learnItems.length)
    for (let i = 0; i < max; i++) {
        if (learnItems[i]) merged.push(learnItems[i])
        if (marketItems[i]) merged.push(marketItems[i])
    }

    return merged.slice(0, limit)
}
