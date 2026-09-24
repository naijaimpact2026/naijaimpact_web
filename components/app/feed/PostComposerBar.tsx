'use client'

import { Image as ImageIcon, BarChart2, Calendar, HandCoins, UserPlus, type LucideIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/lib/types'

export interface PostComposerOpenOptions {
    withMedia?: boolean
    withTagging?: boolean
}

interface PostComposerBarProps
{
    user: User | null
    onOpen: (options?: PostComposerOpenOptions) => void
}

function getInitials(name: string | null | undefined): string
{
    if (!name) return 'U'
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

interface ComposerAction {
    icon: LucideIcon
    label: string
    color: string
    functional: boolean
    mode?: 'media' | 'tag'
}

const ACTIONS: ComposerAction[] = [
    { icon: ImageIcon, label: 'Photo/Video', color: 'text-primary', functional: true, mode: 'media' },
    { icon: BarChart2, label: 'Poll', color: 'text-amber-600', functional: false },
    { icon: Calendar, label: 'Event', color: 'text-secondary', functional: false },
    { icon: HandCoins, label: 'Opportunity', color: 'text-cyan', functional: false },
    { icon: UserPlus, label: 'Tag People', color: 'text-rose-500', functional: true, mode: 'tag' },
]

export default function PostComposerBar({ user, onOpen }: PostComposerBarProps)
{
    function handleActionClick(action: ComposerAction)
    {
        if (!action.functional) return
        if (action.mode === 'media')
        {
            onOpen({ withMedia: true })
        }
        else if (action.mode === 'tag')
        {
            onOpen({ withTagging: true })
        }
        else
        {
            onOpen()
        }
    }

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm dark:shadow-none overflow-hidden">
            {/* Top: avatar + prompt */}
            <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => onOpen()}
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
                <div className="flex-1 bg-muted/60 hover:bg-muted rounded-full px-4 py-2 text-sm text-muted-foreground cursor-pointer transition-colors">
                    What&apos;s on your mind?
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border mx-3" />

            {/* Action buttons */}
            <div className="flex items-center justify-around px-1 py-1">
                {ACTIONS.map((action) => {
                    const Icon = action.icon
                    const isFunctional = action.functional

                    return (
                        <button
                            key={action.label}
                            type="button"
                            onClick={() => handleActionClick(action)}
                            disabled={!isFunctional}
                            title={isFunctional ? action.label : `${action.label} (coming soon)`}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl transition-all text-xs font-medium min-w-0 ${
                                isFunctional
                                    ? 'hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95'
                                    : 'text-muted-foreground/40 cursor-default'
                            }`}
                            aria-label={isFunctional ? action.label : `${action.label} (coming soon)`}
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${isFunctional ? action.color : ''}`} />
                            <span className="hidden sm:inline truncate">{action.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
