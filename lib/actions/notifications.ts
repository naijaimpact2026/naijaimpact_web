'use server'

import { createClient } from '@/lib/supabase/server'
import type { NotificationWithActor } from '@/lib/types'

const PAGE_SIZE = 20

// ─── Mark all unread notifications as read ──────────────────────────────────

export async function markNotificationsRead(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Unauthenticated')

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()

    if (!profile) throw new Error('Profile not found')

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', profile.id)
      .eq('read', false)

    if (error) {
      console.error('[markNotificationsRead] DB error:', error)
    }

    return { success: true }
  } catch (err) {
    console.error('[markNotificationsRead] Unexpected error:', err)
    return { success: true } // silently succeed — never surface to user
  }
}

// ─── Fetch a page of notifications ──────────────────────────────────────────

export async function fetchNotificationsPage(
  cursor?: string,
  limit: number = PAGE_SIZE,
): Promise<{ notifications: NotificationWithActor[]; nextCursor: string | null }> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Unauthenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()

  if (!authUser) throw new Error('Unauthenticated')

  if (!profile) {
    console.error('[fetchNotificationsPage] profile not found for', authUser.id)
    return { notifications: [], nextCursor: null }
  }

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
    console.error('[fetchNotificationsPage] error:', error)
    return { notifications: [], nextCursor: null }
  }

  const rows = (data ?? []) as any[]
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? page[page.length - 1].created_at : null

  const notifications: NotificationWithActor[] = page.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    actor_id: row.actor_id,
    type: row.type,
    reference_id: row.reference_id,
    read: row.read,
    created_at: row.created_at,
    actor: row.actor ?? null,
  }))

  return { notifications, nextCursor }
}

// ─── Count unread notifications ──────────────────────────────────────────────

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return 0

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()

    if (!profile) return 0

    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('read', false)

    return count ?? 0
  } catch (err) {
    console.error('[getUnreadNotificationCount] error:', err)
    return 0
  }
}
