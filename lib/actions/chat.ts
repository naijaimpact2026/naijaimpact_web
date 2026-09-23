'use server'

import { StreamChat } from 'stream-chat'
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

  if (authError || !authUser) {
    throw new Error('Unauthorized')
  }

  // Current user's profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url')
    .eq('auth_id', authUser.id)
    .single()

  if (profileError || !profile) {
    throw new Error('User profile not found')
  }

  if (profile.id === targetUserId) {
    throw new Error('Cannot DM yourself')
  }

  // Target user's profile
  const { data: targetProfile, error: targetProfileError } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url')
    .eq('id', targetUserId)
    .single()

  if (targetProfileError || !targetProfile) {
    throw new Error('Target user profile not found')
  }

  const apiKey = process.env.STREAM_API_KEY
  const apiSecret = process.env.STREAM_API_SECRET

  if (!apiKey) {
    throw new Error('STREAM_API_KEY is not configured')
  }

  if (!apiSecret) {
    throw new Error('STREAM_API_SECRET is not configured')
  }

  const streamServerClient = new StreamChat(apiKey, apiSecret, {
    timeout: 30000,
  })

  // Stream users must exist before they can be added to a channel.
  await streamServerClient.upsertUsers([
    {
      id: profile.id,
      name: profile.display_name || profile.username || profile.id,
      image: profile.avatar_url || undefined,
    },
    {
      id: targetProfile.id,
      name:
        targetProfile.display_name ||
        targetProfile.username ||
        targetProfile.id,
      image: targetProfile.avatar_url || undefined,
    },
  ])

  // Deterministic channel ID — same pair always uses the same channel.
  const sortedIds = [profile.id, targetProfile.id].sort()
  const channelId = `dm_${sortedIds[0].slice(0, 8)}_${sortedIds[1].slice(0, 8)}`

  const channel = streamServerClient.channel('messaging', channelId, {
    created_by_id: profile.id,
    members: [
      { user_id: profile.id },
      { user_id: targetProfile.id },
    ],
  })

  // watch() is a get-or-create operation: it creates the channel if it
  // doesn't exist and returns the existing channel if it does.
  await channel.watch()

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
    .select(
      'following:users!user_follows_following_id_fkey(id, username, display_name, avatar_url)'
    )
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
  Array<{
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    isFollowing: boolean
  }>
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

  const followedIds = new Set(
    (follows ?? []).map((f: any) => f.following_id)
  )

  // Recent active posters excluding current user and already followed
  const { data: posts } = await supabase
    .from('posts')
    .select(
      'author_id, author:users!posts_author_id_fkey(id, username, display_name, avatar_url)'
    )
    .neq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const seen = new Set<string>()

  const suggestions: Array<{
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    isFollowing: boolean
  }> = []

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
    .select('id, display_name, username, avatar_url')
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

  const apiKey = process.env.STREAM_API_KEY
  const apiSecret = process.env.STREAM_API_SECRET

  if (!apiKey) {
    throw new Error('STREAM_API_KEY is not configured')
  }

  if (!apiSecret) {
    throw new Error('STREAM_API_SECRET is not configured')
  }

  const streamServerClient = new StreamChat(apiKey, apiSecret, {
    timeout: 30000,
  })

  // Include the creator in the members list.
  const allMemberIds = Array.from(
    new Set([profile.id, ...memberIds])
  )

  // Fetch the selected members so they can be created/upserted in Stream.
  const { data: memberProfiles, error: membersError } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url')
    .in('id', allMemberIds)

  if (membersError) {
    throw new Error('Could not load group members')
  }

  if (!memberProfiles || memberProfiles.length !== allMemberIds.length) {
    throw new Error('One or more group members could not be found')
  }

  // Make sure every member exists in Stream before creating the channel.
  await streamServerClient.upsertUsers(
    memberProfiles.map((member) => ({
      id: member.id,
      name: member.display_name || member.username || member.id,
      image: member.avatar_url || undefined,
    }))
  )

  // Build channel id — unique for each newly created group.
  const channelId = `group_${Date.now()}_${profile.id.slice(0, 8)}`

  const channel = streamServerClient.channel('messaging', channelId, {
    created_by_id: profile.id,
    members: allMemberIds.map((id) => ({ user_id: id })),
    name: name.trim(),
  })

  // watch() creates the channel if it doesn't exist and returns it if it does.
  await channel.watch()

  return { channelId }
}
