'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { BadgeCheck, UserCheck, UserPlus, Calendar, Pencil, MapPin, Link2, Share2, Camera } from 'lucide-react'
import { followUser, unfollowUser } from '@/lib/actions/profile'
import FollowersModal from './FollowersModal'
import ProfileCoverIllustration from '@/components/illustrations/ProfileCoverIllustration'
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
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Cover banner */}
            <div className="relative h-32 sm:h-40">
                <ProfileCoverIllustration className="absolute inset-0 h-full w-full" />
                {isOwnProfile && (
                    <Link
                        href="/app/settings"
                        className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 hover:bg-black/55 transition-colors"
                        aria-label="Edit cover photo"
                    >
                        <Camera className="h-3.5 w-3.5" />
                        Edit Cover
                    </Link>
                )}
            </div>

            <div className="px-5 pb-5">
                {/* Avatar overlapping the banner */}
                <div className="relative w-fit -mt-10 sm:-mt-12">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 ring-4 ring-card">
                        <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name} />
                        <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {isOwnProfile && (
                        <Link
                            href="/app/settings"
                            className="absolute bottom-0.5 right-0.5 flex items-center justify-center w-7 h-7 rounded-full bg-card border border-border text-foreground hover:bg-muted transition-colors shadow-sm"
                            aria-label="Edit profile photo"
                        >
                            <Camera className="h-3.5 w-3.5" />
                        </Link>
                    )}
                </div>

                {/* Bio block (left) + actions/stats (right) */}
                <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0">
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
                            <p className="text-sm text-foreground/80 font-medium mt-0.5">{profile.profession}</p>
                        )}

                        {profile.bio && (
                            <p className="mt-3 text-sm leading-relaxed text-foreground whitespace-pre-line">{profile.bio}</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            {profile.location && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {profile.location}
                                </span>
                            )}
                            {profile.website_url && (
                                <a
                                    href={profile.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-primary hover:underline"
                                >
                                    <Link2 className="h-3.5 w-3.5" />
                                    {profile.website_url.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Joined {formatJoinDate(profile.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Actions + stats — right-aligned, matches the reference layout */}
                    <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                            {isOwnProfile ? (
                                <>
                                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                                        <Link href="/app/settings">
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit Profile
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="icon-sm" aria-label="Share profile">
                                        <Share2 className="h-3.5 w-3.5" />
                                    </Button>
                                </>
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

                        <div className="flex items-center gap-5">
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
                            <div className="text-center">
                                <p className="text-lg font-bold leading-none text-foreground">{postCount}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Posts</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
