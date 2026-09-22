'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { fetchUserPostsPage, fetchSavedPostsPage } from '@/lib/actions/posts'
import PostCard from '@/components/app/feed/PostCard'
import type { PostWithAuthor, User } from '@/lib/types'
import
{
    Grid3X3,
    Bookmark,
    Image as ImageIcon,
    Video,
    Users,
    Trophy,
} from 'lucide-react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

// ─── Post feed list (infinite scroll — full post cards, matches the main feed) ──
// Shared by the Posts tab (fetchUserPostsPage) and the Saved tab (fetchSavedPostsPage).

const SKELETON_COUNT = 3

interface PostFeedListProps
{
    currentUserId: string
    /** Server-fetched first page. Omit (along with initialCursor) to have this component fetch its own first page on mount — used for tabs with no server-side data loader, like Saved. */
    initialPosts?: PostWithAuthor[]
    initialCursor?: string | null
    fetchPage: (cursor: string | null) => Promise<{ posts: PostWithAuthor[]; nextCursor: string | null }>
    emptyIcon: typeof Grid3X3
    emptyTitle: string
    emptyDescription?: string
    exhaustedLabel: string
}

function PostFeedList({
    currentUserId,
    initialPosts,
    initialCursor,
    fetchPage,
    emptyIcon: EmptyIcon,
    emptyTitle,
    emptyDescription,
    exhaustedLabel,
}: PostFeedListProps)
{
    const bootstrap = initialPosts === undefined

    const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts ?? [])
    const [cursor, setCursor] = useState<string | null>(initialCursor ?? null)
    const [loading, setLoading] = useState(bootstrap)
    const [exhausted, setExhausted] = useState(!bootstrap && initialCursor === null)

    const sentinelRef = useRef<HTMLDivElement>(null)
    const loadingRef = useRef(false)

    const loadMore = useCallback(async () =>
    {
        if (loadingRef.current || exhausted) return
        loadingRef.current = true
        setLoading(true)

        try
        {
            const { posts: newPosts, nextCursor } = await fetchPage(cursor)
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
            console.error('PostFeedList loadMore error:', err)
        } finally
        {
            loadingRef.current = false
            setLoading(false)
        }
    }, [fetchPage, cursor, exhausted])

    // No server-provided first page (e.g. Saved tab) — fetch it ourselves once, on mount.
    useEffect(() =>
    {
        if (bootstrap) loadMore()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
            <Empty className="py-16">
                <EmptyHeader>
                    <EmptyMedia variant="icon"><EmptyIcon /></EmptyMedia>
                    <EmptyTitle>{emptyTitle}</EmptyTitle>
                    {emptyDescription && <EmptyDescription>{emptyDescription}</EmptyDescription>}
                </EmptyHeader>
            </Empty>
        )
    }

    return (
        <div className="p-4 space-y-4 bg-muted/30">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}

            {loading && Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div key={`skeleton-${i}`} className="h-64 rounded-2xl animate-pulse bg-muted" />
            ))}

            {!exhausted && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}

            {exhausted && posts.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                    {exhaustedLabel}
                </p>
            )}
        </div>
    )
}

// ─── Photos / Videos — filtered from already-loaded posts (no fabricated data) ──

