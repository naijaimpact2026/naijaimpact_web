import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreatePostView from '@/components/app/feed/CreatePostView'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CreatePostPage()
{
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single()

    if (!profile) redirect('/app/settings/onboarding')

    return <CreatePostView user={profile as User} />
}
