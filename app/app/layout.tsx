import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/app/AppShell'
import type { User } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode })
{
    const supabase = await createClient()

    // Get the authenticated Supabase auth user
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    // Fetch the corresponding profile row from the users table
    let userProfile: User | null = null
    let initialNotificationCount = 0

    if (authUser)
    {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .single()
        userProfile = data ?? null

        if (userProfile)
        {
            // Fetch initial unread notification count for badge
            const { count } = await supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userProfile.id)
                .eq('read', false)

            initialNotificationCount = count ?? 0
        }
    }

    return (
        <AppShell user={userProfile} initialNotificationCount={initialNotificationCount}>
            {children}
        </AppShell>
    )
}
