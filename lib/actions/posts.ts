'use server'

import { createClient } from '@/lib/supabase/server'
import type { PostWithAuthor } from '@/lib/types'

const DEFAULT_LIMIT = 10

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

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: postsData, error: postsError } = await query

  if (postsError || !postsData) {
    console.error('fetchPostsPage error:', postsError)
    return { posts: [], nextCursor: null }
  }

  const hasMore = postsData.length > limit
  const pagePosts = hasMore ? postsData.slice(0, limit) : postsData

  if (pagePosts.length === 0) {
    return { posts: [], nextCursor: null }
  }

  const postIds = pagePosts.map((p) => p.id)

  // Fetch comment counts (post_reactions table may not exist yet — handle gracefully)
  const { data: commentCounts } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds)

  const commentCountMap: Record<string, number> = {}
  for (const c of commentCounts ?? []) {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1
  }

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
    reaction_count: 0,
    comment_count: commentCountMap[p.id] ?? 0,
    user_reacted: false,
  }))

  const nextCursor = hasMore ? pagePosts[pagePosts.length - 1].created_at : null

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
  }
}

/**
 * Add a comment to a post.
 */
export async function addComment(
  postId: string,
  body: string
): Promise<{
  id: string
  body: string
  created_at: string
  author: { username: string; display_name: string; avatar_url: string | null }
}> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthenticated')

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
    })
    .select()
    .single()

  if (commentError || !comment) {
    console.error('addComment insert error:', commentError)
    throw new Error('Failed to add comment')
  }

  // Send notification to post author — silent on failure
  try {
    const { data: postRow } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (postRow && postRow.author_id !== profile.id) {
      await supabase.from('notifications').insert({
        recipient_id: postRow.author_id,
        actor_id: profile.id,
        type: 'comment',
        reference_id: postId,
        read: false,
      })
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
export async function toggleReaction(postId: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthenticated')

  // Get platform user id
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (existing) {
    // Remove reaction
    await supabase
      .from('post_reactions')
      .delete()
      .eq('id', existing.id)
  } else {
    // Add reaction
    await supabase.from('post_reactions').insert({
      post_id: postId,
      user_id: profile.id,
      emoji: 'like',
    })
  }
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
      author_id,
      type,
      caption,
      hashtags,
      created_at,
      updated_at,
      author:users (
        id,
        username,
        display_name,
        avatar_url,
        verified
      ),
      medias:post_medias (
        id,
        post_id,
        url,
        media_type,
        width,
        height,
        duration_s,
        position
      )
    `
    )
    .eq('author_id', authorId)
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

  // Fetch reaction counts
  const { data: reactionCounts } = await supabase
    .from('post_reactions')
    .select('post_id')
    .in('post_id', postIds)

  // Fetch comment counts
  const { data: commentCounts } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds)

  // Fetch current user's reactions
  const { data: userReactions } = currentUserId
    ? await supabase
        .from('post_reactions')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', currentUserId)
    : { data: [] }

  const reactionCountMap: Record<string, number> = {}
  for (const r of reactionCounts ?? []) {
    reactionCountMap[r.post_id] = (reactionCountMap[r.post_id] ?? 0) + 1
  }

  const commentCountMap: Record<string, number> = {}
  for (const c of commentCounts ?? []) {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1
  }

  const userReactedSet = new Set((userReactions ?? []).map((r) => r.post_id))

  const posts: PostWithAuthor[] = pagePosts.map((p: any) => ({
    id: p.id,
    author_id: p.author_id,
    type: p.type,
    caption: p.caption,
    hashtags: p.hashtags ?? [],
    created_at: p.created_at,
    updated_at: p.updated_at,
    author: {
      id: p.author?.id ?? '',
      username: p.author?.username ?? '',
      display_name: p.author?.display_name ?? '',
      avatar_url: p.author?.avatar_url ?? null,
      verified: p.author?.verified ?? false,
    },
    medias: (p.medias ?? []).sort((a: any, b: any) => a.position - b.position).map((m: any) => ({
      id: m.id,
      post_id: m.post_id,
      url: m.url,
      media_type: m.media_type,
      width: m.width,
      height: m.height,
      duration_s: m.duration_s,
      position: m.position,
      created_at: m.created_at ?? p.created_at,
    })),
    reaction_count: reactionCountMap[p.id] ?? 0,
    comment_count: commentCountMap[p.id] ?? 0,
    user_reacted: userReactedSet.has(p.id),
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
    reaction_count: 0,
    comment_count: 0,
    user_reacted: false,
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
    reaction_count: 0,
    comment_count: 0,
    user_reacted: false,
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
