'use server'

import { createClient } from '@/lib/supabase/server'
import type { PostWithAuthor } from '@/lib/types'

const DEFAULT_LIMIT = 10

/**
 * Batch-fetch comment counts, reaction counts, and the current viewer's own
 * reactions for a set of posts — shared by every feed-listing query so like
 * and comment counts are never silently left at zero.
 */
async function fetchEngagementMaps(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postIds: string[],
  currentUserId: string | null
): Promise<{
  commentCountMap: Record<string, number>
  reactionCountMap: Record<string, number>
  userReactedSet: Set<string>
  userSavedSet: Set<string>
}> {
  if (postIds.length === 0) {
    return { commentCountMap: {}, reactionCountMap: {}, userReactedSet: new Set(), userSavedSet: new Set() }
  }

  const [{ data: commentRows }, { data: reactionRows }, { data: userReactionRows }, { data: userSavedRows }] = await Promise.all([
    supabase.from('post_comments').select('post_id').in('post_id', postIds),
    supabase.from('post_reactions').select('post_id').in('post_id', postIds),
    currentUserId
      ? supabase.from('post_reactions').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    currentUserId
      ? supabase.from('saved_posts').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ])

  const commentCountMap: Record<string, number> = {}
  for (const c of commentRows ?? []) {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1
  }

  const reactionCountMap: Record<string, number> = {}
  for (const r of reactionRows ?? []) {
    reactionCountMap[r.post_id] = (reactionCountMap[r.post_id] ?? 0) + 1
  }

  const userReactedSet = new Set((userReactionRows ?? []).map((r) => r.post_id))
  const userSavedSet = new Set((userSavedRows ?? []).map((r) => r.post_id))

  return { commentCountMap, reactionCountMap, userReactedSet, userSavedSet }
}

/**
 * Fetch a page of posts using cursor-based pagination.
 * Posts are ordered by created_at DESC.
 * If cursor is provided, only posts with created_at < cursor are returned.
 * Prioritises posts from users the current user follows, falling back to all posts.
 */
