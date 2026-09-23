'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PostCard from './PostCard'
import PostCardSkeleton from './PostCardSkeleton'
import PostComposerBar from './PostComposerBar'
import StoryRow from './StoryRow'
import FeedTabs, { type FeedTab } from './FeedTabs'
import SuggestedAccounts, { type SuggestedUser } from './SuggestedAccounts'
import PromotedCarousel from './PromotedCarousel'
import { fetchPostsPage, fetchFollowingPosts, fetchSavedPostsPage, fetchSuggestedUsers } from '@/lib/actions/posts'
import { fetchPromotedContent, type PromotedItem } from '@/lib/actions/promoted'
import type { PostWithAuthor, User } from '@/lib/types'
import { Plus } from 'lucide-react'

const SUGGESTIONS_AFTER_POST = 5

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
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<FeedTab>('for-you')
    const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts)
    const [cursor, setCursor] = useState<string | null>(initialCursor)
    const [loading, setLoading] = useState(false)
    const [exhausted, setExhausted] = useState(initialCursor === null)
    const [tabLoading, setTabLoading] = useState(false)
    const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
    const [suggestionsDismissed, setSuggestionsDismissed] = useState(false)
    const [promotedItems, setPromotedItems] = useState<PromotedItem[]>([])

    const sentinelRef = useRef<HTMLDivElement>(null)
    const loadingRef = useRef(false)

    // Fetch suggested accounts on mount
    useEffect(() =>
    {
        if (!currentUserId) return
        fetchSuggestedUsers(6).then(setSuggestedUsers).catch(() => { })
    }, [currentUserId])

    // Fetch promoted Marketplace/Learn content on mount
    useEffect(() =>
    {
        fetchPromotedContent(8).then(setPromotedItems).catch(() => { })
    }, [])

    // Fetch function based on active tab
    const fetchForTab = useCallback(async (tab: FeedTab, cur: string | null) =>
    {
        switch (tab)
        {
            case 'following': return fetchFollowingPosts(cur)
            case 'saved': return fetchSavedPostsPage(cur)
            default: return fetchPostsPage(cur)
        }
    }, [])

    const UNBACKED_TABS: FeedTab[] = ['groups', 'opportunities', 'events']

    // Switch tabs — reset posts and fetch fresh
    async function handleTabChange(tab: FeedTab)
    {
        if (tab === activeTab) return
        setActiveTab(tab)
        setTabLoading(true)
        setPosts([])
        setCursor(null)
        setExhausted(false)

        // Not backed by real data yet — show an honest "coming soon" state
        if (UNBACKED_TABS.includes(tab))
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

    const isLoading = loading || tabLoading

    return (
        <div className="space-y-3">
            {/* Promoted story circles */}
            {promotedItems.length > 0 && (
                <div className="bg-card rounded-2xl border border-border shadow-sm dark:shadow-none px-3 py-3">
                    <StoryRow promotedItems={promotedItems.slice(0, 4)} />
                </div>
            )}

            {/* Promoted carousel — real Marketplace listings and Learn courses */}
            {activeTab === 'for-you' && <PromotedCarousel items={promotedItems} />}

            {/* Feed tabs */}
            <div className="bg-card rounded-2xl border border-border shadow-sm dark:shadow-none overflow-hidden">
                <FeedTabs activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Post composer bar — only on For You tab; opens the dedicated Create Post page */}
            {activeTab === 'for-you' && (
                <PostComposerBar user={user ?? null} onOpen={() => router.push('/app/feed/create')} />
            )}

            {/* Empty state for tabs with no real data source yet */}
            {UNBACKED_TABS.includes(activeTab) && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border shadow-sm dark:shadow-none text-muted-foreground">
                    <p className="text-lg font-semibold">
                        {activeTab === 'groups' && 'Groups coming soon'}
                        {activeTab === 'opportunities' && 'Opportunities coming soon'}
                        {activeTab === 'events' && 'Events coming soon'}
                    </p>
                    <p className="text-sm mt-1 text-center px-4">
                        {activeTab === 'groups' && 'Join community groups to see their posts here.'}
                        {activeTab === 'opportunities' && 'Jobs, grants and partnerships will show up here.'}
                        {activeTab === 'events' && 'Community events will show up here.'}
                    </p>
                </div>
            )}

            {/* Feed posts */}
            {!isLoading && posts.length === 0 && !UNBACKED_TABS.includes(activeTab) ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border shadow-sm dark:shadow-none text-muted-foreground">
                    <p className="text-lg font-semibold">
                        {activeTab === 'following' && 'No posts from people you follow'}
                        {activeTab === 'saved' && 'No saved posts yet'}
                        {activeTab !== 'following' && activeTab !== 'saved' && 'No posts yet'}
                    </p>
                    <p className="text-sm mt-1 text-center px-4">
                        {activeTab === 'following' && 'Follow people to see their posts here.'}
                        {activeTab === 'saved' && 'Tap the Save button on any post to read it later.'}
                        {activeTab !== 'following' && activeTab !== 'saved' && 'Be the first to share something!'}
                    </p>
                </div>
            ) : (
                posts.map((post, index) => (
                    <div key={post.id} className="space-y-3">
                        <PostCard
                            post={post}
                            currentUserId={currentUserId}
                            onReactionToggle={(postId, reacted, delta) => {
                                setPosts((prev) =>
                                    prev.map((p) =>
                                        p.id === postId
                                            ? {
                                                ...p,
                                                user_reacted: reacted,
                                                reaction_count: Math.max(0, (p.reaction_count || 0) + delta),
                                            }
                                            : p
                                    )
                                )
                            }}
                            onSaveToggle={(postId, saved) => {
                                setPosts((prev) =>
                                    prev.map((p) => (p.id === postId ? { ...p, user_saved: saved } : p))
                                )
                                if (activeTab === 'saved' && !saved) {
                                    setPosts((prev) => prev.filter((p) => p.id !== postId))
                                }
                            }}
                            onHide={(postId) => setPosts((prev) => prev.filter((p) => p.id !== postId))}
                        />

                        {activeTab === 'for-you' &&
                            !suggestionsDismissed &&
                            index === SUGGESTIONS_AFTER_POST - 1 &&
                            suggestedUsers.length > 0 && (
                                <SuggestedAccounts
                                    users={suggestedUsers}
                                    onDismiss={() => setSuggestionsDismissed(true)}
                                />
                            )}
                    </div>
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
                onClick={() => router.push('/app/feed/create')}
                aria-label="Create post"
                className="xl:hidden fixed bottom-20 right-4 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-all active:scale-95"
            >
                <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
        </div>
    )
}
