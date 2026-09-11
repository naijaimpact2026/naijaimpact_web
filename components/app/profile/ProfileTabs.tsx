'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { fetchUserPostsPage } from '@/lib/actions/posts'
import type { PostWithAuthor } from '@/lib/types'
import { Grid3X3, Bookmark, Heart, MessageCircle, Copy, Play, FileText } from 'lucide-react'

// ─── Post grid tile ────────────────────────────────────────────────────────────

function PostTile({ post }: { post: PostWithAuthor })
{
    const cover = post.medias?.[0] ?? null
    const hasMultiple = (post.medias?.length ?? 0) > 1

    return (
        <Link
            href={`/app/feed/${post.id}`}
            className="group relative aspect-square overflow-hidden bg-muted"
        >
            {cover ? (
                cover.media_type === 'video' ? (
                    <video
                        src={cover.url}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        aria-hidden="true"
                    />
                ) : (
                    <Image
                        src={cover.url}
                        alt={post.caption ?? 'Post'}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, 300px"
                    />
                )
            ) : (
                <div className="flex h-full w-full items-center justify-center p-3 bg-gradient-to-br from-muted to-card">
                    <p className="line-clamp-4 text-center text-xs leading-relaxed text-foreground/80">
                        {post.caption || <FileText className="mx-auto h-6 w-6 text-muted-foreground" />}
                    </p>
                </div>
            )}

            {/* Media-type indicator */}
            {cover?.media_type === 'video' && (
                <Play className="absolute right-1.5 top-1.5 h-4 w-4 text-white drop-shadow" fill="white" />
            )}
            {hasMultiple && (
                <Copy className="absolute right-1.5 top-1.5 h-4 w-4 text-white drop-shadow" />
            )}

            {/* Hover overlay — engagement counts (desktop) */}
            <div className="absolute inset-0 hidden items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <Heart className="h-4 w-4 fill-white" />
                    {post.reaction_count}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <MessageCircle className="h-4 w-4 fill-white" />
                    {post.comment_count}
                </span>
            </div>
        </Link>
    )
}

// ─── Profile Posts (infinite scroll grid) ─────────────────────────────────────

const SKELETON_COUNT = 9

interface ProfilePostsProps
{
    authorId: string
    initialPosts: PostWithAuthor[]
    initialCursor: string | null
}

function ProfilePosts({
    authorId,
    initialPosts,
    initialCursor,
}: ProfilePostsProps)
{
    const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts)
    const [cursor, setCursor] = useState<string | null>(initialCursor)
    const [loading, setLoading] = useState(false)
    const [exhausted, setExhausted] = useState(initialCursor === null)

    const sentinelRef = useRef<HTMLDivElement>(null)
    const loadingRef = useRef(false)

    const loadMore = useCallback(async () =>
    {
        if (loadingRef.current || exhausted) return
        loadingRef.current = true
        setLoading(true)

        try
        {
            const { posts: newPosts, nextCursor } = await fetchUserPostsPage(authorId, cursor)
            setPosts((prev) =>
            {
                const existingIds = new Set(prev.map((p) => p.id))
                const unique = newPosts.filter((p) => !existingIds.has(p.id))
                return [...prev, ...unique]
            })
            setCursor(nextCursor)
            if (nextCursor === null) setExhausted(true)
        } catch (err)
        {
            console.error('ProfilePosts loadMore error:', err)
        } finally
        {
            loadingRef.current = false
            setLoading(false)
        }
    }, [authorId, cursor, exhausted])

    useEffect(() =>
    {
        const sentinel = sentinelRef.current
        if (!sentinel) return

        const observer = new IntersectionObserver(
            (entries) =>
            {
                if (entries[0].isIntersecting) loadMore()
            },
            { rootMargin: '0px 0px 200px 0px', threshold: 0 }
        )

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [loadMore])

    if (posts.length === 0 && !loading)
    {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Grid3X3 className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No posts yet</p>
            </div>
        )
    }

    return (
        <div>
            <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                {posts.map((post) => (
                    <PostTile key={post.id} post={post} />
                ))}

                {loading && Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="aspect-square animate-pulse bg-muted" />
                ))}
            </div>

            {!exhausted && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}

            {exhausted && posts.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                    All posts loaded.
                </p>
            )}
        </div>
    )
}

// ─── Main ProfileTabs component ───────────────────────────────────────────────
// Instagram-style icon-only tab bar: Posts (grid) and Saved (bookmark).

type ProfileTab = 'posts' | 'saved'

interface ProfileTabsProps
{
    authorId: string
    currentUserId: string
    initialPosts: PostWithAuthor[]
    initialCursor: string | null
}

export default function ProfileTabs({
    authorId,
    initialPosts,
    initialCursor,
}: ProfileTabsProps)
{
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts')

    return (
        <div className="w-full">
            <div role="tablist" aria-label="Profile content" className="flex items-center border-t border-border">
                <button
                    role="tab"
                    aria-selected={activeTab === 'posts'}
                    aria-label="Posts"
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 flex items-center justify-center py-3 border-t-2 -mt-px transition-colors ${activeTab === 'posts'
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Grid3X3 className="h-5 w-5" strokeWidth={activeTab === 'posts' ? 2.25 : 1.75} />
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'saved'}
                    aria-label="Saved"
                    onClick={() => setActiveTab('saved')}
                    className={`flex-1 flex items-center justify-center py-3 border-t-2 -mt-px transition-colors ${activeTab === 'saved'
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Bookmark className="h-5 w-5" strokeWidth={activeTab === 'saved' ? 2.25 : 1.75} />
                </button>
            </div>

            <div role="tabpanel" className="mt-0.5 sm:mt-1">
                {activeTab === 'posts' ? (
                    <ProfilePosts
                        authorId={authorId}
                        initialPosts={initialPosts}
                        initialCursor={initialCursor}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Bookmark className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No saved posts yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}
