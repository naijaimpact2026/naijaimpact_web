'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { COMMUNITY_TOPICS } from './community-data'
import { Loader2, Sparkles, X } from 'lucide-react'

interface CommunityMobileTopicsProps {
    activeTopic?: string | null
}

export default function CommunityMobileTopics({ activeTopic }: CommunityMobileTopicsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [loadingTag, setLoadingTag] = useState<string | null>(null)

    useEffect(() => {
        setLoadingTag(null)
    }, [activeTopic])

    function handleNavigate(e: React.MouseEvent, href: string, tag: string | null) {
        e.preventDefault()
        setLoadingTag(tag ?? 'clear')
        startTransition(() => {
            router.push(href)
        })
    }

    const isAllActive = !activeTopic

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Communities
                </span>
                {activeTopic && (
                    <button
                        type="button"
                        onClick={(e) => handleNavigate(e, '/app/feed', null)}
                        disabled={isPending}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 disabled:opacity-60"
                    >
                        {isPending && loadingTag === 'clear' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <X className="w-3 h-3" />
                        )}
                        Clear filter
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1.5 -mx-1 px-1 touch-pan-x">
                {/* "All" Filter Pill */}
                <Link
                    href="/app/feed"
                    onClick={(e) => handleNavigate(e, '/app/feed', null)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                        isAllActive
                            ? 'bg-primary text-primary-foreground shadow-primary/20'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                    }`}
                >
                    {isPending && loadingTag === 'clear' && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    <span>All</span>
                </Link>

                {/* 6 Community Topic Pills */}
                {COMMUNITY_TOPICS.map((topic) => {
                    const isSelected = activeTopic?.toLowerCase() === topic.tag.toLowerCase()
                    const isLoading = isPending && loadingTag === topic.tag
                    const targetHref = isSelected ? '/app/feed' : `/app/feed?topic=${topic.tag}`
                    const Icon = topic.icon

                    return (
                        <Link
                            key={topic.id}
                            href={targetHref}
                            onClick={(e) => handleNavigate(e, targetHref, isSelected ? 'clear' : topic.tag)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${
                                isSelected
                                    ? 'bg-primary text-primary-foreground font-semibold shadow-primary/25 ring-2 ring-primary/20'
                                    : 'bg-card border border-border text-foreground hover:bg-muted hover:border-primary/30'
                            }`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <span className="text-xs">{topic.emoji}</span>
                            )}
                            <span className="whitespace-nowrap">{topic.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
