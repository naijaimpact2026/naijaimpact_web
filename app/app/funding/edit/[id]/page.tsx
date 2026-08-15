import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fetchCampaignById } from '@/lib/actions/funding'
import { ArrowLeft } from 'lucide-react'
import FundingEditForm from '@/components/app/funding/FundingEditForm'

export const dynamic = 'force-dynamic'

interface EditCampaignPageProps
{
    params: Promise<{ id: string }>
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps)
{
    const { id } = await params
    const campaign = await fetchCampaignById(id)

    if (!campaign) notFound()

    const supabase = await createClient()
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) redirect(`/auth/login`)

    const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single()

    // Guard: only the creator can edit
    if (!profile || profile.id !== campaign.creator_id)
    {
        redirect(`/app/funding/${id}`)
    }

    return (
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            <Link
                href={`/app/funding/${id}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to campaign
            </Link>

            <div>
                <h1 className="text-2xl font-bold">Edit Campaign</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Update the details of your campaign
                </p>
            </div>

            <FundingEditForm campaign={campaign} />
        </main>
    )
}
