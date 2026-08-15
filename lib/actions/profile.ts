'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// ─── Validation schemas ───────────────────────────────────────────────────────

const onboardingSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or fewer'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or fewer')
    .regex(
      /^[a-z0-9_]+$/,
      'Username may only contain lowercase letters, numbers, and underscores',
    ),
  bio: z
    .string()
    .max(160, 'Bio must be 160 characters or fewer')
    .optional()
    .or(z.literal('')),
  profession: z.string().max(100).optional().or(z.literal('')),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or fewer'),
  bio: z
    .string()
    .max(160, 'Bio must be 160 characters or fewer')
    .optional()
    .or(z.literal('')),
  profession: z.string().max(100).optional().or(z.literal('')),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

const updatePrivacySchema = z.object({
  is_private: z.boolean(),
})

const updateNotificationsSchema = z.object({
  notifications_follows: z.boolean(),
  notifications_reactions: z.boolean(),
  notifications_comments: z.boolean(),
  notifications_mentions: z.boolean(),
})

const setPinSchema = z.object({
  pin: z
    .string()
    .length(6, 'PIN must be exactly 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only digits'),
  current_pin: z.string().optional(),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * Completes the onboarding flow for a newly registered user.
 * Updates the users row and sets onboarded=true, then redirects to /app/feed.
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export async function completeOnboarding(formData: {
  display_name: string
  username: string
  bio?: string
  profession?: string
  avatar_url?: string
}): Promise<ActionResult> {
  const supabase = await createClient()

  // 1. Verify session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be signed in to complete onboarding.' }
  }

  // 2. Validate input
  const parsed = onboardingSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { display_name, username, bio, profession, avatar_url } = parsed.data

  // 3. Check username uniqueness (server-side double-check)
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .neq('auth_id', user.id)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'That username is already taken. Please choose another.' }
  }

  // 4. Update users row
  const { error: updateError } = await supabase
    .from('users')
    .update({
      display_name,
      username,
      bio: bio || null,
      profession: profession || null,
      avatar_url: avatar_url || null,
      onboarded: true,
      updated_at: new Date().toISOString(),
    })
    .eq('auth_id', user.id)

  if (updateError) {
    console.error('completeOnboarding update error:', updateError.message)
    if (updateError.code === '23505') {
      return { success: false, error: 'That username is already taken. Please choose another.' }
    }
    return { success: false, error: 'Failed to save your profile. Please try again.' }
  }

  // 5. Redirect to feed
  redirect('/app/feed')
}

/**
 * Updates display_name, bio, profession, and avatar_url for the current user.
 * Requirements: 3.2, 3.5, 3.6
 */
export async function updateProfile(formData: {
  display_name: string
  bio?: string
  profession?: string
  avatar_url?: string
}): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be signed in to update your profile.' }
  }

  const parsed = updateProfileSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { display_name, bio, profession, avatar_url } = parsed.data

  const { error: updateError } = await supabase
    .from('users')
    .update({
      display_name,
      bio: bio || null,
      profession: profession || null,
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('auth_id', user.id)

  if (updateError) {
    console.error('updateProfile error:', updateError.message)
    return { success: false, error: 'Failed to update profile. Please try again.' }
  }

  revalidatePath('/app/settings')

  return { success: true }
}

/**
 * Sets or changes the 6-digit wallet PIN for the current user.
 * If the user already has a PIN, current_pin must be provided and correct.
 * Requirement: 10.8
 */
export async function setPin(formData: {
  pin: string
  current_pin?: string
}): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be signed in to set a PIN.' }
  }

  const parsed = setPinSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid PIN.' }
  }

  // Fetch current PIN hash
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('wallet_pin')
    .eq('auth_id', user.id)
    .single()

  if (fetchError || !profile) {
    return { success: false, error: 'Failed to fetch profile. Please try again.' }
  }

  // If user already has a PIN, verify the current one
  if (profile.wallet_pin) {
    if (!formData.current_pin) {
      return { success: false, error: 'Please enter your current PIN to change it.' }
    }
    const match = await bcrypt.compare(formData.current_pin, profile.wallet_pin)
    if (!match) {
      return { success: false, error: 'Current PIN is incorrect.' }
    }
  }

  // Hash the new PIN and save
  const hash = await bcrypt.hash(formData.pin, 12)

  const { error: updateError } = await supabase
    .from('users')
    .update({ wallet_pin: hash, updated_at: new Date().toISOString() })
    .eq('auth_id', user.id)

  if (updateError) {
    console.error('setPin error:', updateError.message)
    return { success: false, error: 'Failed to save PIN. Please try again.' }
  }

  revalidatePath('/app/settings')

  return { success: true }
}

