import { createClient } from '@/lib/supabase/server'
import { fetchUserPostsPage } from '@/lib/actions/posts'
import ProfileHeader from '@/components/app/profile/ProfileHeader'
import ProfileTabs, { type MediaItem } from '@/components/app/profile/ProfileTabs'
import type { PostMedia } from '@/lib/types'
import { UserX } from 'lucide-react'

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
            .eq('author_id', profile.id),
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

    // ── All media for Media tab ───────────────────────────────────────────────
    // Fetch all post IDs for this user, then get their medias
    const { data: postRows } = await supabase
        .from('posts')
        .select('id')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })

    const postIds = (postRows ?? []).map((p) => p.id)

    let allMedia: MediaItem[] = []
    if (postIds.length > 0)
    {
        const { data: mediaRows } = await supabase
            .from('post_medias')
            .select('*')
            .in('post_id', postIds)
            .order('created_at', { ascending: false })

        allMedia = (mediaRows ?? []).map((m: PostMedia) => ({
            media: m,
            postId: m.post_id,
        }))
    }

    return (
        <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
            {/* 6.3: Profile header with avatar, stats, follow button */}
            <ProfileHeader
                profile={profile}
                currentUserId={currentUserId}
                followerCount={followerCount ?? 0}
                followingCount={followingCount ?? 0}
                postCount={postCount ?? 0}
                isFollowing={isFollowing}
                isOwnProfile={isOwnProfile}
            />

            {/* 6.4–6.6: Posts and Media tabs */}
            <ProfileTabs
                authorId={profile.id}
                currentUserId={currentUserId}
                initialPosts={initialPosts}
                initialCursor={initialCursor}
                allMedia={allMedia}
            />
        </main>
    )
}
