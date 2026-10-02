import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect, notFound } from 'next/navigation'
import { fetchListingById, fetchListingReviews, fetchMarketCategories } from '@/lib/actions/marketplace'
import ArtisanDetailClient from '@/components/app/market/ArtisanDetailClient'

export const dynamic = 'force-dynamic'

export default async function ArtisanDetailPage({ params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    const { authUser } = await getCurrentUser()
    if (!authUser) redirect('/auth/login')

    // Artisans are nm_listings with listing_type='service'
    const [listing, reviews, categories] = await Promise.all([
        fetchListingById(id),
        fetchListingReviews(id),
        fetchMarketCategories(),
    ])

    if (!listing) notFound()

    return (
        <ArtisanDetailClient
            listing={listing}
            reviews={reviews}
            categories={categories}
            currentUserId={authUser.id}
            userEmail={authUser.email ?? ''}
        />
    )
}
