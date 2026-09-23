'use client'

import { Image as ImageIcon, BarChart2, Calendar, HandCoins, MapPin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/lib/types'

interface PostComposerBarProps
{
    user: User | null
    onOpen: (withMedia?: boolean) => void
}

function getInitials(name: string | null | undefined): string
{
    if (!name) return 'U'
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

// Photo/Video is the only action actually implemented today — the composer
// modal supports image/video upload. Poll/Event/Opportunity/Tag People are
// shown (matching the design) but marked inert rather than silently opening
// the same plain composer as if they worked.
const ACTIONS = [
    { icon: ImageIcon, label: 'Photo/Video', color: 'text-primary', functional: true },
    { icon: BarChart2, label: 'Poll', color: 'text-amber-600', functional: false },
    { icon: Calendar, label: 'Event', color: 'text-secondary', functional: false },
    { icon: HandCoins, label: 'Opportunity', color: 'text-cyan', functional: false },
    { icon: MapPin, label: 'Tag People', color: 'text-rose-500', functional: false },
]

export default function PostComposerBar({ user, onOpen }: PostComposerBarProps)
{
    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm dark:shadow-none overflow-hidden">
            {/* Top: avatar + prompt */}
            <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => onOpen(false)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onOpen(false)}
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
                {ACTIONS.map(({ icon: Icon, label, color, functional }) => (
                    <button
                        key={label}
                        onClick={functional ? () => onOpen(label === 'Photo/Video') : undefined}
                        disabled={!functional}
                        title={functional ? undefined : 'Coming soon'}
                        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl transition-colors text-xs font-medium min-w-0 ${functional
                            ? 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            : 'text-muted-foreground/40 cursor-default'
                            }`}
                        aria-label={functional ? label : `${label} (coming soon)`}
                    >
                        <Icon className={`w-4 h-4 shrink-0 ${functional ? color : ''}`} />
                        <span className="hidden sm:inline truncate">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
