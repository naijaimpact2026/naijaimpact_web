import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchArtisans, fetchMarketCategories } from '@/lib/actions/marketplace'
import ArtisanMarketClient from '@/components/app/market/ArtisanMarketClient'

export const dynamic = 'force-dynamic'

export default async function ArtisanMarketPage()
{
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const [{ artisans, nextCursor }, categories] = await Promise.all([
        fetchArtisans({}),
        fetchMarketCategories(),
    ])

    // Check if current user already has a service listing (= artisan profile)
    const { data: myServiceListing } = await supabase
        .from('nm_listings')
        .select(`
            id, title, description, category_id, price, state, city, tags, is_active,
            listing_images:nm_listing_images(image_url, sort_order)
        `)
        .eq('user_id', user.id)
        .eq('listing_type', 'service')
        .maybeSingle()

    const myArtisanProfile = myServiceListing
        ? {
            id: myServiceListing.id,
            title: myServiceListing.title,
            description: myServiceListing.description,
            category_id: myServiceListing.category_id,
            price: myServiceListing.price,
            state: myServiceListing.state,
            city: myServiceListing.city,
            tags: myServiceListing.tags,
            is_active: myServiceListing.is_active,
            image_urls: (myServiceListing.listing_images ?? [])
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((i: any) => i.image_url),
        }
        : null

    return (
        <ArtisanMarketClient
            initialArtisans={artisans}
            initialNextCursor={nextCursor}
            currentUserId={user.id}
            categories={categories}
            myArtisanProfile={myArtisanProfile}
        />
    )
}
