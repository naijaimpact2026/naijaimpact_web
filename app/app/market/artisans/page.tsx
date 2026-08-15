import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchArtisans } from '@/lib/actions/marketplace'
import ArtisanMarketClient from '@/components/app/market/ArtisanMarketClient'

export const dynamic = 'force-dynamic'

export default async function ArtisanMarketPage()
{
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { artisans, nextCursor } = await fetchArtisans({})

    // Check if current user already has a service listing (= artisan profile)
    const { data: myServiceListing } = await supabase
        .from('nm_listings')
        .select('id, title, listing_type')
        .eq('user_id', user.id)
        .eq('listing_type', 'service')
        .maybeSingle()

    const myArtisanProfile = myServiceListing
        ? { id: myServiceListing.id, category: 'service', profession_title: myServiceListing.title, available: true }
        : null

    return (
        <ArtisanMarketClient
            initialArtisans={artisans}
            initialNextCursor={nextCursor}
            currentUserId={user.id}
            myArtisanProfile={myArtisanProfile}
        />
    )
}
