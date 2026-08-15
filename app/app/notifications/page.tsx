import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchNotificationsPage, markNotificationsRead } from '@/lib/actions/notifications'
import NotificationsClient from '@/components/app/notifications/NotificationsClient'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage()
{
    const supabase = await createClient()
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser)
    {
        redirect('/auth/login')
    }

    // Fetch initial page of notifications
    const { notifications, nextCursor } = await fetchNotificationsPage()

    // Mark all unread as read (fire-and-forget — errors are logged server-side)
    void markNotificationsRead()

    return (
        <div className="min-h-screen bg-background">
            {/* Page header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-4">
                <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            </div>

            {/* Notification feed */}
            <div className="max-w-2xl mx-auto">
                <NotificationsClient
                    initialNotifications={notifications}
                    initialCursor={nextCursor}
                />
            </div>
        </div>
    )
}