export async function fetchPostsPage(
  cursor: string | null,
  limit: number = DEFAULT_LIMIT
): Promise<{ posts: PostWithAuthor[]; nextCursor: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { posts: [], nextCursor: null }
  }

  // Get the current user's profile id
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  const currentUserId = profile?.id ?? null

  // Exclude posts from users the viewer has blocked (either direction)
  const { data: blockedRows } = currentUserId
    ? await supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`)
    : { data: [] }

  const blockedUserIds = new Set(
    (blockedRows ?? []).flatMap((r: any) => [r.blocker_id, r.blocked_id])
  )
  blockedUserIds.delete(currentUserId ?? '')

  // Build the base query using actual DB column names:
  // posts.user_id (not author_id), posts.content (not caption), posts.post_type (not type)
  let query = supabase
    .from('posts')
    .select(
        `
        id,
        user_id,
        post_type,
        content,
        created_at,
        updated_at,
        author:users!posts_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url
        ),
        medias:post_medias (
            id,
            post_id,
            media_url,
            media_type,
            created_at
        )
        `
    )
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (blockedUserIds.size > 0) {
    query = query.not('user_id', 'in', `(${[...blockedUserIds].join(',')})`)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: postsData, error: postsError } = await query

  if (postsError || !postsData) {
    console.error('fetchPostsPage error:', postsError)
    return { posts: [], nextCursor: null }
  }

  const hasMore = postsData.length > limit
  const chronologicalPage = hasMore ? postsData.slice(0, limit) : postsData

  if (chronologicalPage.length === 0) {
    return { posts: [], nextCursor: null }
  }

  // Cursor pagination must stay anchored to the real chronological order,
  // so compute it before shuffling the display order below.
  const nextCursor = hasMore ? chronologicalPage[chronologicalPage.length - 1].created_at : null

  // Keep the feed strictly chronological:
  // newest posts first, oldest posts last.
  const pagePosts = chronologicalPage

  const postIds = pagePosts.map((p) => p.id)

  const { commentCountMap, reactionCountMap, userReactedSet, userSavedSet } = await fetchEngagementMaps(
    supabase,
    postIds,
    currentUserId
  )

  // Which of these authors does the viewer already follow?
  const authorIds = [
    ...new Set(pagePosts.map((p: any) => p.user_id).filter(Boolean)),
  ]

  const { data: followingRows } = currentUserId && authorIds.length > 0
    ? await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .in('following_id', authorIds)
    : { data: [] }

  const followingSet = new Set((followingRows ?? []).map((r: any) => r.following_id))

  // Assemble PostWithAuthor objects — map real columns to app type shape
  const posts: PostWithAuthor[] = pagePosts.map((p: any) => ({
    id: p.id,
    author_id: p.user_id,
    type: (p.post_type as 'text' | 'image' | 'video') ?? 'text',
    caption: p.content ?? null,
    hashtags: [],
    created_at: p.created_at,
    updated_at: p.updated_at,
    author: {
      id: p.author?.id ?? '',
      username: p.author?.username ?? '',
      display_name: p.author?.display_name ?? '',
      avatar_url: p.author?.avatar_url ?? null,
      verified: false,
    },
    medias: (p.medias ?? []).map((m: any, idx: number) => ({
      id: m.id,
      post_id: m.post_id,
      url: m.media_url,
      media_type: (m.media_type as 'image' | 'video') ?? 'image',
      width: null,
      height: null,
      duration_s: null,
      position: idx,
      created_at: m.created_at ?? p.created_at,
    })),
    reaction_count: reactionCountMap[p.id] ?? 0,
    comment_count: commentCountMap[p.id] ?? 0,
    user_reacted: userReactedSet.has(p.id),
    user_saved: userSavedSet.has(p.id),
    is_following_author: followingSet.has(p.user_id),
  }))

  return { posts, nextCursor }
}

/**
 * Create a new post with optional media attachments.
 */
export async function createPost(
  caption: string,
  type: 'text' | 'image' | 'video',
  mediaUrls: Array<{
    url: string
    media_type: 'image' | 'video'
    width?: number
    height?: number
    duration_s?: number
  }>
): Promise<PostWithAuthor> {
  const supabase = await createClient()

  // getUser() verifies the JWT server-side; fall back to getSession() on network error
  let user: import('@supabase/supabase-js').User | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) throw new Error('Unauthenticated')
    user = data.user
  } catch (err: any) {
    if (err?.message === 'Unauthenticated') throw err
    // Network error (ECONNRESET etc.) — fall back to session cookie
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.user) throw new Error('Unauthenticated')
    user = sessionData.session.user
  }

  // Get the platform user profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, verified')
    .eq('auth_id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  // Extract hashtags from caption
  const hashtags = (caption.match(/#(\w+)/g) ?? []).map((t) => t.slice(1).toLowerCase())

  // Insert the post using real DB column names
  // post_type enum: 'post' | 'funding' | 'cource' — regular feed posts are always 'post'
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: profile.id,
      post_type: 'post',
      content: caption,
    })
    .select()
    .single()

  if (postError || !post) {
    console.error('createPost insert error:', postError)
    throw new Error('Failed to create post')
  }

  // Insert media rows using real DB column names
  const insertedMedias: import('@/lib/types').PostMedia[] = []
  if (mediaUrls.length > 0) {
    const mediaRows = mediaUrls.map((m) => ({
      post_id: post.id,
      user_id: profile.id,
      media_url: m.url,
      media_type: m.media_type,
    }))

    const { data: medias, error: mediaError } = await supabase
      .from('post_medias')
      .insert(mediaRows)
      .select()

    if (mediaError) {
      console.error('createPost media insert error:', mediaError)
    } else if (medias) {
      insertedMedias.push(...(medias as any[]).map((m, idx) => ({
        id: m.id,
        post_id: m.post_id,
        url: m.media_url,
        media_type: m.media_type,
        width: null,
        height: null,
        duration_s: null,
        position: idx,
        created_at: m.created_at ?? post.created_at,
      })))
    }
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/app/feed')

  return {
    id: post.id,
    author_id: post.user_id,
    type: (post.post_type as 'text' | 'image' | 'video') ?? type,
    caption: post.content ?? null,
    hashtags: [],
    created_at: post.created_at,
    updated_at: post.updated_at,
    author: {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url ?? null,
      verified: false,
    },
    medias: insertedMedias,
    reaction_count: 0,
    comment_count: 0,
    user_reacted: false,
    user_saved: false,
  }
}

/**
 * Delete a post owned by the current user.
 * Cleans up related media, reactions, comments, and saves before removing the post.
 */
export async function deletePost(postId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()

  let user: import('@supabase/supabase-js').User | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) throw new Error('Unauthenticated')
    user = data.user
  } catch (err: any) {
    if (err?.message === 'Unauthenticated') throw err
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.user) throw new Error('Unauthenticated')
    user = sessionData.session.user
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  // Verify ownership
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('id, user_id')
    .eq('id', postId)
    .single()

  if (fetchError || !post) throw new Error('Post not found')
  if (post.user_id !== profile.id) throw new Error('Unauthorized to delete this post')

  // Clean up child rows to prevent foreign key errors
  await Promise.all([
    supabase.from('post_medias').delete().eq('post_id', postId),
    supabase.from('post_reactions').delete().eq('post_id', postId),
    supabase.from('post_comments').delete().eq('post_id', postId),
    supabase.from('saved_posts').delete().eq('post_id', postId),
  ])

  // Delete the post row
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', profile.id)

  if (deleteError) {
    console.error('deletePost error:', deleteError)
    throw new Error('Failed to delete post')
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/app/feed')
  revalidatePath('/app/profile')

  return { success: true }
}

/**
 * Add a comment to a post, or a reply to an existing comment when
 * parentCommentId is provided.
 */
export async function addComment(
  postId: string,
  body: string,
  parentCommentId: string | null = null
): Promise<{
  id: string
  body: string
  created_at: string
  parent_comment_id: string | null
  author: { username: string; display_name: string; avatar_url: string | null }
}> {
  const supabase = await createClient()
  let user: import('@supabase/supabase-js').User | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) throw new Error('Unauthenticated')
    user = data.user
  } catch (err: any) {
    if (err?.message === 'Unauthenticated') throw err
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.user) throw new Error('Unauthenticated')
    user = sessionData.session.user
  }

  const trimmed = body.trim()
  if (!trimmed || trimmed.length < 1) throw new Error('Comment cannot be empty')
  if (trimmed.length > 1000) throw new Error('Comment exceeds 1000 characters')

  // Get the commenter's platform profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url')
    .eq('auth_id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  // Insert the comment using real DB column names
  const { data: comment, error: commentError } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: profile.id,
      comment: trimmed,
      parent_comment_id: parentCommentId,
    })
    .select()
    .single()

  if (commentError || !comment) {
    console.error('addComment insert error:', commentError)
    throw new Error('Failed to add comment')
  }

  // Notify the post author, and the parent comment's author when replying —
  // silent on failure so a broken notification never blocks the comment itself.
  try {
    const notifyTargets = new Set<string>()

    const { data: postRow } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (postRow && postRow.user_id !== profile.id) {
      notifyTargets.add(postRow.user_id)
    }

    if (parentCommentId) {
      const { data: parentRow } = await supabase
        .from('post_comments')
        .select('user_id')
        .eq('id', parentCommentId)
        .single()

      if (parentRow && parentRow.user_id !== profile.id) {
        notifyTargets.add(parentRow.user_id)
      }
    }

    if (notifyTargets.size > 0) {
      await supabase.from('notifications').insert(
        [...notifyTargets].map((recipientId) => ({
          user_id: recipientId,
          actor_id: profile.id,
          type: 'comment',
          reference_id: postId,
          read: false,
        }))
      )
    }
  } catch (err) {
    console.error('addComment notification error:', err)
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/app/feed/${postId}`)

  return {
    id: comment.id,
    body: comment.comment,
    created_at: comment.created_at,
    parent_comment_id: comment.parent_comment_id ?? null,
    author: {
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url ?? null,
    },
  }
}

