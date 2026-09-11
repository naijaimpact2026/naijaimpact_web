'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { BadgeCheck, UserCheck, UserPlus, Calendar, Pencil } from 'lucide-react'
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

function formatJoinDate(dateStr: string): string
{
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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
        <div className="noise-bg rounded-2xl border border-border bg-card overflow-hidden">
            {/* Banner */}
            <div
                className="h-24 sm:h-28"
                style={{ background: 'linear-gradient(135deg, #1a5c38 0%, #14532d 45%, #0a2d1c 100%)' }}
            />

            <div className="px-5 pb-5">
                {/* Avatar overlapping the banner + action row */}
                <div className="flex items-end justify-between gap-4 -mt-10 sm:-mt-12">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 ring-4 ring-card">
                        <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name} />
                        <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex items-center gap-2 pb-1">
                        {isOwnProfile ? (
                            <Button variant="outline" size="sm" className="gap-1.5" asChild>
                                <Link href="/app/settings">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit Profile
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant={isFollowing ? 'outline' : 'default'}
                                onClick={handleFollowToggle}
                                disabled={pending}
                                className="gap-1.5 rounded-full px-4"
                                aria-label={isFollowing ? `Unfollow ${profile.username}` : `Follow ${profile.username}`}
                            >
                                {isFollowing ? (
                                    <>
                                        <UserCheck className="h-3.5 w-3.5" />
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-3.5 w-3.5" />
                                        Follow
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Name + username + verified */}
                <div className="mt-3 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <h1 className="text-xl font-bold leading-tight text-foreground">{profile.display_name}</h1>
                        {profile.verified && (
                            <BadgeCheck
                                className="h-5 w-5 text-primary shrink-0 fill-primary/15"
                                aria-label="Verified account"
                            />
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    {profile.profession && (
                        <p className="text-sm text-foreground/80 font-medium">{profile.profession}</p>
                    )}
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="mt-3 text-sm leading-relaxed text-foreground whitespace-pre-line">{profile.bio}</p>
                )}

                {/* Joined date */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatJoinDate(profile.created_at)}
                </div>

                {/* Stats row */}
                <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                    <div className="flex-1 rounded-xl py-2 text-center">
                        <p className="text-base font-bold leading-none text-foreground">{postCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">Posts</p>
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="flex-1 flex justify-center">
                        <FollowersModal
                            userId={profile.id}
                            type="followers"
                            count={followerCount}
                            label="Followers"
                        />
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="flex-1 flex justify-center">
                        <FollowersModal
                            userId={profile.id}
                            type="following"
                            count={followingCount}
                            label="Following"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