function MediaGrid({ posts, type }: { posts: PostWithAuthor[]; type: 'image' | 'video' })
{
    const tiles = posts.flatMap((post) =>
        (post.medias ?? [])
            .filter((m) => m.media_type === type)
            .map((m) => ({ media: m, post }))
    )

    if (tiles.length === 0)
    {
        return (
            <Empty className="py-16">
                <EmptyHeader>
                    <EmptyMedia variant="icon">{type === 'image' ? <ImageIcon /> : <Video />}</EmptyMedia>
                    <EmptyTitle>No {type === 'image' ? 'photos' : 'videos'} yet</EmptyTitle>
                    <EmptyDescription>{type === 'image' ? 'Photos from posts' : 'Videos from posts'} will show up here.</EmptyDescription>
                </EmptyHeader>
            </Empty>
        )
    }

    return (
        <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
            {tiles.map(({ media, post }) => (
                <Link
                    key={media.id}
                    href={`/app/feed/${post.id}`}
                    className="relative aspect-square overflow-hidden bg-muted"
                >
                    {type === 'video' ? (
                        <video src={media.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                    ) : (
                        <Image src={media.url} alt={post.caption ?? 'Post media'} fill unoptimized className="object-cover" sizes="(max-width: 640px) 33vw, 300px" />
                    )}
                </Link>
            ))}
        </div>
    )
}

// ─── Simple "coming soon" style empty panel for tabs with no backing data yet ──

function ComingSoonPanel({ icon: Icon, title, description }: { icon: typeof Users; title: string; description: string })
{
    return (
        <Empty className="py-16">
            <EmptyHeader>
                <EmptyMedia variant="icon"><Icon /></EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}

// ─── About panel ────────────────────────────────────────────────────────────────

function AboutPanel({ profile }: { profile: User })
{
    return (
        <div className="px-4 py-5 space-y-4">
            <div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">About Me</h3>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {profile.bio || 'No bio added yet.'}
                </p>
            </div>
            {profile.skills.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-foreground mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((skill) => (
                            <span key={skill} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Main ProfileTabs component ───────────────────────────────────────────────

const ALL_TABS = [
    { key: 'posts', label: 'Posts' },
    { key: 'about', label: 'About' },
    { key: 'photos', label: 'Photos' },
    { key: 'videos', label: 'Videos' },
    { key: 'saved', label: 'Saved' },
    { key: 'groups', label: 'Groups' },
    { key: 'achievements', label: 'Achievements' },
] as const

type ProfileTab = typeof ALL_TABS[number]['key']

interface ProfileTabsProps
{
    profile: User
    authorId: string
    currentUserId: string
    initialPosts: PostWithAuthor[]
    initialCursor: string | null
    isOwnProfile: boolean
}

export default function ProfileTabs({
    profile,
    authorId,
    currentUserId,
    initialPosts,
    initialCursor,
    isOwnProfile,
}: ProfileTabsProps)
{
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts')

    // Saved posts are a private bookmark list — only the profile owner sees that tab.
    const TABS = isOwnProfile ? ALL_TABS : ALL_TABS.filter((tab) => tab.key !== 'saved')

    return (
        <div className="w-full">
            <div role="tablist" aria-label="Profile content" className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-none px-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        role="tab"
                        aria-selected={activeTab === tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`shrink-0 px-3 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${activeTab === tab.key
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div role="tabpanel" className="mt-0.5 sm:mt-1">
                {activeTab === 'posts' && (
                    <PostFeedList
                        currentUserId={currentUserId}
                        initialPosts={initialPosts}
                        initialCursor={initialCursor}
                        fetchPage={(cursor) => fetchUserPostsPage(authorId, cursor)}
                        emptyIcon={Grid3X3}
                        emptyTitle="No posts yet"
                        exhaustedLabel="All posts loaded."
                    />
                )}
                {activeTab === 'about' && <AboutPanel profile={profile} />}
                {activeTab === 'photos' && <MediaGrid posts={initialPosts} type="image" />}
                {activeTab === 'videos' && <MediaGrid posts={initialPosts} type="video" />}
                {activeTab === 'saved' && isOwnProfile && (
                    <PostFeedList
                        currentUserId={currentUserId}
                        fetchPage={fetchSavedPostsPage}
                        emptyIcon={Bookmark}
                        emptyTitle="No saved posts yet"
                        emptyDescription="Posts you save will show up here."
                        exhaustedLabel="All saved posts loaded."
                    />
                )}
                {activeTab === 'groups' && (
                    <ComingSoonPanel icon={Users} title="Groups coming soon" description="Community groups aren't live yet." />
                )}
                {activeTab === 'achievements' && (
                    <ComingSoonPanel icon={Trophy} title="Achievements coming soon" description="Milestones and achievements aren't tracked yet." />
                )}
            </div>
        </div>
    )
}