/**
 * Toggle the current user's reaction on a post.
 * If a reaction exists, remove it. Otherwise, insert one.
 */
export async function toggleReaction(postId: string): Promise<{ reacted: boolean; reactionCountDelta: number }> {
  const supabase = await createClient()

  let user: import('@supabase/supabase-js').User | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) throw new Error('Unauthenticated')
    user = data.user
  } catch (err: any) {
    if (err?.message === 'Unauthenticated') throw err
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.user) throw new Error('Unauthenticated')
    user = sessionData.session.user
  }

  // Get platform user id
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  // Check if reaction already exists
  const { data: existingRows, error: selectError } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', profile.id)

  if (selectError) {
    console.error('toggleReaction select error:', selectError)
    throw new Error('Failed to check reaction')
  }

  if (existingRows && existingRows.length > 0) {
    // Remove reaction
    const { error: deleteError } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', profile.id)

    if (deleteError) {
      console.error('toggleReaction delete error:', deleteError)
      throw new Error('Failed to remove reaction')
    }
    return { reacted: false, reactionCountDelta: -1 }
  } else {
    // Add reaction - post_reactions only has (id, post_id, user_id, created_at, updated_at)
    const { error: insertError } = await supabase.from('post_reactions').insert({
      post_id: postId,
      user_id: profile.id,
    })

    if (insertError && insertError.code !== '23505') {
      console.error('toggleReaction insert error:', insertError)
      throw new Error('Failed to add reaction')
    }
    return { reacted: true, reactionCountDelta: 1 }
  }
}


