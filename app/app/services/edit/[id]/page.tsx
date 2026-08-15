import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchServiceById } from '@/lib/actions/services'
import EditServiceForm from '@/components/app/services/EditServiceForm'

export const dynamic = 'force-dynamic'

interface EditServicePageProps
{
    params: Promise<{ id: string }>
}

export default async function EditServicePage({ params }: EditServicePageProps)
{
    const { id } = await params
    const service = await fetchServiceById(id)

    if (!service) notFound()

    // Only the provider may edit
    const supabase = await createClient()
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single()

    if (!profile || profile.id !== service.provider_id)
    {
        // Not the owner — redirect to the detail page
        redirect(`/app/services/${id}`)
    }

    return (
        <main className="max-w-2xl mx-auto px-4 py-6">
            <div className="mb-6 space-y-1">
                <h1 className="text-2xl font-bold text-gradient">Edit Service Listing</h1>
                <p className="text-muted-foreground text-sm">Update your service details and pricing.</p>
            </div>

            <EditServiceForm service={service} />
        </main>
    )
}
