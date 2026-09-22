import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchStorefronts } from '@/lib/actions/marketplace'
import StorefrontsClient from '@/components/app/market/StorefrontsClient'

export const dynamic = 'force-dynamic'

export default async function StorefrontsPage()
{
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { storefronts } = await fetchStorefronts()

    // Check if current user has a seller profile (= their storefront)
    const { data: mySellerProfile } = await supabase
        .from('nm_seller_profiles')
        .select('id, business_name')
        .eq('user_id', user.id)
        .maybeSingle()

    // Shape to match StorefrontsClient's myStorefront prop
    const myStorefront = mySellerProfile
        ? { id: mySellerProfile.id, business_name: mySellerProfile.business_name ?? 'My Store' }
        : null

    return (
        <StorefrontsClient
            initialStorefronts={storefronts}
            myStorefront={myStorefront}
        />
    )
}