/**
 * Toggle whether the current user has saved a post for later.
 * If a save row exists, remove it. Otherwise, insert one.
 * Returns the new saved state so the caller doesn't have to guess.
 */
export async function toggleSavePost(postId: string): Promise<{ saved: boolean }> {
  const supabase = await createClient()

  let user: import('@supabase/supabase-js').User | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) throw new Error('Unauthenticated')
    user = data.user
  } catch (err: any) {
    if (err?.message === 'Unauthenticated') throw err
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.user) throw new Error('Unauthenticated')
    user = sessionData.session.user
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  const { data: existingRows, error: selectError } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', profile.id)

  if (selectError) {
    console.error('toggleSavePost select error:', selectError)
    throw new Error('Failed to check saved post')
  }

  if (existingRows && existingRows.length > 0) {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', profile.id)

    if (error) {
      console.error('toggleSavePost delete error:', error)
      throw new Error('Failed to unsave post')
    }
    return { saved: false }
  }

  const { error } = await supabase.from('saved_posts').insert({
    post_id: postId,
    user_id: profile.id,
  })

  if (error && error.code !== '23505') {
    console.error('toggleSavePost insert error:', error)
    throw new Error('Failed to save post')
  }

  return { saved: true }
}

/**
 * Fetch a page of posts the current user has saved, newest save first.
 * Cursor-paginated on saved_posts.created_at (when it was saved, not when
 * the underlying post was created).
 */
export async function fetchSavedPostsPage(
  cursor: string | null,
  limit: number = DEFAULT_LIMIT
): Promise<{ posts: PostWithAuthor[]; nextCursor: string | null }> {
  const supabase = await createClient()

  let user: import('@supabase/supabase-js').User | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) throw new Error('Unauthenticated')
    user = data.user
  } catch (err: any) {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.user) return { posts: [], nextCursor: null }
    user = sessionData.session.user
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return { posts: [], nextCursor: null }

  let savedQuery = supabase
    .from('saved_posts')
    .select('post_id, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) savedQuery = savedQuery.lt('created_at', cursor)

  const { data: savedRows, error: savedError } = await savedQuery

  if (savedError || !savedRows || savedRows.length === 0) {
    return { posts: [], nextCursor: null }
  }

  const hasMore = savedRows.length > limit
  const savedPage = hasMore ? savedRows.slice(0, limit) : savedRows
  const nextCursor = hasMore ? savedPage[savedPage.length - 1].created_at : null

  const postIds = savedPage.map((r) => r.post_id)

  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select(
      `
      id,
      user_id,
      post_type,
      content,
      created_at,
      updated_at,
      author:users!posts_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        verified
      ),
      medias:post_medias (
        id,
        post_id,
        media_url,
        media_type,
        created_at
      )
      `
    )
    .in('id', postIds)

  if (postsError || !postsData) {
    console.error('fetchSavedPostsPage posts error:', postsError)
    return { posts: [], nextCursor: null }
  }

  // Keep save-order (most recently saved first), not posts' own created_at order.
  const postsById = new Map((postsData as any[]).map((p) => [p.id, p]))
  const orderedPosts = postIds.map((id) => postsById.get(id)).filter(Boolean)

  const { commentCountMap, reactionCountMap, userReactedSet } = await fetchEngagementMaps(
    supabase,
    postIds,
    profile.id
  )

  const posts: PostWithAuthor[] = orderedPosts.map((p: any) => ({
    id: p.id,
    author_id: p.user_id,
    type: (p.post_type as 'text' | 'image' | 'video') ?? 'text',
    caption: p.content ?? null,
    hashtags: [],
    created_at: p.created_at,
    updated_at: p.updated_at,
    author: {
      id: p.author?.id ?? '',
      username: p.author?.username ?? '',
      display_name: p.author?.display_name ?? '',
      avatar_url: p.author?.avatar_url ?? null,
      verified: p.author?.verified ?? false,
    },
    medias: (p.medias ?? []).map((m: any, idx: number) => ({
      id: m.id,
      post_id: m.post_id,
      url: m.media_url,
      media_type: (m.media_type as 'image' | 'video') ?? 'image',
      width: null,
      height: null,
      duration_s: null,
      position: idx,
      created_at: m.created_at ?? p.created_at,
    })),
    reaction_count: reactionCountMap[p.id] ?? 0,
    comment_count: commentCountMap[p.id] ?? 0,
    user_reacted: userReactedSet.has(p.id),
    user_saved: true,
  }))

  return { posts, nextCursor }
}

