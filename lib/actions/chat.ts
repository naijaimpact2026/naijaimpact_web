'use server'

import { StreamClient } from '@stream-io/node-sdk'
import { StreamChat } from 'stream-chat'
import { createClient } from '@/lib/supabase/server'

function getStreamServerClient(): StreamChat {
  const apiKey = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_KEY!
  const apiSecret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET!

  if (!apiKey || !apiSecret) {
    throw new Error('Stream Chat configuration missing on server')
  }

  return StreamChat.getInstance(apiKey, apiSecret)
}

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

/**
 * Fetch a single user's public profile by their UUID.
 */
export async function getUserProfileById(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, bio, verified, location, created_at')
    .eq('id', userId)
    .single()
  return data
}

/**
 * Fetch multiple users' profiles by their UUIDs (for group member list).
 */
export async function getChannelMembersProfiles(userIds: string[]) {
  if (!userIds || userIds.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, bio, verified, location, created_at')
    .in('id', userIds)
  return data ?? []
}

/**
 * Add members to an existing group chat.
 */
export async function addMembersToGroupChat(channelId: string, memberIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !authUser) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) throw new Error('User profile not found')

  if (!memberIds || memberIds.length === 0) {
    throw new Error('No members selected')
  }

  // Fetch member profiles from Supabase to ensure they exist and have display names
  const { data: memberProfiles } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .in('id', memberIds)

  const serverClient = getStreamServerClient()

  // Ensure added users exist in Stream
  if (memberProfiles && memberProfiles.length > 0) {
    await serverClient.upsertUsers(
      memberProfiles.map((m) => ({
        id: m.id,
        name: m.display_name || 'User',
        image: m.avatar_url ?? undefined,
      }))
    )
  }

  const channel = serverClient.channel('messaging', channelId)
  const names = memberProfiles?.map((m) => m.display_name).filter(Boolean).join(', ') || 'new members'
  
  await channel.addMembers(memberIds, {
    text: `${profile.display_name || 'A member'} added ${names} to the group`,
    user_id: profile.id,
  })

  return { success: true }
}

/**
 * Remove a member from a group chat (admin or member themselves).
 */
export async function removeMemberFromGroupChat(channelId: string, targetUserId: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !authUser) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) throw new Error('User profile not found')

  const serverClient = getStreamServerClient()
  const channel = serverClient.channel('messaging', channelId)

  // Query channel to check if caller is the creator or the member themselves
  const channelState = await channel.query()
  const createdById =
    (channelState.channel.created_by as any)?.id ||
    (channelState.channel as any).created_by_id

  const isCreator = createdById === profile.id
  const isSelf = targetUserId === profile.id

  if (!isCreator && !isSelf) {
    throw new Error('Only the group admin can remove members')
  }

  const { data: targetProfile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', targetUserId)
    .single()

  const targetName = targetProfile?.display_name || 'A member'

  await channel.removeMembers([targetUserId], {
    text: isSelf
      ? `${profile.display_name || 'A member'} left the group`
      : `${profile.display_name || 'Admin'} removed ${targetName} from the group`,
    user_id: profile.id,
  })

  return { success: true }
}

/**
 * Current user leaves a group chat.
 */
export async function leaveGroupChat(channelId: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !authUser) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) throw new Error('User profile not found')

  const serverClient = getStreamServerClient()
  const channel = serverClient.channel('messaging', channelId)

  await channel.removeMembers([profile.id], {
    text: `${profile.display_name || 'A member'} left the group`,
    user_id: profile.id,
  })

  return { success: true }
}

/**
 * Delete or hide conversation and clear history for the calling user.
 */
export async function deleteOrHideConversation(channelId: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !authUser) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) throw new Error('User profile not found')

  const serverClient = getStreamServerClient()
  const channel = serverClient.channel('messaging', channelId)

  // Hide the channel for this user and clear history
  await channel.hide(profile.id, true)

  return { success: true }
}

/**
 * Block a user in Stream Chat and hide any existing DM channel.
 */
export async function blockUserChat(targetUserId: string, channelId?: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !authUser) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) throw new Error('User profile not found')

  const serverClient = getStreamServerClient()
  await serverClient.blockUser(targetUserId, profile.id)

  if (channelId) {
    try {
      const channel = serverClient.channel('messaging', channelId)
      await channel.hide(profile.id, true)
    } catch {
      // Ignore channel hide failure
    }
  }

  return { success: true }
}

/**
 * Unblock a user in Stream Chat.
 */
export async function unblockUserChat(targetUserId: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !authUser) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) throw new Error('User profile not found')

  const serverClient = getStreamServerClient()
  await serverClient.unBlockUser(targetUserId, profile.id)

  return { success: true }
}

/**
 * Fetch candidate users to add to a group chat (excluding existing members).
 */
export async function fetchAvailableUsersToAdd(channelId: string, existingMemberIds: string[]) {
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

  const excludeSet = new Set([...existingMemberIds, profile.id])

  // 1. People current user follows
  const { data: follows } = await supabase
    .from('user_follows')
    .select('following:users!user_follows_following_id_fkey(id, username, display_name, avatar_url, verified)')
    .eq('follower_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const candidates: Array<{
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    verified?: boolean
  }> = []
  const seen = new Set<string>()

  for (const row of (follows ?? []) as any[]) {
    const u = row.following
    if (!u || excludeSet.has(u.id) || seen.has(u.id)) continue
    seen.add(u.id)
    candidates.push({
      id: u.id,
      username: u.username ?? '',
      display_name: u.display_name ?? '',
      avatar_url: u.avatar_url ?? null,
      verified: Boolean(u.verified),
    })
  }

  // 2. Also fetch active users to supplement if list is short
  if (candidates.length < 20) {
    const { data: activeUsers } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, verified')
      .order('created_at', { ascending: false })
      .limit(40)

    for (const u of activeUsers ?? []) {
      if (!u || excludeSet.has(u.id) || seen.has(u.id)) continue
      seen.add(u.id)
      candidates.push({
        id: u.id,
        username: u.username ?? '',
        display_name: u.display_name ?? '',
        avatar_url: u.avatar_url ?? null,
        verified: Boolean(u.verified),
      })
      if (candidates.length >= 30) break
    }
  }

  return candidates
}
