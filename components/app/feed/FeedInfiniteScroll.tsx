'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import PostCard from './PostCard'
import PostCardSkeleton from './PostCardSkeleton'
import PostComposer from './PostComposer'
import PostComposerBar from './PostComposerBar'
import StoryRow from './StoryRow'
import FeedTabs, { type FeedTab } from './FeedTabs'
import { fetchPostsPage, fetchDiscoverPosts, fetchFollowingPosts, fetchRecentActiveUsers } from '@/lib/actions/posts'
import type { PostWithAuthor, User } from '@/lib/types'
import { Plus } from 'lucide-react'

interface StoryUser
{
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

interface FeedInfiniteScrollProps
{
    initialPosts: PostWithAuthor[]
    initialCursor: string | null
    currentUserId: string
    user?: User | null
}

const SKELETON_COUNT = 3

export default function FeedInfiniteScroll({
    initialPosts,
    initialCursor,
    currentUserId,
    user,
}: FeedInfiniteScrollProps)
{
    const [activeTab, setActiveTab] = useState<FeedTab>('for-you')
    const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts)
    const [cursor, setCursor] = useState<string | null>(initialCursor)
    const [loading, setLoading] = useState(false)
    const [exhausted, setExhausted] = useState(initialCursor === null)
    const [isComposerOpen, setIsComposerOpen] = useState(false)
    const [storyUsers, setStoryUsers] = useState<StoryUser[]>([])
    const [tabLoading, setTabLoading] = useState(false)

    const sentinelRef = useRef<HTMLDivElement>(null)
    const loadingRef = useRef(false)

    // Fetch story users on mount
    useEffect(() =>
    {
        if (!currentUserId) return
        fetchRecentActiveUsers(currentUserId, 4).then(setStoryUsers).catch(() => { })
    }, [currentUserId])

    // Fetch function based on active tab
    const fetchForTab = useCallback(async (tab: FeedTab, cur: string | null) =>
    {
        switch (tab)
        {
            case 'discover': return fetchDiscoverPosts(cur)
            case 'following': return fetchFollowingPosts(cur)
            default: return fetchPostsPage(cur)
        }
    }, [])

    // Switch tabs — reset posts and fetch fresh
    async function handleTabChange(tab: FeedTab)
    {
        if (tab === activeTab) return
        setActiveTab(tab)
        setTabLoading(true)
        setPosts([])
        setCursor(null)
        setExhausted(false)

        // Unsupported tabs show empty state
        if (tab === 'groups' || tab === 'saved')
        {
            setTabLoading(false)
            setExhausted(true)
            return
        }

        try
        {
            const { posts: newPosts, nextCursor } = await fetchForTab(tab, null)
            setPosts(newPosts)
            setCursor(nextCursor)
            if (nextCursor === null) setExhausted(true)
        } catch
        {
            // silently fail
        } finally
        {
            setTabLoading(false)
        }
    }

    const loadMore = useCallback(async () =>
    {
        if (loadingRef.current || exhausted) return
        loadingRef.current = true
        setLoading(true)
        try
        {
            const { posts: newPosts, nextCursor } = await fetchForTab(activeTab, cursor)
            setPosts((prev) =>
            {
                const existingIds = new Set(prev.map((p) => p.id))
                return [...prev, ...newPosts.filter((p) => !existingIds.has(p.id))]
            })
            setCursor(nextCursor)
            if (nextCursor === null) setExhausted(true)
        } catch (err)
        {
            console.error('Failed to load more posts:', err)
        } finally
        {
            loadingRef.current = false
            setLoading(false)
        }
    }, [cursor, exhausted, activeTab, fetchForTab])

    useEffect(() =>
    {
        const sentinel = sentinelRef.current
        if (!sentinel) return
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) loadMore() },
            { rootMargin: '0px 0px 200px 0px', threshold: 0 }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [loadMore])

    function handlePostCreated(post: PostWithAuthor)
    {
        if (activeTab === 'for-you')
        {
            setPosts((prev) =>
            {
                if (prev.some((p) => p.id === post.id)) return prev
                return [post, ...prev]
            })
        }
        setIsComposerOpen(false)
    }

    const isLoading = loading || tabLoading

    return (
        <div className="space-y-3">
            {/* Story row */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm px-3 py-3">
                <StoryRow user={user ?? null} recentUsers={storyUsers} />
            </div>

            {/* Feed tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden">
                <FeedTabs activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Post composer bar — only on For You tab */}
            {activeTab === 'for-you' && (
                <PostComposerBar user={user ?? null} onOpen={() => setIsComposerOpen(true)} />
            )}

            {/* Post composer modal */}
            {isComposerOpen && (
                <PostComposer
                    currentUserId={currentUserId}
                    onSuccess={handlePostCreated}
                    onClose={() => setIsComposerOpen(false)}
                />
            )}

            {/* Empty state for unimplemented tabs */}
            {(activeTab === 'groups' || activeTab === 'saved') && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm text-muted-foreground">
                    <p className="text-lg font-semibold">
                        {activeTab === 'groups' ? 'Groups coming soon' : 'No saved posts yet'}
                    </p>
                    <p className="text-sm mt-1 text-center px-4">
                        {activeTab === 'groups'
                            ? 'Join community groups to see their posts here.'
                            : 'Save posts to read them later.'}
                    </p>
                </div>
            )}

            {/* Feed posts */}
            {!isLoading && posts.length === 0 && activeTab !== 'groups' && activeTab !== 'saved' ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm text-muted-foreground">
                    <p className="text-lg font-semibold">
                        {activeTab === 'following' ? 'No posts from people you follow' : 'No posts yet'}
                    </p>
                    <p className="text-sm mt-1 text-center px-4">
                        {activeTab === 'following'
                            ? 'Follow people to see their posts here.'
                            : activeTab === 'discover'
                                ? 'New content will appear here soon.'
                                : 'Be the first to share something!'}
                    </p>
                </div>
            ) : (
                posts.map((post) => (
                    <PostCard key={post.id} post={post} currentUserId={currentUserId} />
                ))
            )}

            {/* Loading skeletons */}
            {isLoading && (
                <div className="space-y-3">
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <PostCardSkeleton key={`skeleton-${i}`} />
                    ))}
                </div>
            )}

            {!exhausted && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}

            {exhausted && posts.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                    You&apos;ve seen all recent posts.
                </p>
            )}

            {/* FAB — mobile only */}
            <button
                onClick={() => setIsComposerOpen(true)}
                aria-label="Create post"
                className="xl:hidden fixed bottom-20 right-4 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-all active:scale-95"
            >
                <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
        </div>
    )
}