/**
 * Fetch a page of posts by a specific author (for profile pages).
 * Uses cursor-based pagination on created_at DESC.
 * Requirements: 6.5
 */
export async function fetchUserPostsPage(
  authorId: string,
  cursor: string | null,
  limit: number = 12
): Promise<{ posts: PostWithAuthor[]; nextCursor: string | null }> {
  const supabase = await createClient()

  // Auth is optional — we only need currentUserId for the user_reacted field.
  // Unauthenticated viewers still see posts; user_reacted will be false.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentUserId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()
    currentUserId = profile?.id ?? null
  }

  let query = supabase
    .from('posts')
    .select(
      `
      id,
      user_id,
      post_type,
      content,
      created_at,
      updated_at,
      author:users!posts_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        verified
      ),
      medias:post_medias (
        id,
        post_id,
        media_url,
        media_type,
        created_at
      )
    `
    )
    .eq('user_id', authorId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: postsData, error: postsError } = await query

  if (postsError || !postsData) {
    console.error('fetchUserPostsPage error:', postsError)
    return { posts: [], nextCursor: null }
  }

  const hasMore = postsData.length > limit
  const pagePosts = hasMore ? postsData.slice(0, limit) : postsData

  if (pagePosts.length === 0) {
    return { posts: [], nextCursor: null }
  }

  const postIds = pagePosts.map((p) => p.id)

  const { commentCountMap, reactionCountMap, userReactedSet, userSavedSet } = await fetchEngagementMaps(
    supabase,
    postIds,
    currentUserId
  )

  const posts: PostWithAuthor[] = pagePosts.map((p: any) => ({
    id: p.id,
    author_id: p.user_id,
    type: (p.post_type as 'text' | 'image' | 'video') ?? 'text',
    caption: p.content ?? null,
    hashtags: [],
    created_at: p.created_at,
    updated_at: p.updated_at,
    author: {
      id: p.author?.id ?? '',
      username: p.author?.username ?? '',
      display_name: p.author?.display_name ?? '',
      avatar_url: p.author?.avatar_url ?? null,
      verified: p.author?.verified ?? false,
    },
    medias: (p.medias ?? []).map((m: any, idx: number) => ({
      id: m.id,
      post_id: m.post_id,
      url: m.media_url,
      media_type: (m.media_type as 'image' | 'video') ?? 'image',
      width: null,
      height: null,
      duration_s: null,
      position: idx,
      created_at: m.created_at ?? p.created_at,
    })),
    reaction_count: reactionCountMap[p.id] ?? 0,
    comment_count: commentCountMap[p.id] ?? 0,
    user_reacted: userReactedSet.has(p.id),
    user_saved: userSavedSet.has(p.id),
  }))

  const nextCursor = hasMore ? pagePosts[pagePosts.length - 1].created_at : null

  return { posts, nextCursor }
}


/**
 * Discover tab — posts from users the current user does NOT follow.
 * Falls back to all posts if no follows exist yet.
 */
