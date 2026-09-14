import { createClient } from '@/lib/supabase/server'
import { fetchUserPostsPage } from '@/lib/actions/posts'
import ProfileHeader from '@/components/app/profile/ProfileHeader'
import ProfileTabs from '@/components/app/profile/ProfileTabs'
import ProfileAboutCard from '@/components/app/profile/ProfileAboutCard'
import ProfileImpactStats from '@/components/app/profile/ProfileImpactStats'
import ProfileBadges from '@/components/app/profile/ProfileBadges'
import ProfileFeaturedLink from '@/components/app/profile/ProfileFeaturedLink'
import ProfileQuote from '@/components/app/profile/ProfileQuote'
import { UserX } from 'lucide-react'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface ProfilePageProps
{
    params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps)
{
    const { username } = await params
    const supabase = await createClient()

    // ── Current auth user ────────────────────────────────────────────────────
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    // Get current user's platform profile id
    let currentUserId = ''
    if (authUser)
    {
        const { data: currentProfile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authUser.id)
            .single()
        currentUserId = currentProfile?.id ?? ''
    }

    // ── Fetch target user profile ─────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .single()

    // 6.2: Not found → render friendly 404 message
    if (profileError || !profile)
    {
        return (
            <main className="max-w-xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                    <UserX className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">User not found</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        No account exists with the username{' '}
                        <span className="font-medium text-foreground">@{username}</span>.
                    </p>
                </div>
            </main>
        )
    }

    // ── Counts ────────────────────────────────────────────────────────────────
    const [
        { count: followerCount },
        { count: followingCount },
        { count: postCount },
    ] = await Promise.all([
        supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id),
        supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', profile.id),
        supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id),
    ])

    // ── Is following? ─────────────────────────────────────────────────────────
    let isFollowing = false
    if (currentUserId && currentUserId !== profile.id)
    {
        const { data: followRow } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', currentUserId)
            .eq('following_id', profile.id)
            .maybeSingle()
        isFollowing = !!followRow
    }

    const isOwnProfile = currentUserId === profile.id

    // ── Initial posts for Posts tab ───────────────────────────────────────────
    const { posts: initialPosts, nextCursor: initialCursor } = await fetchUserPostsPage(
        profile.id,
        null,
        12
    )

    return (
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            {/* Profile header with cover, avatar, stats, follow button */}
            <ProfileHeader
                profile={profile as User}
                currentUserId={currentUserId}
                followerCount={followerCount ?? 0}
                followingCount={followingCount ?? 0}
                postCount={postCount ?? 0}
                isFollowing={isFollowing}
                isOwnProfile={isOwnProfile}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_280px] gap-5 items-start">
                {/* Left rail — persistent About Me / Skills (desktop only; reachable via the About tab on mobile) */}
                <div className="hidden lg:flex flex-col gap-4">
                    <ProfileAboutCard profile={profile as User} />
                </div>

                {/* Center — tabs + content */}
                <div className="min-w-0 rounded-2xl border border-border bg-card overflow-hidden">
                    <ProfileTabs
                        profile={profile as User}
                        authorId={profile.id}
                        currentUserId={currentUserId}
                        initialPosts={initialPosts}
                        initialCursor={initialCursor}
                    />
                </div>

                {/* Right rail — impact, badges, featured link, quote */}
                <div className="flex flex-col gap-4">
                    <ProfileImpactStats profile={profile as User} isOwnProfile={isOwnProfile} />
                    <ProfileBadges userId={profile.id} />
                    <ProfileFeaturedLink profile={profile as User} />
                    <ProfileQuote profile={profile as User} />
                </div>
            </div>
        </main>
    )
}
