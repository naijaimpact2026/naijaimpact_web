'use client'

import { Compass, Sparkles } from 'lucide-react'
import type { QuizInsights } from '@/lib/world/types'
import { AnimatedBar } from '../fx'

/** Ranked self-assessment result (the Skill Compass). */
export default function SkillCompass({ insights, color }: { insights: QuizInsights; color: string })
{
    const top = insights.ranking[0]
    return (
        <div className="space-y-4">
            <div className="hw-pop flex items-start gap-3 rounded-2xl p-4 text-white shadow-md" style={{ background: `linear-gradient(135deg, ${color} 0%, #102A43 100%)` }}>
                <span className="hw-float flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20"><Compass className="h-6 w-6" /></span>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">{insights.title} · your top area</p>
                    <p className="text-xl font-extrabold leading-tight">{top.label}</p>
                    <p className="mt-1 text-sm text-white/85">{top.description}</p>
                </div>
            </div>
            <p className="text-sm text-muted-foreground">{insights.intro}</p>
            <ol className="space-y-3">
                {insights.ranking.map((r, n) => (
                    <li key={r.id} className={`hw-rise rounded-2xl border p-3 ${n < 3 ? 'border-border bg-card' : 'border-transparent bg-muted/40'}`} style={{ animationDelay: `${n * 70}ms` }}>
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold text-white" style={{ backgroundColor: n < 3 ? color : '#94A3B8' }}>{n + 1}</span>
                                {r.label}
                            </span>
                            <span className="text-sm font-extrabold tabular-nums text-foreground">{r.share}%</span>
                        </div>
                        <AnimatedBar pct={r.share} color={n < 3 ? color : '#94A3B8'} className="mt-2 h-2" />
                        {n < 3 && r.careers.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {r.careers.map((c) => <span key={c} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">{c}</span>)}
                            </div>
                        )}
                    </li>
                ))}
            </ol>
            <p className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" /> Next: pick 3 careers from your top areas and explore them in Tuesday’s “Career booths” mission.
            </p>
        </div>
    )
}
