import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect, notFound } from 'next/navigation'
import { fetchStorefrontBySlug } from '@/lib/actions/marketplace'
import StorefrontDetailClient from '@/components/app/market/StorefrontDetailClient'

export const dynamic = 'force-dynamic'

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const { authUser, profile } = await getCurrentUser()
    if (!authUser) redirect('/auth/login')

    const storefront = await fetchStorefrontBySlug(slug)
    if (!storefront) notFound()

    return (
        <StorefrontDetailClient
            storefront={storefront}
            currentUserId={profile?.id ?? ''}
        />
    )
}
