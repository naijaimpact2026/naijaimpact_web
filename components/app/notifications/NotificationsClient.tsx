'use client'

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import { Skeleton } from '@/components/ui/skeleton'

import {
    fetchNotificationsPage,
    markNotificationRead,
    markNotificationUnread,
    markNotificationsRead,
    deleteNotification,
} from '@/lib/actions/notifications'

import { useUnreadCount } from '@/components/app/UnreadCountContext'
import { createClient } from '@/lib/supabase/client'

import type { NotificationWithActor } from '@/lib/types'

import NotificationItem from './NotificationItem'
import NotificationFilters, {
    type FilterKey,
    NOTIFICATION_FILTERS,
} from './NotificationFilters'
import NotificationEmptyState from './NotificationEmptyState'

import {
    CheckCheck,
    Settings,
} from 'lucide-react'

function getDateGroup(dateString: string): 'Today' | 'Yesterday' | 'Earlier' {
    const date = new Date(dateString)
    const now = new Date()

    const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
    )

    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)

    if (date >= startOfToday) {
        return 'Today'
    }

    if (date >= startOfYesterday) {
        return 'Yesterday'
    }

    return 'Earlier'
}

interface NotificationsClientProps {
    initialNotifications: NotificationWithActor[]
    initialCursor: string | null
    initialUnreadCount: number
}

