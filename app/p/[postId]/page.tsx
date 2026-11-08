import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { parsePostContent } from '@/lib/post-helpers'

/*
 * Public share page for a post: /p/<postId>.
 *
 * Shared links (mobile share sheet, WhatsApp, iMessage, X…) need Open Graph
 * tags that crawlers can read without signing in, so this lives outside /app.
 * Only public posts from public accounts expose their text and media; anything
 * else gets a generic card. Signed-in visitors go straight to the post.
 */

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ postId: string }> }

type SharedPost = {
    id: string
    text: string
    authorName: string
    username: string | null
    avatarUrl: string | null
    imageUrl: string | null
    isVideo: boolean
    visible: boolean
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Cloudinary videos expose a first-frame JPEG; Supabase thumbnails are used as-is. */
function videoPoster(mediaUrl: string, thumbnailUrl: string | null): string | null
{
    if (thumbnailUrl) return thumbnailUrl.split('?')[0]
    const m = mediaUrl.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.+)\.[a-z0-9]+(\?.*)?$/i)
    return m ? `${m[1]}so_0/${m[2]}.jpg` : null
}

const getSharedPost = cache(async (postId: string): Promise<SharedPost | null> =>
{
    if (!UUID_RE.test(postId)) return null
    const db = createServiceClient()
    const { data: post } = await db
        .from('posts')
        .select('id, user_id, content')
        .eq('id', postId)
        .maybeSingle()
    if (!post) return null

    const [{ data: author }, { data: medias }] = await Promise.all([
        db.from('users')
            .select('id, username, fullname, display_name, avatar_url, profile_image_url, is_private')
            .eq('id', post.user_id)
            .maybeSingle(),
        db.from('post_medias')
            .select('media_url, media_type, thumbnail_url, created_at')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
            .limit(4),
    ])

    const { caption, options } = parsePostContent(post.content)
    const visible = !author?.is_private && (options.audience ?? 'public') === 'public'
    const first = (medias ?? [])[0]
    const isVideo = first?.media_type === 'video'
    const imageUrl = first ? (isVideo ? videoPoster(first.media_url, first.thumbnail_url) : first.media_url) : null

    return {
        id: post.id,
        text: (caption ?? '').trim(),
        authorName: author?.display_name || author?.fullname || (author?.username ? `@${author.username}` : 'A HubNovo member'),
        username: author?.username ?? null,
        avatarUrl: author?.avatar_url || author?.profile_image_url || null,
        imageUrl: visible ? imageUrl : null,
        isVideo,
        visible,
    }
})

async function siteOrigin(): Promise<string>
{
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host') || 'hubnovo.com'
    const proto = h.get('x-forwarded-proto') || 'https'
    return `${proto}://${host}`
}

const snippet = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)

export async function generateMetadata({ params }: Props): Promise<Metadata>
{
    const { postId } = await params
    const post = await getSharedPost(postId)
    const origin = await siteOrigin()
    const url = `${origin}/p/${postId}`
    const fallbackImage = `${origin}/logo.png`

    if (!post) return { title: 'Post not found · HubNovo' }

    const title = post.visible ? `${post.authorName} on HubNovo` : 'A post on HubNovo'
    const description = post.visible && post.text
        ? snippet(post.text.replace(/\s+/g, ' '), 200)
        : post.visible && post.isVideo
            ? `Watch ${post.authorName}'s video on HubNovo`
            : 'See what people are sharing on HubNovo — community, jobs, learning and more.'
    const image = post.imageUrl ?? fallbackImage

    return {
        title,
        description,
        metadataBase: new URL(origin),
        alternates: { canonical: url },
        openGraph: {
            type: 'article',
            url,
            siteName: 'HubNovo',
            title,
            description,
            images: [{ url: image, alt: post.visible ? snippet(post.text || title, 100) : 'HubNovo' }],
        },
        twitter: {
            card: post.imageUrl ? 'summary_large_image' : 'summary',
            title,
            description,
            images: [image],
        },
    }
}

export default async function SharedPostPage({ params }: Props)
{
    const { postId } = await params
    const post = await getSharedPost(postId)
    if (!post) notFound()

    // Members get the full post experience.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect(`/app/feed/${postId}`)

    return (
        <main className="min-h-screen bg-muted/40 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg space-y-5">
                <Link href="/" className="flex items-center justify-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="HubNovo" className="h-9 w-9 rounded-xl" />
                    <span className="text-lg font-bold">HubNovo</span>
                </Link>

                <article className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                        {post.visible && post.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                {post.authorName.slice(0, 1).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-semibold truncate">{post.visible ? post.authorName : 'HubNovo member'}</p>
                            {post.visible && post.username ? (
                                <p className="text-sm text-muted-foreground truncate">@{post.username}</p>
                            ) : null}
                        </div>
                    </div>

                    {post.visible ? (
                        <>
                            {post.text ? <p className="px-4 pb-4 whitespace-pre-line text-[15px] leading-relaxed">{snippet(post.text, 600)}</p> : null}
                            {post.imageUrl ? (
                                <div className="relative bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={post.imageUrl} alt="" className="w-full max-h-[480px] object-cover" />
                                    {post.isVideo ? (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <span className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white">▶ Video</span>
                                        </span>
                                    ) : null}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <p className="px-4 pb-5 text-muted-foreground">This post is only visible to members. Sign in to see it.</p>
                    )}
                </article>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href={`/auth/login?next=${encodeURIComponent(`/app/feed/${postId}`)}`}
                        className="flex-1 rounded-xl bg-primary px-4 py-3 text-center font-semibold text-primary-foreground hover:opacity-90"
                    >
                        Open in HubNovo
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-center font-semibold hover:bg-muted"
                    >
                        Join HubNovo
                    </Link>
                </div>
            </div>
        </main>
    )
}
