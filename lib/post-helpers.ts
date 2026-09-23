import type { PostWithAuthor } from '@/lib/types'

export interface PostOptions {
  allow_comments?: boolean
  allow_sharing?: boolean
  is_featured?: boolean
  audience?: 'public' | 'connections' | 'group' | 'only-me'
  scheduled_at?: string | null
  group_id?: string | null
}

const META_REGEX = /\n\n<!--hubnovo:post_meta ({[\s\S]*?})-->$/

export function encodePostContent(caption: string, options?: PostOptions): string {
  if (!options) return caption
  const cleanOptions: PostOptions = {}
  if (options.allow_comments === false) cleanOptions.allow_comments = false
  if (options.allow_sharing === false) cleanOptions.allow_sharing = false
  if (options.is_featured === true) cleanOptions.is_featured = true
  if (options.audience && options.audience !== 'public') cleanOptions.audience = options.audience
  if (options.scheduled_at) cleanOptions.scheduled_at = options.scheduled_at
  if (options.group_id) cleanOptions.group_id = options.group_id

  if (Object.keys(cleanOptions).length === 0) return caption
  return `${caption}\n\n<!--hubnovo:post_meta ${JSON.stringify(cleanOptions)}-->`
}

export function parsePostContent(rawContent: string | null): { caption: string | null; options: PostOptions } {
  if (!rawContent) return { caption: null, options: { allow_comments: true, allow_sharing: true, audience: 'public' } }
  const match = rawContent.match(META_REGEX)
  if (!match) return { caption: rawContent, options: { allow_comments: true, allow_sharing: true, audience: 'public' } }
  try {
    const options = JSON.parse(match[1]) as PostOptions
    const cleanCaption = rawContent.replace(META_REGEX, '').trim()
    return {
      caption: cleanCaption || null,
      options: {
        allow_comments: options.allow_comments ?? true,
        allow_sharing: options.allow_sharing ?? true,
        is_featured: options.is_featured ?? false,
        audience: options.audience ?? 'public',
        scheduled_at: options.scheduled_at ?? null,
        group_id: options.group_id ?? null,
      },
    }
  } catch {
    return { caption: rawContent, options: { allow_comments: true, allow_sharing: true, audience: 'public' } }
  }
}

export function toPostWithAuthor(
  p: any,
  reactionCount: number,
  commentCount: number,
  userReacted: boolean,
  userSaved: boolean,
  isFollowingAuthor: boolean = false
): PostWithAuthor {
  const { caption: cleanCaption, options } = parsePostContent(p.content)
  return {
    id: p.id,
    author_id: p.user_id,
    type: (p.post_type as 'text' | 'image' | 'video') ?? 'text',
    caption: cleanCaption,
    hashtags: [],
    created_at: p.created_at,
    updated_at: p.updated_at,
    allow_comments: options.allow_comments ?? true,
    allow_sharing: options.allow_sharing ?? true,
    is_featured: options.is_featured ?? false,
    audience: options.audience ?? 'public',
    scheduled_at: options.scheduled_at ?? null,
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
    reaction_count: reactionCount,
    comment_count: commentCount,
    user_reacted: userReacted,
    user_saved: userSaved,
    is_following_author: isFollowingAuthor,
  }
}
