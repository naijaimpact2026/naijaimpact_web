import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { fetchMarketCategories } from '@/lib/actions/marketplace'
import CreateListingForm from '@/components/app/market/CreateListingForm'

export const dynamic = 'force-dynamic'

export default async function CreateListingPage()
{
    const { authUser } = await getCurrentUser()
    if (!authUser) redirect('/auth/login')

    const categories = await fetchMarketCategories()

    return <CreateListingForm categories={categories} />
}
