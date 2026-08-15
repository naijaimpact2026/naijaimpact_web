'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUnreadCount } from './UnreadCountContext'

interface NotificationListenerProps
{
    userId: string
    initialUnreadCount: number
}

export default function NotificationListener({
    userId,
    initialUnreadCount,
}: NotificationListenerProps)
{
    const { setNotificationCount } = useUnreadCount()

    // Sync the initial server-fetched unread count into context on mount
    useEffect(() =>
    {
        setNotificationCount(initialUnreadCount)
    }, [initialUnreadCount, setNotificationCount])

    // Subscribe to realtime inserts filtered by recipient_id
    useEffect(() =>
    {
        if (!userId) return

        const supabase = createClient()

        const channel = supabase
            .channel(`notifications-listener-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${userId}`,
                },
                () =>
                {
                    setNotificationCount((prev) => prev + 1)
                },
            )
            .subscribe()

        return () =>
        {
            supabase.removeChannel(channel)
        }
    }, [userId, setNotificationCount])

    return null
}
