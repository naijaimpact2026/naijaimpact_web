import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import CreatePostView from '@/components/app/feed/CreatePostView'

export const dynamic = 'force-dynamic'

export default async function CreatePostPage()
{
    const { authUser, profile } = await getCurrentUser()

    if (!authUser) redirect('/auth/login')
    if (!profile) redirect('/app/settings/onboarding')

    return <CreatePostView user={profile} />
}
