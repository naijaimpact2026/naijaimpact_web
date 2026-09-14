'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchUsers(query: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')

  const { data: currentProfile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  const { data } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, cover_url, verified, profession, location')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .neq('auth_id', user.id)
    .limit(20)

  const results = data ?? []
  if (!currentProfile || results.length === 0) {
    return results.map((r) => ({ ...r, is_following: false }))
  }

  const { data: follows } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', currentProfile.id)
    .in('following_id', results.map((r) => r.id))

  const followingSet = new Set((follows ?? []).map((f) => f.following_id))
  return results.map((r) => ({ ...r, is_following: followingSet.has(r.id) }))
}

export async function searchPosts(query: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')
  const { data } = await supabase
    .from('posts')
    .select(`
      id, content, created_at,
      author:users!posts_user_id_fkey(username, display_name, avatar_url),
      medias:post_medias(id, media_url, media_type)
    `)
    .ilike('content', `%${query}%`)
    .limit(20)

  const posts = data ?? []
  const postIds = posts.map((p: any) => p.id)

  const [{ data: reactions }, { data: comments }] = postIds.length > 0
    ? await Promise.all([
        supabase.from('post_reactions').select('post_id').in('post_id', postIds),
        supabase.from('post_comments').select('post_id').in('post_id', postIds),
      ])
    : [{ data: [] }, { data: [] }]

  const reactionCountMap: Record<string, number> = {}
  for (const r of reactions ?? []) reactionCountMap[r.post_id] = (reactionCountMap[r.post_id] ?? 0) + 1
  const commentCountMap: Record<string, number> = {}
  for (const c of comments ?? []) commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1

  return posts.map((p: any) => ({
    id: p.id,
    caption: p.content ?? null,
    created_at: p.created_at,
    author: p.author ?? null,
    cover_url: p.medias?.find((m: any) => m.media_type === 'image')?.media_url ?? null,
    reaction_count: reactionCountMap[p.id] ?? 0,
    comment_count: commentCountMap[p.id] ?? 0,
  }))
}

export async function searchCourses(query: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')
  const { data } = await supabase
    .from('lms_courses')
    .select(`id, title, cover_image_url, amount, is_free, instructor:users!lms_courses_user_id_fkey(display_name, avatar_url)`)
    .ilike('title', `%${query}%`)
    .limit(20)
  return (data ?? []).map((c: any) => ({
    id: c.id,
    title: c.title,
    thumbnail_url: c.cover_image_url ?? null,
    price: c.is_free ? 0 : (c.amount ?? 0),
    instructor: c.instructor ?? null,
  }))
}
