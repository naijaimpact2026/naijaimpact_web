import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { fetchArtisans } from '@/lib/actions/marketplace'
import ArtisanProfilePage from '@/components/app/market/ArtisanProfilePage'

export const dynamic = 'force-dynamic'

export default async function ArtisanProfileRoute({ params }: { params: Promise<{ artisanKey: string }> })
{
    const { artisanKey } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // Fetch all service listings — then filter to this artisan's services
    // artisanKey is seller_id or user_id
    const { artisans: allArtisans } = await fetchArtisans({})

    // Group to find this artisan
    const services = allArtisans.filter((a: any) =>
    {
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
            currentUserId={user.id}
        />
    )
}
