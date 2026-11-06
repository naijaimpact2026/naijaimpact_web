import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { fetchListings, fetchMarketCategories, fetchTopSellers } from '@/lib/actions/marketplace'
import MarketHomeClient from '@/components/app/market/MarketHomeClient'

export const dynamic = 'force-dynamic'

export default async function MarketPage()
{
    const { authUser, profile } = await getCurrentUser()
    if (!authUser) redirect('/auth/login')

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
            userId={authUser.id}
            userEmail={authUser.email ?? ''}
            displayName={displayName}
        />
    )
}
