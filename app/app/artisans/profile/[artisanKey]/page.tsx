import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect, notFound } from 'next/navigation'
import { fetchArtisans } from '@/lib/actions/marketplace'
import ArtisanProfilePage from '@/components/app/market/ArtisanProfilePage'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ artisanKey: string }> }) {
  const { artisanKey } = await params
  return {
    title: 'Artisan Profile | Hubnovo Artisans',
    description: 'View artisan portfolio, services, and verified reviews on Hubnovo.',
  }
}

export default async function ArtisanProfileRoute({ params }: { params: Promise<{ artisanKey: string }> }) {
  const { artisanKey } = await params
  const { authUser } = await getCurrentUser()
  if (!authUser) redirect(`/auth/login?next=/app/artisans/profile/${artisanKey}`)

  // Fetch all service listings — then filter to this artisan's services
  const { artisans: allArtisans } = await fetchArtisans({})

  // Group to find this artisan
  const services = allArtisans.filter((a: any) => {
    const key = a.seller_id ?? a.user_id ?? a.id
    return key === artisanKey
  })

  if (services.length === 0) notFound()

  const first = services[0]
  const artisan = {
    artisanKey,
    displayName: first.seller_business_name ?? 'Artisan',
    avatarUrl: first.seller_logo_url ?? first.cover_image_url ?? null,
    isVerified: first.seller_is_verified ?? false,
    bio: first.seller_bio ?? null,
    location: [first.city, first.state].filter(Boolean).join(', ') || null,
    userId: first.user_id ?? null,
    services,
  }

  return (
    <ArtisanProfilePage
      artisan={artisan}
      currentUserId={authUser.id}
    />
  )
}
