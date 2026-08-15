'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchUsers(query: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')
  const { data } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20)
  return data ?? []
}

export async function searchPosts(query: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')
  const { data } = await supabase
    .from('posts')
    .select(`id, content, created_at, author:users!posts_user_id_fkey(username, display_name, avatar_url)`)
    .ilike('content', `%${query}%`)
    .limit(20)
  return (data ?? []).map((p: any) => ({
    id: p.id,
    caption: p.content ?? null,
    created_at: p.created_at,
    author: p.author ?? null,
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
