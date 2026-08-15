'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, UserCheck, UserPlus } from 'lucide-react'
import { followUser, unfollowUser } from '@/lib/actions/profile'
import FollowersModal from './FollowersModal'
import type { User } from '@/lib/types'

interface ProfileHeaderProps
{
    profile: User
    currentUserId: string
    followerCount: number
    followingCount: number
    postCount: number
    isFollowing: boolean
    isOwnProfile: boolean
}

export default function ProfileHeader({
    profile,
    currentUserId,
    followerCount: initialFollowerCount,
    followingCount,
    postCount,
    isFollowing: initialIsFollowing,
    isOwnProfile,
}: ProfileHeaderProps)
{
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [followerCount, setFollowerCount] = useState(initialFollowerCount)
    const [pending, setPending] = useState(false)

    const initials = profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    async function handleFollowToggle()
    {
        if (pending) return
        setPending(true)

        const newFollowing = !isFollowing
        // Optimistic update
        setIsFollowing(newFollowing)
        setFollowerCount((c) => c + (newFollowing ? 1 : -1))

        try
        {
            const result = newFollowing
                ? await followUser(profile.id)
                : await unfollowUser(profile.id)

            if (!result.success)
            {
                // Revert
                setIsFollowing(!newFollowing)
                setFollowerCount((c) => c + (newFollowing ? -1 : 1))
            }
        } catch
        {
            setIsFollowing(!newFollowing)
            setFollowerCount((c) => c + (newFollowing ? -1 : 1))
        } finally
        {
            setPending(false)
        }
    }

    return (
        <div className="bento-card noise-bg p-5 space-y-4">
            {/* Avatar + action row */}
            <div className="flex items-start justify-between gap-4">
                <Avatar className="h-20 w-20 shrink-0 ring-2 ring-primary/20">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                    {isOwnProfile ? (
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/app/settings">Edit Profile</Link>
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant={isFollowing ? 'outline' : 'default'}
                            onClick={handleFollowToggle}
                            disabled={pending}
                            className="gap-1.5"
                            aria-label={isFollowing ? `Unfollow ${profile.username}` : `Follow ${profile.username}`}
                        >
                            {isFollowing ? (
                                <>
                                    <UserCheck className="h-4 w-4" />
                                    Following
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Follow
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Name + username + verified */}
            <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-xl font-bold leading-tight">{profile.display_name}</h1>
                    {profile.verified && (
                        <CheckCircle2
                            className="h-5 w-5 text-primary shrink-0"
                            aria-label="Verified account"
                        />
                    )}
                </div>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                {profile.profession && (
                    <p className="text-sm text-muted-foreground font-medium">{profile.profession}</p>
                )}
            </div>

            {/* Bio */}
            {profile.bio && (
                <p className="text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-6 pt-1">
                <div className="text-center">
                    <p className="text-lg font-bold leading-none">{postCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Posts</p>
                </div>

                <FollowersModal
                    userId={profile.id}
                    type="followers"
                    count={followerCount}
                    label="Followers"
                />

                <FollowersModal
                    userId={profile.id}
                    type="following"
                    count={followingCount}
                    label="Following"
                />
            </div>
        </div>
    )
}