/**
 * Updates the is_private flag for the current user.
 */
export async function updatePrivacy(formData: {
  is_private: boolean
}): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be signed in.' }
  }

  const parsed = updatePrivacySchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' }
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ is_private: parsed.data.is_private, updated_at: new Date().toISOString() })
    .eq('auth_id', user.id)

  if (updateError) {
    return { success: false, error: 'Failed to update privacy setting.' }
  }

  revalidatePath('/app/settings')

  return { success: true }
}

/**
 * Updates notification preference toggles for the current user.
 */
export async function updateNotifications(formData: {
  notifications_follows: boolean
  notifications_reactions: boolean
  notifications_comments: boolean
  notifications_mentions: boolean
}): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be signed in.' }
  }

  const parsed = updateNotificationsSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' }
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('auth_id', user.id)

  if (updateError) {
    return { success: false, error: 'Failed to update notification settings.' }
  }

  revalidatePath('/app/settings')

  return { success: true }
}

/**
 * Follow a user by targetId.
 * Inserts a user_follows row and a notification for the target user.
 * Requirements: 6.7, 6.8
 */
export async function followUser(targetId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be signed in to follow users.' }
  }

  // Get current user's platform profile id
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'User profile not found.' }
  }

  if (profile.id === targetId) {
    return { success: false, error: 'You cannot follow yourself.' }
  }

  // Insert follow row (ignore if already following)
  const { error: followError } = await supabase
    .from('user_follows')
    .insert({ follower_id: profile.id, following_id: targetId })

  if (followError) {
    if (followError.code === '23505') {
      // Already following — treat as success
      return { success: true }
    }
    console.error('followUser error:', followError.message)
    return { success: false, error: 'Failed to follow user. Please try again.' }
  }

  // Insert notification — silent on failure
  try {
    await supabase.from('notifications').insert({
      recipient_id: targetId,
      actor_id: profile.id,
      type: 'follow',
      reference_id: profile.id,
      read: false,
    })
  } catch (err) {
    console.error('followUser notification error:', err)
  }

  revalidatePath('/app/profile')

  return { success: true }
}

/**
 * Unfollow a user by targetId.
 * Deletes the user_follows row.
 * Requirements: 6.9
 */
export async function unfollowUser(targetId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be signed in to unfollow users.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'User profile not found.' }
  }

  const { error: unfollowError } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', profile.id)
    .eq('following_id', targetId)

  if (unfollowError) {
    console.error('unfollowUser error:', unfollowError.message)
    return { success: false, error: 'Failed to unfollow user. Please try again.' }
  }

  revalidatePath('/app/profile')

  return { success: true }
}

/**
 * Fetch paginated followers or following list for a user.
 */
export async function fetchFollowList(
  userId: string,
  type: 'followers' | 'following',
  cursor: string | null,
  limit: number = 20
): Promise<{
  users: Array<{ id: string; username: string; display_name: string; avatar_url: string | null }>
  nextCursor: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { users: [], nextCursor: null }

  if (type === 'followers') {
    // people who follow userId
    let query = supabase
      .from('user_follows')
      .select('follower:users(id, username, display_name, avatar_url), created_at')
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (cursor) query = query.lt('created_at', cursor)

    const { data, error } = await query
    if (error || !data) return { users: [], nextCursor: null }

    const hasMore = data.length > limit
    const page = hasMore ? data.slice(0, limit) : data

    return {
      users: page.map((r: any) => r.follower).filter(Boolean),
      nextCursor: hasMore ? page[page.length - 1].created_at : null,
    }
  } else {
    // people userId follows
    let query = supabase
      .from('user_follows')
      .select('following:users(id, username, display_name, avatar_url), created_at')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (cursor) query = query.lt('created_at', cursor)

    const { data, error } = await query
    if (error || !data) return { users: [], nextCursor: null }

    const hasMore = data.length > limit
    const page = hasMore ? data.slice(0, limit) : data

    return {
      users: page.map((r: any) => r.following).filter(Boolean),
      nextCursor: hasMore ? page[page.length - 1].created_at : null,
    }
  }
}


/**
 * Permanently deletes the authenticated user's account.
 * Removes the users row and revokes the Supabase auth session.
 * Financial/legal records are retained by DB-level policies.
 */
export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return { success: false, error: 'Not authenticated.' }
  }

  // Resolve the platform users.id
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'User profile not found.' }
  }

  // Delete the users row — cascades are handled by DB foreign keys
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', profile.id)

  if (deleteError) {
    console.error('deleteAccount error:', deleteError)
    return { success: false, error: 'Failed to delete account. Please try again or contact support.' }
  }

  // Sign out the auth session
  await supabase.auth.signOut()

  redirect('/')
}
