import { createClient } from '@/lib/supabase/server'
import { fetchPostsPage } from '@/lib/actions/posts'
import FeedInfiniteScroll from '@/components/app/feed/FeedInfiniteScroll'
import CommunityLeftRail from '@/components/app/feed/CommunityLeftRail'
import CommunityRightSidebar from '@/components/app/feed/CommunityRightSidebar'
import CommunityIllustration from '@/components/illustrations/CommunityIllustration'
import { Lightbulb, Compass, MessageSquare, Network, Rocket } from 'lucide-react'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

const HERO_ACTIONS = [
    { icon: Lightbulb, label: 'Share Ideas' },
    { icon: Compass, label: 'Find Opportunities' },
    { icon: MessageSquare, label: 'Join Discussions' },
    { icon: Network, label: 'Build Networks' },
    { icon: Rocket, label: 'Create Impact' },
]

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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
            {/* Hero */}
            <section
                className="relative overflow-hidden rounded-3xl border border-border px-6 py-7 sm:px-9 sm:py-8"
                style={{ background: 'linear-gradient(120deg, #EAF3FE 0%, #F8FAFC 55%, #E6F7FB 100%)' }}
            >
                <div className="relative z-10 flex items-center justify-between gap-8">
                    <div className="max-w-md">
                        <p className="text-xs font-bold tracking-wide text-emerald uppercase mb-1.5">Community</p>
                        <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight text-secondary">
                            People. Ideas. Opportunities. A Brighter Tomorrow.
                        </h1>
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                            Connect, share, learn and grow with a global community on Hubnovo.
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 shrink-0">
                        <CommunityIllustration className="w-52 h-40" />
                        <ul className="space-y-2.5">
                            {HERO_ACTIONS.map((a) => (
                                <li key={a.label} className="flex items-center gap-2 text-xs font-semibold text-secondary">
                                    <a.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                                    {a.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Three-column layout */}
            <div className="flex gap-6 items-start">
                <CommunityLeftRail />

                <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
                    <FeedInfiniteScroll
                        initialPosts={initialPosts}
                        initialCursor={initialCursor}
                        currentUserId={currentUserId}
                        user={userProfile}
                    />
                </div>

                <CommunityRightSidebar />
            </div>
        </div>
    )
}
