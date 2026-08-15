import { createClient } from '@/lib/supabase/server'
import { fetchPostsPage } from '@/lib/actions/posts'
import FeedInfiniteScroll from '@/components/app/feed/FeedInfiniteScroll'
import FeedRightSidebar from '@/components/app/feed/FeedRightSidebar'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FeedPage()
{
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    let currentUserId = ''
    let userProfile: User | null = null

    if (authUser)
    {
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .single()

        if (profile)
        {
            currentUserId = profile.id
            userProfile = profile as User
        }
    }

    const { posts: initialPosts, nextCursor: initialCursor } = await fetchPostsPage(null, 10)

    return (
        <div className="w-full max-w-6xl mx-auto px-3 py-4 overflow-x-hidden">
            <div className="flex gap-4 items-start">
                {/* Main feed column — full width on mobile, constrained on xl */}
                <div className="w-full min-w-0 xl:flex-1 max-w-2xl mx-auto xl:mx-0">
                    <FeedInfiniteScroll
                        initialPosts={initialPosts}
                        initialCursor={initialCursor}
                        currentUserId={currentUserId}
                        user={userProfile}
                    />
                </div>

                {/* Right sidebar — visible on xl+ */}
                <FeedRightSidebar />
            </div>
        </div>
    )
}
