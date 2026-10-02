import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect, notFound } from 'next/navigation'
import { fetchArtisanByKey } from '@/lib/actions/marketplace'
import ArtisanProfilePage from '@/components/app/market/ArtisanProfilePage'

export const dynamic = 'force-dynamic'

export default async function ArtisanProfileRoute({ params }: { params: Promise<{ artisanKey: string }> })
{
    const { artisanKey } = await params
    const { authUser } = await getCurrentUser()
    if (!authUser) redirect('/auth/login')

    const artisan = await fetchArtisanByKey(artisanKey)
    if (!artisan) notFound()

    return (
        <ArtisanProfilePage
            artisan={artisan}
            currentUserId={authUser.id}
        />
    )
}
