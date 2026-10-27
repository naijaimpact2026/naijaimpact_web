import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect, notFound } from 'next/navigation'
import { fetchListingById, fetchListingReviews } from '@/lib/actions/marketplace'
import ArtisanDetailClient from '@/components/app/market/ArtisanDetailClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await fetchListingById(id)
  if (!listing) return { title: 'Artisan Service | Hubnovo' }
  return {
    title: `${listing.title} | Hubnovo Artisans`,
    description: listing.description?.slice(0, 160) ?? 'Hire verified artisans on Hubnovo',
  }
}

export default async function ArtisanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { authUser } = await getCurrentUser()
  if (!authUser) redirect(`/auth/login?next=/app/artisans/${id}`)

  // Artisans are nm_listings with listing_type='service'
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
