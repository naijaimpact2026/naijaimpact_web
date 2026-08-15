import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/app/feed/PostCard'
import PostDetailComments from '@/components/app/feed/PostDetailComments'
import PostDetailActions from '@/components/app/feed/PostDetailActions'
import type { PostWithAuthor } from '@/lib/types'
import { ArrowLeft, Clock } from 'lucide-react'
import { fetchRecentPostsPreviews } from '@/lib/actions/posts'

export const dynamic = 'force-dynamic'

interface PageProps { params: Promise<{ postId: string }> }

function timeAgo(dateStr: string): string
{
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

async function getPost(postId: string, currentUserId: string | null): Promise<PostWithAuthor | null>
{
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('posts')
        .select(`id, user_id, post_type, content, created_at, updated_at,
            author:users!posts_user_id_fkey (id, username, display_name, avatar_url),
            medias:post_medias (id, post_id, media_url, media_type, created_at)`)
        .eq('id', postId)
        .single()

    if (error || !data) return null
    const p = data as any

    const [{ count: rc }, { count: cc }] = await Promise.all([
        supabase.from('post_reactions').select('id', { count: 'exact', head: true }).eq('post_id', postId),
        supabase.from('post_comments').select('id', { count: 'exact', head: true }).eq('post_id', postId),
    ])

    let userReacted = false
    if (currentUserId)
    {
        const { data: r } = await supabase
            .from('post_reactions').select('id').eq('post_id', postId).eq('user_id', currentUserId).maybeSingle()
        userReacted = !!r
    }

    return {
        id: p.id, author_id: p.user_id,
        type: (p.post_type as 'text' | 'image' | 'video') ?? 'text',
        caption: p.content ?? null, hashtags: [],
        created_at: p.created_at, updated_at: p.updated_at,
        author: {
            id: p.author?.id ?? '', username: p.author?.username ?? '',
            display_name: p.author?.display_name ?? '', avatar_url: p.author?.avatar_url ?? null, verified: false,
        },
        medias: (p.medias ?? []).map((m: any, i: number) => ({
            id: m.id, post_id: m.post_id, url: m.media_url,
            media_type: (m.media_type as 'image' | 'video') ?? 'image',
            width: null, height: null, duration_s: null, position: i, created_at: m.created_at ?? p.created_at,
        })),
        reaction_count: rc ?? 0, comment_count: cc ?? 0, user_reacted: userReacted,
    }
}

async function getComments(postId: string)
{
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('post_comments')
        .select(`id, comment, created_at,
            author:users!post_comments_user_id_fkey (username, display_name, avatar_url)`)
        .eq('post_id', postId).order('created_at', { ascending: false }).limit(30)

    if (error || !data) return []
    return (data as any[]).map(c => ({
        id: c.id, body: c.comment ?? '',
        created_at: c.created_at,
        author: { username: c.author?.username ?? '', display_name: c.author?.display_name ?? '', avatar_url: c.author?.avatar_url ?? null },
    }))
}

export default async function PostDetailPage({ params }: PageProps)
{
    const { postId } = await params
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    let currentUserId: string | null = null
    if (authUser)
    {
        const { data: profile } = await supabase.from('users').select('id').eq('auth_id', authUser.id).single()
        currentUserId = profile?.id ?? null
    }

    const [post, initialComments, recentPosts] = await Promise.all([
        getPost(postId, currentUserId),
        getComments(postId),
        fetchRecentPostsPreviews(6),
    ])

    if (!post) notFound()

    const otherRecentPosts = recentPosts.filter(p => p.id !== postId).slice(0, 5)

    return (
        <div className="w-full max-w-6xl mx-auto px-3 py-4 overflow-x-hidden">

            {/* Back nav */}
            <Link href="/app/feed"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to feed
            </Link>

            <div className="flex gap-5 items-start">

                {/* ── Main column ── */}
                <div className="flex-1 min-w-0 max-w-2xl mx-auto xl:mx-0 space-y-4">

                    {/* Post card with elevated styling */}
                    <div className="rounded-2xl overflow-hidden border border-border shadow-md">
                        <PostCard post={post} currentUserId={currentUserId ?? ''} />
                    </div>

                    {/* Comments section */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-4">
                        <PostDetailComments
                            postId={postId}
                            initialComments={initialComments}
                            commentCount={post.comment_count}
                        />
                    </div>
                </div>

                {/* ── Sidebar xl+ ── */}
                <aside className="hidden xl:flex flex-col gap-4 w-72 shrink-0">

                    {/* Post info + share — client component */}
                    <PostDetailActions
                        postId={postId}
                        caption={post.caption ?? ''}
                        reactionCount={post.reaction_count}
                        commentCount={post.comment_count}
                        authorUsername={post.author.username}
                        createdAt={post.created_at}
                    />

                    {/* Recent Posts */}
                    {otherRecentPosts.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                    Recent Posts
                                </h3>
                                <Link href="/app/feed" className="text-xs text-primary font-medium hover:underline">
                                    See all
                                </Link>
                            </div>
                            <div className="space-y-1">
                                {otherRecentPosts.map((rp) => (
                                    <Link key={rp.id} href={`/app/feed/${rp.id}`}
                                        className="block p-2.5 rounded-xl hover:bg-muted transition-colors group">
                                        <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">
                                            {rp.caption
                                                ? (rp.caption.length > 65 ? `${rp.caption.slice(0, 65)}…` : rp.caption)
                                                : '📷 Media post'}
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-muted-foreground font-medium truncate">{rp.author_name}</span>
                                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{timeAgo(rp.created_at)}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sponsored */}
                    <div className="rounded-2xl text-white p-4 shadow-sm relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,#065f46 0%,#0f766e 100%)' }}>
                        <p className="text-[10px] font-medium opacity-70 mb-1">Sponsored</p>
                        <h3 className="font-bold text-sm leading-tight mb-1">Grow with NaijaImpact</h3>
                        <p className="text-xs opacity-80 mb-3">Access funding, tools and a supportive community.</p>
                        <Link href="/app/funding">
                            <span className="inline-block bg-white text-xs font-bold px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                                style={{ color: '#065f46' }}>
                                Learn More
                            </span>
                        </Link>
                        <span className="absolute right-3 bottom-2 text-3xl opacity-20 pointer-events-none">🚀</span>
                    </div>
                </aside>
            </div>

            {/* Mobile: Recent Posts below comments */}
            {otherRecentPosts.length > 0 && (
                <div className="xl:hidden mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            Recent Posts
                        </h3>
                        <Link href="/app/feed" className="text-xs text-primary font-medium hover:underline">See all</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {otherRecentPosts.map((rp) => (
                            <Link key={rp.id} href={`/app/feed/${rp.id}`}
                                className="block p-2.5 rounded-xl hover:bg-muted transition-colors group">
                                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                    {rp.caption
                                        ? (rp.caption.length > 55 ? `${rp.caption.slice(0, 55)}…` : rp.caption)
                                        : '📷 Media post'}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-muted-foreground truncate">{rp.author_name}</span>
                                    <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{timeAgo(rp.created_at)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
