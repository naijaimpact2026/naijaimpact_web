import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect, notFound } from 'next/navigation'
import { fetchListingById, fetchListingReviews } from '@/lib/actions/marketplace'
import ArtisanDetailClient from '@/components/app/market/ArtisanDetailClient'

export const dynamic = 'force-dynamic'

export default async function ArtisanDetailPage({ params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    const { authUser } = await getCurrentUser()
    if (!authUser) redirect('/auth/login')

    // Artisans are nm_listings with listing_type='service'
    // Reuse fetchListingById since it handles all listing types
    const [listing, reviews] = await Promise.all([
        fetchListingById(id),
        fetchListingReviews(id),
    ])

    if (!listing) notFound()

    return (
        <ArtisanDetailClient
            listing={listing}
            reviews={reviews}
            currentUserId={authUser.id}
            userEmail={authUser.email ?? ''}
        />
    )
}
