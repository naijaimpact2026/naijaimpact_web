'use server'

import { StreamClient } from '@stream-io/node-sdk'
import { createClient } from '@/lib/supabase/server'

/**
 * Start or resume a 1-on-1 DM channel between the current user and targetUserId.
 * Uses a deterministic channel ID so the same pair always lands in the same channel.
 */
export async function startDmChat(targetUserId: string): Promise<{ channelId: string }> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) throw new Error('Unauthorized')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .eq('auth_id', authUser.id)
    .single()

  if (profileError || !profile) throw new Error('User profile not found')

  if (profile.id === targetUserId) throw new Error('Cannot DM yourself')

  const { data: targetProfile, error: targetError } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .eq('id', targetUserId)
    .single()

  if (targetError || !targetProfile) throw new Error('Target user not found')

  const apiKey = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_KEY!
  const apiSecret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET!

  if (!apiKey || !apiSecret) {
    throw new Error('Stream Chat configuration missing on server')
  }

  const streamServerClient = new StreamClient(apiKey, apiSecret)

  // Ensure both users exist in Stream Chat before creating/getting channel
  await streamServerClient.upsertUsers([
    {
      id: profile.id,
      name: profile.display_name || 'User',
      image: profile.avatar_url ?? undefined,
    },
    {
      id: targetProfile.id,
      name: targetProfile.display_name || 'User',
      image: targetProfile.avatar_url ?? undefined,
    },
  ])

  // Deterministic channel id — always same pair, same channel
  const sortedIds = [profile.id, targetUserId].sort()
  const channelId = `dm_${sortedIds[0].slice(0, 8)}_${sortedIds[1].slice(0, 8)}`

  const channel = streamServerClient.chat.channel('messaging', channelId)
  await channel.getOrCreate({
    data: {
      created_by_id: profile.id,
      members: [{ user_id: profile.id }, { user_id: targetUserId }],
    },
  })

  return { channelId }
}

/**
 * Fetch users the current user follows (for "People you follow" in chat).
 */
export async function fetchFollowingForChat(): Promise<
  Array<{ id: string; username: string; display_name: string; avatar_url: string | null }>
> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return []

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) return []

  const { data } = await supabase
    .from('user_follows')
    .select('following:users!user_follows_following_id_fkey(id, username, display_name, avatar_url)')
    .eq('follower_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return ((data ?? []) as any[])
    .map((r) => r.following)
    .filter(Boolean)
}

/**
 * Fetch suggested users to follow (active posters not already followed).
 */
export async function fetchSuggestedUsers(): Promise<
  Array<{ id: string; username: string; display_name: string; avatar_url: string | null; isFollowing: boolean }>
> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return []

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) return []

  // People already followed
  const { data: follows } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', profile.id)

  const followedIds = new Set((follows ?? []).map((f: any) => f.following_id))

  // Recent active posters excluding current user and already followed
  const { data: posts } = await supabase
    .from('posts')
    .select('author_id, author:users!posts_author_id_fkey(id, username, display_name, avatar_url)')
    .neq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const seen = new Set<string>()
  const suggestions: Array<{ id: string; username: string; display_name: string; avatar_url: string | null; isFollowing: boolean }> = []

  for (const row of (posts ?? []) as any[]) {
    const u = row.author
    if (!u || seen.has(u.id)) continue
    seen.add(u.id)
    suggestions.push({
      id: u.id,
      username: u.username ?? '',
      display_name: u.display_name ?? '',
      avatar_url: u.avatar_url ?? null,
      isFollowing: followedIds.has(u.id),
    })
    if (suggestions.length >= 10) break
  }

  return suggestions
}

/**
 * Creates a Stream Chat group channel.
 * Validates session server-side; uses the Stream server SDK to create the channel.
 */
export async function createGroupChat(name: string, memberIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    throw new Error('Unauthorized')
  }

  // Fetch current user's platform profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .eq('auth_id', authUser.id)
    .single()

  if (profileError || !profile) {
    throw new Error('User profile not found')
  }

  if (!name.trim()) {
    throw new Error('Group name is required')
  }

  if (memberIds.length < 2) {
    throw new Error('A group chat requires at least 2 other members')
  }

  const apiKey = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_KEY!
  const apiSecret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET!

  if (!apiKey || !apiSecret) {
    throw new Error('Stream Chat configuration missing on server')
  }

  const streamServerClient = new StreamClient(apiKey, apiSecret)

  // Include the creator in the members list
  const allMemberIds = Array.from(new Set([profile.id, ...memberIds]))

  // Fetch all member details from Supabase so we can upsert them in Stream
  const { data: memberProfiles } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .in('id', allMemberIds)

  if (memberProfiles && memberProfiles.length > 0) {
    await streamServerClient.upsertUsers(
      memberProfiles.map((m) => ({
        id: m.id,
        name: m.display_name || 'User',
        image: m.avatar_url ?? undefined,
      }))
    )
  }

  // Build channel id — deterministic based on timestamp + creator
  const channelId = `group_${Date.now()}_${profile.id.slice(0, 8)}`

  // Use the chat sub-client to create the channel
  const channel = streamServerClient.chat.channel('messaging', channelId)
  await channel.getOrCreate({
    data: {
      created_by_id: profile.id,
      members: allMemberIds.map((id) => ({ user_id: id })),
      custom: { name: name.trim() },
    },
  })

  return { channelId }
}
