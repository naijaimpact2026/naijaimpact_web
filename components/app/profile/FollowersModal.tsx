'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import
    {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { fetchFollowList } from '@/lib/actions/profile'

interface FollowUser
{
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

interface FollowersModalProps
{
    userId: string
    type: 'followers' | 'following'
    count: number
    label: string
}

export default function FollowersModal({
    userId,
    type,
    count,
    label,
}: FollowersModalProps)
{
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<FollowUser[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [exhausted, setExhausted] = useState(false)
    const [initialLoaded, setInitialLoaded] = useState(false)

    const load = useCallback(
        async (reset = false) =>
        {
            if (loading) return
            setLoading(true)

            const currentCursor = reset ? null : cursor

            try
            {
                const result = await fetchFollowList(userId, type, currentCursor)
                if (reset)
                {
                    setUsers(result.users)
                } else
                {
                    setUsers((prev) => [...prev, ...result.users])
                }
                setCursor(result.nextCursor)
                if (result.nextCursor === null) setExhausted(true)
                else setExhausted(false)
            } catch (err)
            {
                console.error('FollowersModal fetch error:', err)
            } finally
            {
                setLoading(false)
            }
        },
        [userId, type, cursor, loading]
    )

    function handleOpen(isOpen: boolean)
    {
        setOpen(isOpen)
        if (isOpen && !initialLoaded)
        {
            setInitialLoaded(true)
            load(true)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <button
                    className="text-center hover:opacity-70 transition-opacity"
                    aria-label={`${count} ${label}`}
                >
                    <p className="text-lg font-bold leading-none">{count}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </button>
            </DialogTrigger>

            <DialogContent className="max-w-sm p-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-3 border-b">
                    <DialogTitle>{label}</DialogTitle>
                    <DialogDescription className="sr-only">List of {label.toLowerCase()}</DialogDescription>
                </DialogHeader>

                <div
                    className="overflow-y-auto max-h-[60vh]"
                    role="list"
                    aria-label={`${label} list`}
                >
                    {users.length === 0 && !loading ? (
                        <p className="text-sm text-muted-foreground text-center py-10 px-4">
                            No {label.toLowerCase()} yet.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {users.map((u) =>
                            {
                                const initials = u.display_name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)

                                return (
                                    <li key={u.id} role="listitem">
                                        <Link
                                            href={`/app/profile/${u.username}`}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                                        >
                                            <Avatar className="h-9 w-9 shrink-0">
                                                <AvatarImage src={u.avatar_url ?? undefined} alt={u.display_name} />
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate">{u.display_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                                            </div>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!exhausted && !loading && users.length > 0 && (
                        <div className="px-4 pb-4 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => load(false)}
                            >
                                Load more
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
