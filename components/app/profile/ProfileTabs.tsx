'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { fetchUserPostsPage } from '@/lib/actions/posts'
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

// ─── Profile Posts (infinite scroll feed — full post cards, matches the main feed) ──

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
            <Empty className="py-16">
                <EmptyHeader>
                    <EmptyMedia variant="icon"><Grid3X3 /></EmptyMedia>
                    <EmptyTitle>No posts yet</EmptyTitle>
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
                    All posts loaded.
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

const TABS = [
    { key: 'posts', label: 'Posts' },
    { key: 'about', label: 'About' },
    { key: 'photos', label: 'Photos' },
    { key: 'videos', label: 'Videos' },
    { key: 'saved', label: 'Saved' },
    { key: 'groups', label: 'Groups' },
    { key: 'achievements', label: 'Achievements' },
] as const

type ProfileTab = typeof TABS[number]['key']

interface ProfileTabsProps
{
    profile: User
    authorId: string
    currentUserId: string
    initialPosts: PostWithAuthor[]
    initialCursor: string | null
}

export default function ProfileTabs({
    profile,
    authorId,
    currentUserId,
    initialPosts,
    initialCursor,
}: ProfileTabsProps)
{
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts')

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
                    <ProfilePosts
                        authorId={authorId}
                        currentUserId={currentUserId}
                        initialPosts={initialPosts}
                        initialCursor={initialCursor}
                    />
                )}
                {activeTab === 'about' && <AboutPanel profile={profile} />}
                {activeTab === 'photos' && <MediaGrid posts={initialPosts} type="image" />}
                {activeTab === 'videos' && <MediaGrid posts={initialPosts} type="video" />}
                {activeTab === 'saved' && (
                    <ComingSoonPanel icon={Bookmark} title="No saved posts yet" description="Posts you save will show up here." />
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
