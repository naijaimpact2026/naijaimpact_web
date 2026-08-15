'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchNotificationsPage } from '@/lib/actions/notifications'
import { useUnreadCount } from '@/components/app/UnreadCountContext'
import type { NotificationWithActor } from '@/lib/types'
import NotificationItem from './NotificationItem'
import { Bell } from 'lucide-react'

interface NotificationsClientProps
{
    initialNotifications: NotificationWithActor[]
    initialCursor: string | null
}

export default function NotificationsClient({
    initialNotifications,
    initialCursor,
}: NotificationsClientProps)
{
    const [notifications, setNotifications] =
        useState<NotificationWithActor[]>(initialNotifications)
    const [cursor, setCursor] = useState<string | null>(initialCursor)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(initialCursor !== null)
    const sentinelRef = useRef<HTMLDivElement>(null)

    // Clear the unread badge when the notifications page mounts
    const { setNotificationCount } = useUnreadCount()
    useEffect(() =>
    {
        setNotificationCount(0)
    }, [setNotificationCount])

    const loadMore = useCallback(async () =>
    {
        if (loading || !hasMore) return
        setLoading(true)
        try
        {
            const { notifications: nextPage, nextCursor } = await fetchNotificationsPage(
                cursor ?? undefined,
            )
            setNotifications((prev) => [...prev, ...nextPage])
            setCursor(nextCursor)
            setHasMore(nextCursor !== null)
        } catch (err)
        {
            console.error('[NotificationsClient] loadMore error:', err)
        } finally
        {
            setLoading(false)
        }
    }, [cursor, hasMore, loading])

    // IntersectionObserver sentinel
    useEffect(() =>
    {
        const el = sentinelRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            (entries) =>
            {
                if (entries[0].isIntersecting) loadMore()
            },
            { rootMargin: '200px' },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [loadMore])

    if (notifications.length === 0 && !loading)
    {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <Bell className="w-10 h-10 opacity-40" />
                <p className="text-sm">No notifications yet</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-border">
            {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
            ))}

            {/* Loading skeletons */}
            {loading && (
                <>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3">
                            <div className="w-2 flex-shrink-0" />
                            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                        </div>
                    ))}
                </>
            )}

            {/* Scroll sentinel */}
            <div ref={sentinelRef} className="h-px" />
        </div>
    )
}
