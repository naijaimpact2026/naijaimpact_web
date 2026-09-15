import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import {
    fetchNotificationsPage,
    getNotificationStats,
} from '@/lib/actions/notifications'

import NotificationsClient from '@/components/app/notifications/NotificationsClient'
import NotificationPreferences from '@/components/app/notifications/NotificationPreferences'
import NotificationSummary from '@/components/app/notifications/NotificationSummary'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/auth/login')
    }

    const [
        { notifications, nextCursor },
        stats,
        { data: profile },
    ] = await Promise.all([
        fetchNotificationsPage(),
        getNotificationStats(),
        supabase
            .from('users')
            .select(`
                notifications_follows,
                notifications_reactions,
                notifications_comments,
                notifications_mentions
            `)
            .eq('auth_id', authUser.id)
            .single(),
    ])

    const preferences = {
        notifications_follows:
            profile?.notifications_follows ?? true,

        notifications_reactions:
            profile?.notifications_reactions ?? true,

        notifications_comments:
            profile?.notifications_comments ?? true,

        notifications_mentions:
            profile?.notifications_mentions ?? true,
    }

    return (
        <div className="min-h-screen bg-background">
            {/* ── Page Header ── */}
            <div className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-4 backdrop-blur-sm sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <h1 className="text-xl font-bold text-foreground">
                        Notifications
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Stay updated with what&apos;s happening across your
                        account.
                    </p>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="mx-auto max-w-6xl px-0 py-6 sm:px-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">

                    {/* ── Notifications ── */}
                    <main className="min-w-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                        <NotificationsClient
                            initialNotifications={notifications}
                            initialCursor={nextCursor}
                            initialUnreadCount={stats.unread}
                            notificationPreferences={preferences}
                        />
                    </main>

                    {/* ── Sidebar ── */}
                    <aside className="hidden space-y-4 lg:block">

                        {/* Notification Preferences */}
                        <div id="notification-preferences-card">
                            <NotificationPreferences
                                preferences={preferences}
                            />
                        </div>

                        {/* Unread Summary */}
                        <NotificationSummary
                            total={stats.total}
                            unread={stats.unread}
                        />

                        {/* Info */}
                        <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-foreground">
                                Stay informed
                            </h2>

                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                Your notifications keep you updated about
                                follows, reactions, comments, mentions, Ajo
                                activity, loans and more.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}