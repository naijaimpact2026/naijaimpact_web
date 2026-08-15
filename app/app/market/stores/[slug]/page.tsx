import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { fetchStorefrontBySlug } from '@/lib/actions/marketplace'
import StorefrontDetailClient from '@/components/app/market/StorefrontDetailClient'

export const dynamic = 'force-dynamic'

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users').select('id').eq('auth_id', user.id).single()

    const storefront = await fetchStorefrontBySlug(slug)
    if (!storefront) notFound()

    return (
        <StorefrontDetailClient
            storefront={storefront}
            currentUserId={profile?.id ?? ''}
        />
    )
}
