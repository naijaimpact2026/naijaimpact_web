'use client'

import { useRouter } from 'next/navigation'
import { COMMUNITY_TOPICS, type CommunityTopic } from './community-data'
import { Button } from '@/components/ui/button'
import { ArrowRight, PenSquare, Sparkles, Users } from 'lucide-react'

interface CommunityGroupsViewProps {
    onSelectGroupFeed: (tag: string) => void
    onPostToGroup: (tag: string) => void
}

export default function CommunityGroupsView({
    onSelectGroupFeed,
    onPostToGroup,
}: CommunityGroupsViewProps) {
    const router = useRouter()

    return (
        <div className="space-y-4">
            {/* Header info card */}
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Users className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Community Hubs & Groups</h2>
                        <p className="text-xs text-muted-foreground">
                            Browse focused spaces or share updates directly with people in your field.
                        </p>
                    </div>
                </div>
            </div>

            {/* Responsive Groups Grid: 1 col on mobile, 2 cols on tablet/desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {COMMUNITY_TOPICS.map((group: CommunityTopic) => {
                    const Icon = group.icon

                    return (
                        <div
                            key={group.id}
                            className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all group"
                        >
                            <div className="space-y-2.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 border ${group.tint} group-hover:scale-105 transition-transform`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                                                <span>{group.label}</span>
                                                <span className="text-xs">{group.emoji}</span>
                                            </h3>
                                            <span className="text-[11px] font-semibold text-primary">
                                                #{group.tag}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0">
                                        {group.badge}
                                    </span>
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {group.description}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/70">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSelectGroupFeed(group.tag)}
                                    className="flex-1 text-xs font-semibold gap-1 rounded-xl h-8 sm:h-9"
                                >
                                    <span>Explore Feed</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => onPostToGroup(group.tag)}
                                    className="text-xs font-semibold gap-1 rounded-xl h-8 sm:h-9 px-3"
                                >
                                    <PenSquare className="w-3.5 h-3.5" />
                                    <span>Post</span>
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