export default function NotificationsClient({
    initialNotifications,
    initialCursor,
    initialUnreadCount,
}: NotificationsClientProps) {
    const [notifications, setNotifications] =
        useState<NotificationWithActor[]>(
            initialNotifications,
        )

    const [cursor, setCursor] =
        useState<string | null>(
            initialCursor,
        )

    const [loading, setLoading] =
        useState(false)

    const [markingAllRead, setMarkingAllRead] =
        useState(false)

    const [activeFilter, setActiveFilter] =
        useState<FilterKey>('all')

    const [error, setError] =
        useState<string | null>(null)

    const [serverUnreadCount, setServerUnreadCount] =
        useState(initialUnreadCount)

    const sentinelRef =
        useRef<HTMLDivElement>(null)

    const { setNotificationCount } =
        useUnreadCount()

    // ─── Counts ──────────────────────────────────────────────────────────────

    const unreadCount = useMemo(
        () =>
            notifications.filter(
                (notification) =>
                    !notification.read,
            ).length,
        [notifications],
    )

    const totalCount =
        notifications.length

    // Keep the global notification badge
    // synchronized with the actual server unread count.
    useEffect(() => {
        setNotificationCount(
            serverUnreadCount,
        )
    }, [
        serverUnreadCount,
        setNotificationCount,
    ])

    // ─── Realtime notifications ─────────────────────────────────────────────
    useEffect(() => {
        let channel: ReturnType<
            ReturnType<typeof createClient>['channel']
        > | null = null
        let cancelled = false

        const supabase = createClient()

        const subscribeToNotifications = async () => {
            try {
                const {
                    data: { user: authUser },
                    error: authError,
                } = await supabase.auth.getUser()

                if (cancelled || authError || !authUser) {
                    return
                }

                // notifications.user_id references public.users.id,
                // while Supabase Auth gives us auth.users.id.
                const { data: profile, error: profileError } =
                    await supabase
                        .from('users')
                        .select('id')
                        .eq('auth_id', authUser.id)
                        .single()

                if (cancelled || profileError || !profile) {
                    console.error(
                        '[NotificationsClient] realtime profile error:',
                        profileError,
                    )
                    return
                }

                console.log(
                    '[NotificationsClient] Realtime setup:',
                    {
                        authUserId: authUser.id,
                        profileId: profile.id,
                        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                    },
                )
                
                channel = supabase
                    .channel(`notifications:${profile.id}`)

                    // New notification
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${profile.id}`,
                        },
                        async (payload) => {
                            if (cancelled) return

                            const newNotification =
                                payload.new as {
                                    id: string
                                    user_id: string
                                    actor_id: string | null
                                    type: NotificationWithActor['type']
                                    reference_id: string | null
                                    read: boolean
                                    created_at: string
                                }

                            const { data, error } =
                                await supabase
                                    .from('notifications')
                                    .select(
                                        `
                                        id,
                                        user_id,
                                        actor_id,
                                        type,
                                        reference_id,
                                        read,
                                        created_at,
                                        actor:users!notifications_actor_id_fkey (
                                            username,
                                            display_name,
                                            avatar_url
                                        )
                                        `,
                                    )
                                    .eq('id', newNotification.id)
                                    .single()

                            if (cancelled || error || !data) {
                                if (error) {
                                    console.error(
                                        '[NotificationsClient] realtime INSERT fetch error:',
                                        error,
                                    )
                                }
                                return
                            }

                            const notification =
                                data as NotificationWithActor

                            setNotifications((prev) => {
                                if (
                                    prev.some(
                                        (item) =>
                                            item.id === notification.id,
                                    )
                                ) {
                                    return prev
                                }

                                return [notification, ...prev]
                            })

                            if (!notification.read) {
                                setServerUnreadCount((count) => count + 1)
                            }
                        },
                    )

                    // Notification changed elsewhere (read/unread)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${profile.id}`,
                        },
                        (payload) => {
                            if (cancelled) return

                            const updated =
                                payload.new as {
                                    id: string
                                    read: boolean
                                }

                            setNotifications((prev) => {
                                const existing = prev.find(
                                    (item) => item.id === updated.id,
                                )

                                if (!existing) {
                                    return prev
                                }

                                if (existing.read === updated.read) {
                                    return prev
                                }

                                setServerUnreadCount((count) =>
                                    updated.read
                                        ? Math.max(0, count - 1)
                                        : count + 1,
                                )

                                return prev.map((item) =>
                                    item.id === updated.id
                                        ? {
                                              ...item,
                                              read: updated.read,
                                          }
                                        : item,
                                )
                            })
                        },
                    )

                    // Notification deleted elsewhere
                    .on(
                        'postgres_changes',
                        {
                            event: 'DELETE',
                            schema: 'public',
                            table: 'notifications',
                        },
                        (payload) => {
                            console.log(
                                '[NotificationsClient] REALTIME INSERT:',
                                payload,
                            )
                    
                            if (cancelled) return

                            const deleted =
                                payload.old as {
                                    id: string
                                    user_id?: string
                                    read?: boolean
                                }

                            setNotifications((prev) => {
                                const existing = prev.find(
                                    (item) => item.id === deleted.id,
                                )

                                if (!existing) {
                                    return prev
                                }

                                if (!existing.read) {
                                    setServerUnreadCount((count) =>
                                        Math.max(0, count - 1),
                                    )
                                }

                                return prev.filter(
                                    (item) => item.id !== deleted.id,
                                )
                            })
                        },
                    )
                    .subscribe((status, err) => {
                        console.log(
                            '[NotificationsClient] realtime status:',
                            status,
                            err,
                        )
                    
                        if (
                            status === 'CHANNEL_ERROR' ||
                            status === 'TIMED_OUT'
                        ) {
                            console.error(
                                '[NotificationsClient] realtime subscription error:',
                                {
                                    status,
                                    error: err,
                                },
                            )
                        }
                    })
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        '[NotificationsClient] realtime subscription error:',
                        err,
                    )
                }
            }
        }

        subscribeToNotifications()

        return () => {
            cancelled = true

            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [])

    // ─── Filtering ───────────────────────────────────────────────────────────

    const filteredNotifications =
        useMemo(() => {
            if (
                activeFilter === 'all'
            ) {
                return notifications
            }

            if (
                activeFilter === 'unread'
            ) {
                return notifications.filter(
                    (notification) =>
                        !notification.read,
                )
            }

            const filter =
                NOTIFICATION_FILTERS.find(
                    (item) =>
                        item.key ===
                        activeFilter,
                )

            if (!filter?.types) {
                return notifications
            }

            return notifications.filter(
                (notification) =>
                    filter.types!.includes(
                        notification.type,
                    ),
            )
        }, [
            activeFilter,
            notifications,
        ])

    // ─── Load more ───────────────────────────────────────────────────────────

    const loadMore =
        useCallback(async () => {
            if (
                loading ||
                cursor === null
            ) {
                return
            }

            setLoading(true)
            setError(null)

            try {
                const {
                    notifications:
                        nextPage,
                    nextCursor,
                } =
                    await fetchNotificationsPage(
                        cursor,
                    )

                setNotifications(
                    (prev) => [
                        ...prev,
                        ...nextPage,
                    ],
                )

                setCursor(
                    nextCursor,
                )
            } catch (err) {
                console.error(
                    '[NotificationsClient] loadMore error:',
                    err,
                )

                setError(
                    'Unable to load more notifications.',
                )
            } finally {
                setLoading(false)
            }
        }, [
            cursor,
            loading,
        ])

    // ─── Infinite scrolling ──────────────────────────────────────────────────

    useEffect(() => {
        const element =
            sentinelRef.current

        if (!element) {
            return
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    if (
                        entries[0]
                            ?.isIntersecting
                    ) {
                        loadMore()
                    }
                },
                {
                    rootMargin:
                        '200px',
                },
            )

        observer.observe(element)

        return () =>
            observer.disconnect()
    }, [loadMore])

    // ─── Mark one notification as read ───────────────────────────────────────

    const handleMarkRead =
        useCallback(
            async (
                notificationId: string,
            ) => {
                const notification =
                    notifications.find(
                        (item) =>
                            item.id ===
                            notificationId,
                    )

                if (
                    !notification ||
                    notification.read
                ) {
                    return
                }

                // Optimistic update
                setNotifications(
                    (prev) =>
                        prev.map(
                            (item) =>
                                item.id ===
                                notificationId
                                    ? {
                                          ...item,
                                          read: true,
                                      }
                                    : item,
                        ),
                )

                const result =
                    await markNotificationRead(
                        notificationId,
                    )

                if (!result.success) {
                    // Revert if database
                    // update failed.
                    setNotifications(
                        (prev) =>
                            prev.map(
                                (item) =>
                                    item.id ===
                                    notificationId
                                        ? {
                                              ...item,
                                              read: false,
                                          }
                                        : item,
                            ),
                    )
                } else {
                    setServerUnreadCount((count) =>
                        Math.max(0, count - 1),
                    )
                }
            },
            [notifications],
        )

    // ─── Mark all notifications as read ──────────────────────────────────────

    const handleMarkAllRead =
        async () => {
            if (
                unreadCount === 0 ||
                markingAllRead
            ) {
                return
            }

            setMarkingAllRead(
                true,
            )

            const previous =
                notifications

            // Optimistic update
            setNotifications(
                (prev) =>
                    prev.map(
                        (
                            notification,
                        ) => ({
                            ...notification,
                            read: true,
                        }),
                    ),
            )

            try {
                const result =
                    await markNotificationsRead()

                if (!result.success) {
                    setNotifications(
                        previous,
                    )
                } else {
                    setServerUnreadCount(0)
                }
            } catch (err) {
                console.error(
                    '[NotificationsClient] mark all read error:',
                    err,
                )

                setNotifications(
                    previous,
                )
            } finally {
                setMarkingAllRead(
                    false,
                )
            }
        }

    // ─── Mark one notification as unread ─────────────────────────────────────
    const handleMarkUnread = useCallback(
        async (notificationId: string) => {
            const notification = notifications.find(
                (item) => item.id === notificationId,
            )

            if (!notification || !notification.read) {
                return
            }

            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === notificationId
                        ? { ...item, read: false }
                        : item,
                ),
            )
            setServerUnreadCount((count) => count + 1)

            try {
                const result = await markNotificationUnread(notificationId)

                if (!result.success) {
                    setNotifications((prev) =>
                        prev.map((item) =>
                            item.id === notificationId
                                ? { ...item, read: true }
                                : item,
                        ),
                    )
                    setServerUnreadCount((count) =>
                        Math.max(0, count - 1),
                    )
                }
            } catch (err) {
                console.error(
                    '[NotificationsClient] mark unread error:',
                    err,
                )

                setNotifications((prev) =>
                    prev.map((item) =>
                        item.id === notificationId
                            ? { ...item, read: true }
                            : item,
                    ),
                )
                setServerUnreadCount((count) =>
                    Math.max(0, count - 1),
                )
            }
        },
        [notifications],
    )

    // ─── Delete one notification ─────────────────────────────────────────────
    const handleDelete = useCallback(
        async (notificationId: string) => {
            const notification = notifications.find(
                (item) => item.id === notificationId,
            )

            if (!notification) {
                return
            }

            setNotifications((prev) =>
                prev.filter((item) => item.id !== notificationId),
            )

            if (!notification.read) {
                setServerUnreadCount((count) =>
                    Math.max(0, count - 1),
                )
            }

            try {
                const result = await deleteNotification(notificationId)

                if (!result.success) {
                    setNotifications((prev) => {
                        if (
                            prev.some(
                                (item) => item.id === notificationId,
                            )
                        ) {
                            return prev
                        }

                        return [...prev, notification].sort(
                            (a, b) =>
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime(),
                        )
                    })

                    if (!notification.read) {
                        setServerUnreadCount((count) => count + 1)
                    }
                }
            } catch (err) {
                console.error(
                    '[NotificationsClient] delete notification error:',
                    err,
                )

                setNotifications((prev) => {
                    if (
                        prev.some(
                            (item) => item.id === notificationId,
                        )
                    ) {
                        return prev
                    }

                    return [...prev, notification].sort(
                        (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime(),
                    )
                })

                if (!notification.read) {
                    setServerUnreadCount((count) => count + 1)
                }
            }
        },
        [notifications],
    )

    // ─── Group notifications by date ─────────────────────────────────────────
    const groupedNotifications = useMemo(() => {
        const groups: Record<
            'Today' | 'Yesterday' | 'Earlier',
            NotificationWithActor[]
        > = {
            Today: [],
            Yesterday: [],
            Earlier: [],
        }

        filteredNotifications.forEach((notification) => {
            groups[getDateGroup(notification.created_at)].push(
                notification,
            )
        })

        return groups
    }, [filteredNotifications])

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="w-full">
            {/* Feed header */}
            <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {unreadCount >
                        0
                            ? `${unreadCount} unread`
                            : "You're all caught up"}
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={
                            unreadCount === 0 ||
                            markingAllRead
                        }
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <CheckCheck className="h-4 w-4" />

                        <span className="hidden sm:inline">
                            {markingAllRead
                                ? 'Marking...'
                                : 'Mark all as read'}
                        </span>
                    </button>

                    <button
                        type="button"
                        aria-label="Open notification preferences"
                        onClick={() =>
                            window.dispatchEvent(
                                new Event(
                                    'open-notification-preferences',
                                ),
                            )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <NotificationFilters
                activeFilter={
                    activeFilter
                }
                onFilterChange={
                    setActiveFilter
                }
                unreadCount={
                    unreadCount
                }
            />

            {/* Notification list */}
            {filteredNotifications.length ===
                0 &&
            !loading ? (
                <NotificationEmptyState
                    filter={
                        activeFilter
                    }
                />
            ) : (
                <div>
                    {(['Today', 'Yesterday', 'Earlier'] as const).map(
                        (group) => {
                            const items = groupedNotifications[group]

                            if (items.length === 0) {
                                return null
                            }

                            return (
                                <section key={group}>
                                    <div className="sticky top-0 z-10 border-y border-border bg-muted/30 px-4 py-2.5 sm:px-6">
                                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            {group}
                                        </h2>
                                    </div>

                                    <div className="divide-y divide-border">
                                        {items.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onRead={handleMarkRead}
                                                onMarkUnread={handleMarkUnread}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )
                        },
                    )}

                    {/* Loading skeletons */}
                    {loading && (
                        <>
                            {Array.from({
                                length: 4,
                            }).map(
                                (
                                    _,
                                    index,
                                ) => (
                                    <div
                                        key={
                                            index
                                        }
                                        className="flex items-start gap-3 px-4 py-4 sm:px-6"
                                    >
                                        <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />

                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/4" />
                                        </div>

                                        <Skeleton className="h-7 w-7 rounded-lg" />
                                    </div>
                                ),
                            )}
                        </>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="px-6 py-4 text-center text-sm text-destructive">
                            {
                                error
                            }
                        </div>
                    )}

                    {/* Infinite scroll sentinel */}
                    <div
                        ref={
                            sentinelRef
                        }
                        className="h-10"
                    />
                </div>
            )}
        </div>
    )
}