export async function fetchDiscoverPosts(
  cursor: string | null,
  limit: number = DEFAULT_LIMIT
): Promise<{ posts: PostWithAuthor[]; nextCursor: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { posts: [], nextCursor: null }

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return { posts: [], nextCursor: null }

  // Get IDs the current user follows
  const { data: follows } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', profile.id)

  const followedIds = (follows ?? []).map((f: any) => f.following_id)
  // Exclude own posts and followed users
  const excludeIds = [...followedIds, profile.id]

  let query = supabase
    .from('posts')
    .select(`
      id, user_id, post_type, content, created_at, updated_at,
      author:users!posts_user_id_fkey (id, username, display_name, avatar_url),
      medias:post_medias (id, post_id, media_url, media_type, created_at)
    `)
    .not('user_id', 'in', `(${excludeIds.join(',')})`)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) query = query.lt('created_at', cursor)

  const { data, error } = await query
  if (error || !data) return { posts: [], nextCursor: null }

  const hasMore = data.length > limit
  const page = hasMore ? data.slice(0, limit) : data

  const { commentCountMap, reactionCountMap, userReactedSet, userSavedSet } = await fetchEngagementMaps(
    supabase,
    page.map((p: any) => p.id),
    profile.id
  )

  const posts: PostWithAuthor[] = page.map((p: any, idx: number) => ({
    id: p.id,
    author_id: p.user_id,
    type: (p.post_type as 'text' | 'image' | 'video') ?? 'text',
    caption: p.content ?? null,
    hashtags: [],
    created_at: p.created_at,
    updated_at: p.updated_at,
    author: {
      id: p.author?.id ?? '',
      username: p.author?.username ?? '',
      display_name: p.author?.display_name ?? '',
      avatar_url: p.author?.avatar_url ?? null,
      verified: false,
    },
    medias: (p.medias ?? []).map((m: any, i: number) => ({
      id: m.id,
      post_id: m.post_id,
      url: m.media_url,
      media_type: (m.media_type as 'image' | 'video') ?? 'image',
      width: null, height: null, duration_s: null,
      position: i,
      created_at: m.created_at ?? p.created_at,
    })),
    reaction_count: reactionCountMap[p.id] ?? 0,
    comment_count: commentCountMap[p.id] ?? 0,
    user_reacted: userReactedSet.has(p.id),
    user_saved: userSavedSet.has(p.id),
  }))

  return {
    posts,
    nextCursor: hasMore ? page[page.length - 1].created_at : null,
  }
}

/**
 * Following tab — posts from users the current user follows.
 */
export async function fetchFollowingPosts(
  cursor: string | null,
  limit: number = DEFAULT_LIMIT
): Promise<{ posts: PostWithAuthor[]; nextCursor: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { posts: [], nextCursor: null }

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return { posts: [], nextCursor: null }

  const { data: follows } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', profile.id)

  const followedIds = (follows ?? []).map((f: any) => f.following_id)
  if (followedIds.length === 0) return { posts: [], nextCursor: null }

  let query = supabase
    .from('posts')
    .select(`
      id, user_id, post_type, content, created_at, updated_at,
      author:users!posts_user_id_fkey (id, username, display_name, avatar_url),
      medias:post_medias (id, post_id, media_url, media_type, created_at)
    `)
    .in('user_id', followedIds)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) query = query.lt('created_at', cursor)

  const { data, error } = await query
  if (error || !data) return { posts: [], nextCursor: null }

  const hasMore = data.length > limit
  const page = hasMore ? data.slice(0, limit) : data

  const { commentCountMap, reactionCountMap, userReactedSet, userSavedSet } = await fetchEngagementMaps(
    supabase,
    page.map((p: any) => p.id),
    profile.id
  )

  const posts: PostWithAuthor[] = page.map((p: any) => ({
    id: p.id,
    author_id: p.user_id,
    type: (p.post_type as 'text' | 'image' | 'video') ?? 'text',
    caption: p.content ?? null,
    hashtags: [],
    created_at: p.created_at,
    updated_at: p.updated_at,
    author: {
      id: p.author?.id ?? '',
      username: p.author?.username ?? '',
      display_name: p.author?.display_name ?? '',
      avatar_url: p.author?.avatar_url ?? null,
      verified: false,
    },
    medias: (p.medias ?? []).map((m: any, i: number) => ({
      id: m.id,
      post_id: m.post_id,
      url: m.media_url,
      media_type: (m.media_type as 'image' | 'video') ?? 'image',
      width: null, height: null, duration_s: null,
      position: i,
      created_at: m.created_at ?? p.created_at,
    })),
    reaction_count: reactionCountMap[p.id] ?? 0,
    comment_count: commentCountMap[p.id] ?? 0,
    user_reacted: userReactedSet.has(p.id),
    user_saved: userSavedSet.has(p.id),
    // This whole tab is posts from people the viewer follows, by definition.
    is_following_author: true,
  }))

  return {
    posts,
    nextCursor: hasMore ? page[page.length - 1].created_at : null,
  }
}

