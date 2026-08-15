import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { fetchListingById, fetchListingReviews, fetchSellerProfile } from '@/lib/actions/marketplace'
import ListingDetailClient from '@/components/app/market/ListingDetailClient'

export const dynamic = 'force-dynamic'

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const [listing, reviews] = await Promise.all([
        fetchListingById(id),
        fetchListingReviews(id),
    ])

    if (!listing) notFound()

    // Fetch seller profile via auth user_id stored on listing
    const sellerProfile = await fetchSellerProfile(listing.user_id)

    return (
        <ListingDetailClient
            listing={listing}
            reviews={reviews}
            sellerProfile={sellerProfile}
            currentUserId={user.id}
            userEmail={user.email ?? ''}
        />
    )
}
