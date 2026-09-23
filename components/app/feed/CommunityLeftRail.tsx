'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { COMMUNITY_TOPICS } from './community-data'
import { Check, Loader2, ArrowRight } from 'lucide-react'

interface CommunityLeftRailProps
{
    activeTopic?: string | null
}

export default function CommunityLeftRail({ activeTopic }: CommunityLeftRailProps)
{
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [loadingTag, setLoadingTag] = useState<string | null>(null)

    useEffect(() =>
    {
        setLoadingTag(null)
    }, [activeTopic])

    function handleNavigate(e: React.MouseEvent, href: string, tag: string | null)
    {
        e.preventDefault()
        setLoadingTag(tag ?? 'clear')
        startTransition(() =>
        {
            router.push(href)
        })
    }

    return (
        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-foreground">Discover Communities</h3>
                    {activeTopic && (
                        <button
                            type="button"
                            onClick={(e) => handleNavigate(e, '/app/feed', null)}
                            disabled={isPending}
                            className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-60"
                        >
                            {isPending && loadingTag === 'clear' && (
                                <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                            )}
                            Clear
                        </button>
                    )}
                </div>
                <div className="space-y-1">
                    {COMMUNITY_TOPICS.map((c) =>
                    {
                        const isSelected = activeTopic?.toLowerCase() === c.tag.toLowerCase()
                        const isLoading = isPending && loadingTag === c.tag
                        const targetHref = isSelected ? '/app/feed' : `/app/feed?topic=${c.tag}`
                        const Icon = c.icon

                        return (
                            <Link
                                key={c.label}
                                href={targetHref}
                                onClick={(e) => handleNavigate(e, targetHref, isSelected ? 'clear' : c.tag)}
                                className={`flex items-center gap-2.5 py-2 px-2.5 rounded-xl transition-all group ${
                                    isSelected
                                        ? 'bg-primary/10 border border-primary/25 font-semibold text-primary'
                                        : isLoading
                                        ? 'bg-primary/5 border border-primary/20 text-primary'
                                        : 'hover:bg-muted/70 text-foreground'
                                }`}
                            >
                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${c.tint} group-hover:scale-105 transition-transform`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-medium flex-1 truncate">{c.label}</span>
                                {isLoading ? (
                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        Loading…
                                    </span>
                                ) : isSelected ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full shrink-0">
                                        <Check className="w-3 h-3" /> Active
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        Filter
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">Featured Hubs</h3>
                    <Link
                        href="/app/feed"
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                    >
                        Explore <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                </div>
                <div className="space-y-2">
                    {COMMUNITY_TOPICS.slice(0, 3).map((hub) => (
                        <Link
                            key={hub.id}
                            href={`/app/feed?topic=${hub.tag}`}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/70 transition-colors group"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm">{hub.emoji}</span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                        {hub.label}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        #{hub.tag}
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                View
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    )
}
