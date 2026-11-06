'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users2, BadgeCheck, X } from 'lucide-react'

export interface SuggestedUser
{
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    verified: boolean
    profession: string | null
}

interface SuggestedAccountsProps
{
    users: SuggestedUser[]
    onDismiss?: () => void
}

function getInitials(name: string): string
{
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

function FollowChip({ user }: { user: SuggestedUser })
{
    const [following, setFollowing] = useState(false)
    const [pending, setPending] = useState(false)
    const [hidden, setHidden] = useState(false)

    async function handleToggle()
    {
        if (pending) return
        setPending(true)
        const next = !following
        setFollowing(next)
        try
        {
            const { followUser, unfollowUser } = await import('@/lib/actions/profile')
            const result = next ? await followUser(user.id) : await unfollowUser(user.id)
            if (!result.success) setFollowing(!next)
        }
        catch
        {
            setFollowing(!next)
        }
        finally
        {
            setPending(false)
        }
    }

    if (hidden) return null

    return (
        <div className="relative flex w-32 shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-elevated/40 p-3 text-center">
            <button
                onClick={() => setHidden(true)}
                aria-label={`Not interested in ${user.display_name}`}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
            >
                <X className="h-3 w-3" />
            </button>

            <Link href={`/app/profile/${user.username}`} className="flex flex-col items-center gap-2">
                <Avatar className="h-14 w-14 border border-border">
                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.display_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {getInitials(user.display_name)}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    <div className="flex items-center justify-center gap-1">
                        <p className="truncate text-xs font-semibold text-foreground max-w-[6.5rem]">
                            {user.display_name}
                        </p>
                        {user.verified && <BadgeCheck className="h-3 w-3 text-primary shrink-0" />}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground max-w-[6.5rem]">
                        @{user.username}
                    </p>
                </div>
            </Link>

            <Button
                size="sm"
                variant={following ? 'outline' : 'default'}
                onClick={handleToggle}
                disabled={pending}
                className="h-7 w-full rounded-full px-2 text-xs"
            >
                {following ? 'Following' : 'Follow'}
            </Button>
        </div>
    )
}

export default function SuggestedAccounts({ users, onDismiss }: SuggestedAccountsProps)
{
    if (users.length === 0) return null

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm dark:shadow-none p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <Users2 className="h-4 w-4 text-primary" />
                    Suggested for you
                </h3>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Dismiss
                    </button>
                )}
            </div>

            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
                {users.map((user) => (
                    <FollowChip key={user.id} user={user} />
                ))}
            </div>
        </div>
    )
}
