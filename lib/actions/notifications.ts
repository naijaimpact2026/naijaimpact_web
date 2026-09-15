'use server'

import { createClient } from '@/lib/supabase/server'
import type { NotificationWithActor } from '@/lib/types'

const PAGE_SIZE = 20

// ─── Get current user's profile ──────────────────────────────────────────────

async function getCurrentProfile() {
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
        throw new Error('Unauthenticated')
    }

    const { data: profile, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single()

    if (error || !profile) {
        throw new Error('Profile not found')
    }

    return {
        supabase,
        profile,
    }
}

// ─── Mark one notification as read ──────────────────────────────────────────

export async function markNotificationRead(
    notificationId: string,
): Promise<{ success: boolean }> {
    try {
        const { supabase, profile } = await getCurrentProfile()

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', profile.id)

        if (error) {
            console.error(
                '[markNotificationRead] DB error:',
                error,
            )

            return { success: false }
        }

        return { success: true }
    } catch (err) {
        console.error(
            '[markNotificationRead] Unexpected error:',
            err,
        )

        return { success: false }
    }
}

export async function markNotificationUnread(
    notificationId: string,
) {
    try {
        const { supabase, profile } =
            await getCurrentProfile()

        const { error } = await supabase
            .from('notifications')
            .update({
                read: false,
            })
            .eq('id', notificationId)
            .eq('user_id', profile.id)

        if (error) {
            console.error(
                '[notifications] markNotificationUnread error:',
                error,
            )

            return {
                success: false,
                error: error.message,
            }
        }

        return {
            success: true,
        }
    } catch (error) {
        console.error(
            '[notifications] markNotificationUnread exception:',
            error,
        )

        return {
            success: false,
            error: 'Unable to mark notification as unread.',
        }
    }
}


export async function deleteNotification(
    notificationId: string,
) {
    try {
        const { supabase, profile } =
            await getCurrentProfile()

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', profile.id)

        if (error) {
            console.error(
                '[notifications] deleteNotification error:',
                error,
            )

            return {
                success: false,
                error: error.message,
            }
        }

        return {
            success: true,
        }
    } catch (error) {
        console.error(
            '[notifications] deleteNotification exception:',
            error,
        )

        return {
            success: false,
            error: 'Unable to delete notification.',
        }
    }
}

// ─── Mark all unread notifications as read ──────────────────────────────────

export async function markNotificationsRead(): Promise<{
    success: boolean
}> {
    try {
        const { supabase, profile } = await getCurrentProfile()

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', profile.id)
            .eq('read', false)

        if (error) {
            console.error(
                '[markNotificationsRead] DB error:',
                error,
            )

            return { success: false }
        }

        return { success: true }
    } catch (err) {
        console.error(
            '[markNotificationsRead] Unexpected error:',
            err,
        )

        return { success: false }
    }
}

// ─── Fetch a page of notifications ──────────────────────────────────────────

export async function fetchNotificationsPage(
    cursor?: string,
    limit: number = PAGE_SIZE,
): Promise<{
    notifications: NotificationWithActor[]
    nextCursor: string | null
}> {
    try {
        const { supabase, profile } = await getCurrentProfile()

        let query = supabase
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
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(limit + 1)

        if (cursor) {
            query = query.lt('created_at', cursor)
        }

        const { data, error } = await query

        if (error) {
            console.error(
                '[fetchNotificationsPage] DB error:',
                error,
            )

            return {
                notifications: [],
                nextCursor: null,
            }
        }

        const rows = (data ?? []) as any[]

        const hasMore = rows.length > limit

        const page = hasMore
            ? rows.slice(0, limit)
            : rows

        const nextCursor = hasMore
            ? page[page.length - 1]?.created_at ?? null
            : null

        const notifications: NotificationWithActor[] =
            page.map((row) => ({
                id: row.id,
                user_id: row.user_id,
                actor_id: row.actor_id,
                type: row.type,
                reference_id: row.reference_id,
                read: row.read,
                created_at: row.created_at,
                actor: row.actor ?? null,
            }))

        return {
            notifications,
            nextCursor,
        }
    } catch (err) {
        console.error(
            '[fetchNotificationsPage] Unexpected error:',
            err,
        )

        return {
            notifications: [],
            nextCursor: null,
        }
    }
}

// ─── Notification statistics ─────────────────────────────────────────────────

export async function getNotificationStats(): Promise<{
    total: number
    unread: number
}> {
    try {
        const { supabase, profile } = await getCurrentProfile()

        // Get total notifications
        const { count: total, error: totalError } =
            await supabase
                .from('notifications')
                .select('id', {
                    count: 'exact',
                    head: true,
                })
                .eq('user_id', profile.id)

        if (totalError) {
            console.error(
                '[getNotificationStats] Total count error:',
                totalError,
            )
        }

        // Get unread notifications
        const { count: unread, error: unreadError } =
            await supabase
                .from('notifications')
                .select('id', {
                    count: 'exact',
                    head: true,
                })
                .eq('user_id', profile.id)
                .eq('read', false)

        if (unreadError) {
            console.error(
                '[getNotificationStats] Unread count error:',
                unreadError,
            )
        }

        return {
            total: total ?? 0,
            unread: unread ?? 0,
        }
    } catch (err) {
        console.error(
            '[getNotificationStats] Unexpected error:',
            err,
        )

        return {
            total: 0,
            unread: 0,
        }
    }
}

// ─── Count unread notifications ──────────────────────────────────────────────

export async function getUnreadNotificationCount(): Promise<number> {
    try {
        const { unread } = await getNotificationStats()

        return unread
    } catch (err) {
        console.error(
            '[getUnreadNotificationCount] Unexpected error:',
            err,
        )

        return 0
    }
}