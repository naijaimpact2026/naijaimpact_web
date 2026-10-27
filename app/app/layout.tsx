import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import AppShell from '@/components/app/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode })
{
    const current = await getCurrentUser()
    const userProfile = current?.profile ?? null

    let initialNotificationCount = 0

    if (userProfile)
    {
        const supabase = await createClient()
        const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userProfile.id)
            .eq('read', false)

        initialNotificationCount = count ?? 0
    }

    return (
        <AppShell user={userProfile} initialNotificationCount={initialNotificationCount}>
            {children}
        </AppShell>
    )
}
