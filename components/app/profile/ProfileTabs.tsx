'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import PostCard from '@/components/app/feed/PostCard'
import PostCardSkeleton from '@/components/app/feed/PostCardSkeleton'
import { fetchUserPostsPage } from '@/lib/actions/posts'
import type { PostWithAuthor, PostMedia } from '@/lib/types'
import { Grid3X3, LayoutList, X, ChevronLeft, ChevronRight, Play } from 'lucide-react'

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps
{
    medias: PostMedia[]
    initialIndex: number
    onClose: () => void
}

function Lightbox({ medias, initialIndex, onClose }: LightboxProps)
{
    const [index, setIndex] = useState(initialIndex)
    const current = medias[index]

    // Close on Escape
    useEffect(() =>
    {
        function onKey(e: KeyboardEvent)
        {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
            if (e.key === 'ArrowRight') setIndex((i) => Math.min(medias.length - 1, i + 1))
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [medias.length, onClose])

    // Prevent background scroll
    useEffect(() =>
    {
        document.body.style.overflow = 'hidden'
        return () =>
        {
            document.body.style.overflow = ''
        }
    }, [])

    if (!current) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            role="dialog"
            aria-modal="true"
            aria-label="Media lightbox"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors"
                onClick={onClose}
                aria-label="Close lightbox"
            >
                <X className="h-6 w-6" />
            </button>

            {/* Prev */}
            {index > 0 && (
                <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setIndex((i) => i - 1) }}
                    aria-label="Previous media"
                >
                    <ChevronLeft className="h-7 w-7" />
                </button>
            )}

            {/* Next */}
            {index < medias.length - 1 && (
                <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setIndex((i) => i + 1) }}
                    aria-label="Next media"
                >
                    <ChevronRight className="h-7 w-7" />
                </button>
            )}

            {/* Media */}
            <div
                className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {current.media_type === 'video' ? (
                    <video
                        src={current.url}
                        controls
                        autoPlay
                        className="max-w-full max-h-[90vh] rounded-lg"
                        aria-label="Video"
                    />
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                            src={current.url}
                            alt={`Media ${index + 1}`}
                            width={current.width ?? 1200}
                            height={current.height ?? 800}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            priority
                        />
                    </div>
                )}
            </div>

            {/* Dot indicators */}
            {medias.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {medias.map((_, i) => (
                        <button
                            key={i}
                            className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'
                                }`}
                            onClick={(e) => { e.stopPropagation(); setIndex(i) }}
                            aria-label={`Go to media ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Media Grid ───────────────────────────────────────────────────────────────

interface MediaItem
{
    media: PostMedia
    postId: string
}

interface MediaGridProps
{
    allMedia: MediaItem[]
}

function MediaGrid({ allMedia }: MediaGridProps)
{
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState(0)

    const flatMedias = allMedia.map((m) => m.media)

    function openLightbox(index: number)
    {
        setLightboxIndex(index)
        setLightboxOpen(true)
    }

    if (allMedia.length === 0)
    {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Grid3X3 className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No media yet</p>
            </div>
        )
    }

    return (
        <>
            <div
                className="grid grid-cols-3 gap-0.5"
                role="list"
                aria-label="Media gallery"
            >
                {allMedia.map(({ media }, i) => (
                    <button
                        key={media.id}
                        role="listitem"
                        className="relative aspect-square overflow-hidden bg-muted hover:opacity-80 active:opacity-60 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        onClick={() => openLightbox(i)}
                        aria-label={`Open media ${i + 1}`}
                    >
                        {media.media_type === 'video' ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                                <video
                                    src={media.url}
                                    className="h-full w-full object-cover opacity-70"
                                    muted
                                    preload="metadata"
                                    aria-hidden="true"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Play className="h-8 w-8 text-white drop-shadow" fill="white" />
                                </div>
                            </div>
                        ) : (
                            <Image
                                src={media.url}
                                alt={`Media ${i + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 33vw, 200px"
                            />
                        )}
                    </button>
                ))}
            </div>

            {lightboxOpen && (
                <Lightbox
                    medias={flatMedias}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </>
    )
}

// ─── Profile Posts (infinite scroll) ─────────────────────────────────────────

const SKELETON_COUNT = 3

interface ProfilePostsProps
{
    authorId: string
    currentUserId: string
    initialPosts: PostWithAuthor[]
    initialCursor: string | null
}

function ProfilePosts({
    authorId,
    currentUserId,
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
                <LayoutList className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No posts yet</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}

            {loading && (
                <div className="space-y-4">
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <PostCardSkeleton key={`skeleton-${i}`} />
                    ))}
                </div>
            )}

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

interface ProfileTabsProps
{
    authorId: string
    currentUserId: string
    initialPosts: PostWithAuthor[]
    initialCursor: string | null
    allMedia: MediaItem[]
}

export default function ProfileTabs({
    authorId,
    currentUserId,
    initialPosts,
    initialCursor,
    allMedia,
}: ProfileTabsProps)
{
    return (
        <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="posts" className="gap-1.5">
                    <LayoutList className="h-4 w-4" />
                    Posts
                </TabsTrigger>
                <TabsTrigger value="media" className="gap-1.5">
                    <Grid3X3 className="h-4 w-4" />
                    Media
                </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-0">
                <ProfilePosts
                    authorId={authorId}
                    currentUserId={currentUserId}
                    initialPosts={initialPosts}
                    initialCursor={initialCursor}
                />
            </TabsContent>

            <TabsContent value="media" className="mt-0">
                <MediaGrid allMedia={allMedia} />
            </TabsContent>
        </Tabs>
    )
}

export type { MediaItem }
