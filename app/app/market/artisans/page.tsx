import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import {
  fetchArtisans,
  fetchMarketCategories,
} from '@/lib/actions/marketplace'
import ArtisanMarketClient from '@/components/app/market/ArtisanMarketClient'

export const dynamic = 'force-dynamic'

export default async function ArtisanMarketPage() {
  const { authUser } = await getCurrentUser()

  if (!authUser) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  const [{ artisans, nextCursor }, categories] = await Promise.all([
    fetchArtisans({}),
    fetchMarketCategories(),
  ])

  // Check if current user already has a service listing (= artisan profile)
  const { data: myServiceListing } = await supabase
    .from('nm_listings')
    .select(`
      id,
      title,
      description,
      category_id,
      price,
      state,
      city,
      tags,
      is_active,
      listing_images:nm_listing_images(
        image_url,
        sort_order
      )
    `)
    .eq('user_id', authUser.id)
    .eq('listing_type', 'service')
    .order('created_at', { ascending: false })
    .limit(1)
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
      currentUserId={authUser.id}
      categories={categories}
      myArtisanProfile={myArtisanProfile}
    />
  )
}