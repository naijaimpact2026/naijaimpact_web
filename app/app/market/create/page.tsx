import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchMarketCategories } from '@/lib/actions/marketplace'
import CreateListingForm from '@/components/app/market/CreateListingForm'

export const dynamic = 'force-dynamic'

export default async function CreateListingPage()
{
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const categories = await fetchMarketCategories()

    return <CreateListingForm categories={categories} />
}