/**
 * Fetch the most recently active users (for StoryRow avatars).
 */
export async function fetchRecentActiveUsers(
  excludeUserId: string,
  limit: number = 5
): Promise<{ id: string; username: string; display_name: string; avatar_url: string | null }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('user_id, author:users!posts_user_id_fkey(id, username, display_name, avatar_url)')
    .neq('user_id', excludeUserId)
    .order('created_at', { ascending: false })
    .limit(50) // fetch more so we can deduplicate

  if (error || !data) return []

  // Deduplicate by user_id and take first `limit` unique users
  const seen = new Set<string>()
  const users: { id: string; username: string; display_name: string; avatar_url: string | null }[] = []

  for (const row of data as any[]) {
    if (!row.author || seen.has(row.user_id)) continue
    seen.add(row.user_id)
    users.push({
      id: row.author.id,
      username: row.author.username ?? '',
      display_name: row.author.display_name ?? '',
      avatar_url: row.author.avatar_url ?? null,
    })
    if (users.length >= limit) break
  }

  return users
}

/**
 * Suggested accounts to follow — excludes the viewer, anyone already
 * followed, and anyone blocked in either direction.
 */
export async function fetchSuggestedUsers(
  limit: number = 6
): Promise<{ id: string; username: string; display_name: string; avatar_url: string | null; verified: boolean; profession: string | null }[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return []

  const [{ data: follows }, { data: blocked }] = await Promise.all([
    supabase.from('user_follows').select('following_id').eq('follower_id', profile.id),
    supabase
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${profile.id},blocked_id.eq.${profile.id}`),
  ])

  const excludeIds = new Set<string>([profile.id])
  for (const f of follows ?? []) excludeIds.add(f.following_id)
  for (const b of blocked ?? []) {
    excludeIds.add(b.blocker_id)
    excludeIds.add(b.blocked_id)
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, verified, profession')
    .order('created_at', { ascending: false })
    .limit(limit + excludeIds.size)

  if (error || !data) return []

  return (data as any[])
    .filter((u) => !excludeIds.has(u.id))
    .slice(0, limit)
    .map((u) => ({
      id: u.id,
      username: u.username ?? '',
      display_name: u.display_name ?? '',
      avatar_url: u.avatar_url ?? null,
      verified: u.verified ?? false,
      profession: u.profession ?? null,
    }))
}

/**
 * Fetch a small list of recent posts for sidebar previews.
 */
export async function fetchRecentPostsPreviews(
  limit: number = 5
): Promise<{ id: string; caption: string | null; author_name: string; created_at: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, content, created_at, author:users!posts_user_id_fkey (display_name)`
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as any[]).map((p) => ({
    id: p.id,
    caption: p.content ?? null,
    author_name: p.author?.display_name ?? 'Unknown',
    created_at: p.created_at,
  }))
}

/**
 * Real "trending" hashtags, computed from actual recent post content — there's
 * no hashtags table, so this parses `#word` out of the most recent posts'
 * captions and ranks by frequency. Bounded to a recent window so it stays cheap.
 */
export async function fetchTrendingHashtags(
  limit: number = 5
): Promise<{ tag: string; count: number }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('content')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error || !data) return []

  const counts: Record<string, number> = {}
  for (const row of data as { content: string | null }[]) {
    const matches = row.content?.match(/#(\w+)/g) ?? []
    for (const raw of matches) {
      const tag = raw.slice(1).toLowerCase()
      counts[tag] = (counts[tag] ?? 0) + 1
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
}