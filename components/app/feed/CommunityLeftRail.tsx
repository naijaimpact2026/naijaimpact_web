'use client'

import Link from 'next/link'
import { Briefcase, Cpu, Sprout, Palette, HeartPulse, Sparkles, Users, Check } from 'lucide-react'

const DISCOVER = [
    { icon: Briefcase, label: 'Entrepreneurs', tag: 'entrepreneur', tint: 'bg-primary/10 text-primary' },
    { icon: Cpu, label: 'Tech & Innovation', tag: 'tech', tint: 'bg-cyan/10 text-cyan' },
    { icon: Sprout, label: 'Agriculture', tag: 'agriculture', tint: 'bg-emerald/10 text-emerald' },
    { icon: Palette, label: 'Creative Hub', tag: 'creative', tint: 'bg-amber-500/10 text-amber-600' },
    { icon: HeartPulse, label: 'Health & Wellness', tag: 'health', tint: 'bg-purple-500/10 text-purple-600' },
    { icon: Sparkles, label: 'Faith & Purpose', tag: 'faith', tint: 'bg-rose-500/10 text-rose-600' },
]

interface CommunityLeftRailProps
{
    activeTopic?: string | null
}

export default function CommunityLeftRail({ activeTopic }: CommunityLeftRailProps)
{
    return (
        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-foreground">Discover Communities</h3>
                    {activeTopic && (
                        <Link href="/app/feed" className="text-[11px] text-primary hover:underline font-medium">
                            Clear
                        </Link>
                    )}
                </div>
                <div className="space-y-1">
                    {DISCOVER.map((c) =>
                    {
                        const isSelected = activeTopic?.toLowerCase() === c.tag.toLowerCase()
                        return (
                            <Link
                                key={c.label}
                                href={isSelected ? '/app/feed' : `/app/feed?topic=${c.tag}`}
                                className={`flex items-center gap-2.5 py-2 px-2.5 rounded-xl transition-all group ${
                                    isSelected
                                        ? 'bg-primary/10 border border-primary/25 font-semibold text-primary'
                                        : 'hover:bg-muted/70 text-foreground'
                                }`}
                            >
                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${c.tint} group-hover:scale-105 transition-transform`}>
                                    <c.icon className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-medium flex-1 truncate">{c.label}</span>
                                {isSelected ? (
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

            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <h3 className="font-bold text-sm text-foreground mb-2">My Groups</h3>
                <div className="flex flex-col items-center text-center py-6 text-muted-foreground">
                    <Users className="w-8 h-8 opacity-30 mb-2" />
                    <p className="text-xs">Community groups aren&apos;t live yet.</p>
                </div>
            </div>
        </aside>
    )
}
