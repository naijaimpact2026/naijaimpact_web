import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchSavedListings } from '@/lib/actions/marketplace'
import SavedListingsClient from '@/components/app/market/SavedListingsClient'

export const dynamic = 'force-dynamic'

export default async function SavedListingsPage()
{
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const listings = await fetchSavedListings()

    // Every result here is, by definition, saved — the view's own is_saved
    // flag depends on auth.uid() and isn't reliable in this server context.
    const savedListings = listings.map((l) => ({ ...l, is_saved: true }))

    return <SavedListingsClient listings={savedListings} />
}
