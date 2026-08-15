'use client'

import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Users, X, Search } from 'lucide-react'
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { createGroupChat } from '@/lib/actions/chat'

// ─── Schema ─────────────────────────────────────────────────────────────────

const schema = z.object({
    name: z.string().min(1, 'Group name is required').max(60),
})
type FormData = z.infer<typeof schema>

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserResult
{
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateGroupChatModal()
{
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [memberQuery, setMemberQuery] = useState('')
    const [memberResults, setMemberResults] = useState<UserResult[]>([])
    const [selectedMembers, setSelectedMembers] = useState<UserResult[]>([])
    const [searching, setSearching] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) })

    // Debounced member search
    const searchUsers = useCallback(async (query: string) =>
    {
        if (query.length < 2)
        {
            setMemberResults([])
            return
        }
        setSearching(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('users')
            .select('id, username, display_name, avatar_url')
            .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
            .limit(8)
        setMemberResults((data ?? []) as UserResult[])
        setSearching(false)
    }, [])

    const handleMemberQueryChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const q = e.target.value
        setMemberQuery(q)
        searchUsers(q)
    }

    const addMember = (user: UserResult) =>
    {
        if (!selectedMembers.find((m) => m.id === user.id))
        {
            setSelectedMembers((prev) => [...prev, user])
        }
        setMemberQuery('')
        setMemberResults([])
    }

    const removeMember = (userId: string) =>
    {
        setSelectedMembers((prev) => prev.filter((m) => m.id !== userId))
    }

    const onSubmit = async (data: FormData) =>
    {
        if (selectedMembers.length < 2)
        {
            setError('Please add at least 2 members')
            return
        }
        setError(null)
        setSubmitting(true)
        try
        {
            const { channelId } = await createGroupChat(
                data.name,
                selectedMembers.map((m) => m.id),
            )
            setOpen(false)
            reset()
            setSelectedMembers([])
            router.push(`/app/chat/${channelId}`)
        } catch (err: unknown)
        {
            const message = err instanceof Error ? err.message : 'Failed to create group'
            setError(message)
        } finally
        {
            setSubmitting(false)
        }
    }

    const handleOpenChange = (val: boolean) =>
    {
        setOpen(val)
        if (!val)
        {
            reset()
            setSelectedMembers([])
            setMemberQuery('')
            setMemberResults([])
            setError(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Users className="w-4 h-4" />
                    New Group
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Group Chat</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Group name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                            id="group-name"
                            placeholder="e.g. NaijaImpact Team"
                            {...register('name')}
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Member search */}
                    <div className="space-y-1.5">
                        <Label>Add Members (minimum 2)</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search by username or name…"
                                value={memberQuery}
                                onChange={handleMemberQueryChange}
                                className="pl-9"
                            />
                        </div>

                        {/* Search results dropdown */}
                        {memberResults.length > 0 && (
                            <div className="border rounded-lg overflow-hidden bg-popover shadow-md max-h-48 overflow-y-auto">
                                {memberResults.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => addMember(user)}
                                        className="flex items-center gap-3 w-full px-3 py-2 hover:bg-muted transition-colors text-left"
                                    >
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarImage src={user.avatar_url ?? undefined} />
                                            <AvatarFallback className="text-xs">
                                                {user.display_name[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{user.display_name}</p>
                                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {searching && (
                            <p className="text-xs text-muted-foreground">Searching…</p>
                        )}
                    </div>

                    {/* Selected members chips */}
                    {selectedMembers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                                >
                                    <span>{member.display_name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeMember(member.id)}
                                        className="hover:opacity-70 transition-opacity"
                                        aria-label={`Remove ${member.display_name}`}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <p className="text-xs text-destructive">{error}</p>}

                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? 'Creating…' : 'Create Group'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
