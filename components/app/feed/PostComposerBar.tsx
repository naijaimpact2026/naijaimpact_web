'use client'

import { Image as ImageIcon, Video, Radio, BarChart2, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/lib/types'

interface PostComposerBarProps
{
    user: User | null
    onOpen: () => void
}

function getInitials(name: string | null | undefined): string
{
    if (!name) return 'U'
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

const ACTIONS = [
    { icon: ImageIcon, label: 'Photo', color: 'text-green-600' },
    { icon: Video, label: 'Video', color: 'text-purple-600' },
    { icon: Radio, label: 'Live', color: 'text-red-500' },
    { icon: BarChart2, label: 'Poll', color: 'text-amber-600' },
    { icon: Calendar, label: 'Event', color: 'text-blue-600' },
]

export default function PostComposerBar({ user, onOpen }: PostComposerBarProps)
{
    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm dark:shadow-none overflow-hidden">
            {/* Top: avatar + prompt */}
            <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={onOpen}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onOpen()}
                aria-label="Create a new post"
            >
                <Avatar className="h-9 w-9 shrink-0 border border-border">
                    <AvatarImage src={user?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(user?.display_name)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/60 hover:bg-muted rounded-full px-4 py-2 text-sm text-muted-foreground cursor-pointer">
                    What&apos;s on your mind?
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border mx-3" />

            {/* Action buttons */}
            <div className="flex items-center justify-around px-1 py-1">
                {ACTIONS.map(({ icon: Icon, label, color }) => (
                    <button
                        key={label}
                        onClick={onOpen}
                        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl hover:bg-muted transition-colors text-xs font-medium text-muted-foreground hover:text-foreground min-w-0"
                        aria-label={label}
                    >
                        <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                        <span className="hidden sm:inline truncate">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
