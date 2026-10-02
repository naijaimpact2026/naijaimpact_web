import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect, notFound } from 'next/navigation'
import { fetchListingById, fetchMarketCategories } from '@/lib/actions/marketplace'
import EditListingClient from '@/components/app/market/EditListingClient'

export const dynamic = 'force-dynamic'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    const { authUser, profile } = await getCurrentUser()
    if (!authUser) redirect('/auth/login')

    const [listing, categories] = await Promise.all([
        fetchListingById(id),
        fetchMarketCategories(),
    ])

    if (!listing) notFound()

    // Ensure only the listing owner can edit
    if (listing.user_id !== (profile?.id ?? authUser.id) && listing.user_id !== authUser.id)
    {
        redirect(`/app/market/${id}`)
    }

    return (
        <EditListingClient
            listing={listing}
            categories={categories}
        />
    )
}
