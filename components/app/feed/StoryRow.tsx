'use client'

import Image from 'next/image'
import { Plus, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/lib/types'

interface StoryUser
{
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

interface StoryRowProps
{
    user: User | null
    recentUsers?: StoryUser[]
}

const CATEGORY_CIRCLES = [
    { label: 'Philanthropists', emoji: '💚', gradient: 'from-green-400 to-emerald-600', live: true },
    { label: 'Entrepreneurs', emoji: '💼', gradient: 'from-purple-400 to-violet-600', live: false },
    { label: 'Donors Hub', emoji: '🤝', gradient: 'from-red-400 to-rose-600', live: false },
    { label: 'Impact Stories', emoji: '⭐', gradient: 'from-amber-400 to-orange-500', live: false },
]

function getInitials(name: string | null | undefined): string
{
    if (!name) return 'U'
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function StoryRow({ user, recentUsers = [] }: StoryRowProps)
{
    return (
        <div className="flex items-start gap-3 overflow-x-auto scrollbar-none pb-1">

            {/* My Story — current user's real avatar */}
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
                <div className="relative">
                    <Avatar className="h-14 w-14 border-[2.5px] border-white dark:border-slate-800 shadow group-hover:scale-105 transition-transform">
                        <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.display_name ?? 'Me'} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                            {getInitials(user?.display_name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary border-[2px] border-white dark:border-slate-900 shadow">
                        <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                    </span>
                </div>
                <span className="text-[10px] font-medium text-foreground text-center w-14 truncate leading-tight">
                    My Story
                </span>
            </div>

            {/* Recent active users from DB (real avatars) */}
            {recentUsers.map((u) => (
                <div key={u.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
                    <div className="relative">
                        {/* Green gradient ring */}
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 group-hover:scale-105 transition-transform shadow">
                            <Avatar className="h-full w-full border-[2px] border-white dark:border-slate-900">
                                <AvatarImage src={u.avatar_url ?? undefined} alt={u.display_name} />
                                <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-foreground text-xs font-bold">
                                    {getInitials(u.display_name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    <span className="text-[10px] font-medium text-foreground text-center w-14 truncate leading-tight">
                        {u.display_name.split(' ')[0]}
                    </span>
                </div>
            ))}

            {/* Category circles */}
            {CATEGORY_CIRCLES.map((circle) => (
                <div key={circle.label} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
                    <div className="relative">
                        <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${circle.gradient} p-0.5 group-hover:scale-105 transition-transform shadow`}>
                            <div className="h-full w-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-xl">
                                {circle.emoji}
                            </div>
                        </div>
                        {circle.live && (
                            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex items-center justify-center px-1.5 h-3.5 rounded-full bg-red-500 border border-white dark:border-slate-900">
                                <span className="text-white text-[7px] font-bold tracking-wider">LIVE</span>
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium text-foreground text-center w-14 truncate leading-tight">
                        {circle.label}
                    </span>
                </div>
            ))}

            {/* More */}
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
                <div className="h-14 w-14 rounded-full bg-muted border-2 border-border flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center w-14">More</span>
            </div>
        </div>
    )
}
