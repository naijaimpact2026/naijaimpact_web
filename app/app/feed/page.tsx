import { getCurrentUser } from '@/lib/supabase/auth'
import { fetchPostsPage } from '@/lib/actions/posts'
import FeedInfiniteScroll from '@/components/app/feed/FeedInfiniteScroll'
import CommunityLeftRail from '@/components/app/feed/CommunityLeftRail'
import CommunityMobileTopics from '@/components/app/feed/CommunityMobileTopics'
import CommunityRightSidebar from '@/components/app/feed/CommunityRightSidebar'
import CommunityGuidanceCarousel from '@/components/app/feed/CommunityGuidanceCarousel'

export const dynamic = 'force-dynamic'

interface FeedPageProps
{
    searchParams?: Promise<{ topic?: string }>
}

export default async function FeedPage({ searchParams }: FeedPageProps)
{
    const resolvedParams = searchParams ? await searchParams : undefined
    const activeTopic = resolvedParams?.topic?.trim() || null

    const { profile } = await getCurrentUser()
    const currentUserId = profile?.id ?? ''
    const userProfile = profile

    const { posts: initialPosts, nextCursor: initialCursor } = await fetchPostsPage(null, 10, activeTopic)

    return (
        <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
            {/* Top Showcase Guidance Carousel (Promoted to top header) */}
            <CommunityGuidanceCarousel />

            {/* Mobile / Tablet Discover Communities Bar */}
            <div className="lg:hidden">
                <CommunityMobileTopics activeTopic={activeTopic} />
            </div>

            {/* Three-column layout */}
            <div className="flex gap-6 items-start">
                <CommunityLeftRail activeTopic={activeTopic} />

                <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
                    <FeedInfiniteScroll
                        initialPosts={initialPosts}
                        initialCursor={initialCursor}
                        currentUserId={currentUserId}
                        user={userProfile}
                        topic={activeTopic}
                    />
                </div>

                <CommunityRightSidebar />
            </div>
        </div>
    )
}
