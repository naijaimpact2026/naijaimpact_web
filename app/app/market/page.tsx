import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchListings, fetchMarketCategories, fetchTopSellers } from '@/lib/actions/marketplace'
import MarketHomeClient from '@/components/app/market/MarketHomeClient'

export const dynamic = 'force-dynamic'

export default async function MarketPage()
{
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users')
        .select('id, display_name, fullname')
        .eq('auth_id', user.id)
        .single()

    const [{ listings, nextCursor }, categories, topSellers] = await Promise.all([
        fetchListings({}, 24),
        fetchMarketCategories(),
        fetchTopSellers(4),
    ])

    const displayName = profile?.display_name ?? profile?.fullname ?? 'User'

    return (
        <MarketHomeClient
            initialListings={listings}
            initialNextCursor={nextCursor}
            categories={categories}
            topSellers={topSellers}
            userId={user.id}
            userEmail={user.email ?? ''}
            displayName={displayName}
        />
    )
}
