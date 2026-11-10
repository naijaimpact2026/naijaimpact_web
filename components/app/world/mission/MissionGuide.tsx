'use client'

import { Lightbulb, Sparkles } from 'lucide-react'
import { askNovo } from '@/lib/novo-ask'
import type { MissionView } from '@/lib/world/types'

/** What this mission type expects, in one line. */
const KIND_HINT: Record<MissionView['kind'], string> = {
    quiz: 'Answer each question. You’ll see your result straight away.',
    sort: 'Sort each item into the right group. Marked straight away.',
    scenario: 'Read each situation and choose what you’d do. Marked straight away.',
    board: 'Fill each box with specific, honest notes. The AI reviews it and gives instant feedback.',
    canvas: 'Fill each block of the canvas in a sentence or two. The AI gives instant feedback.',
    evidence: 'A real-world task: do it in real life, then share what you found. Keep people anonymous.',
    video: 'Record a short video on your phone and upload it, with a few written notes.',
    reflection: 'Reflect honestly on what you learned and what you’ll do next.',
    team: 'Do this with your squad or a few friends, then share what happened.',
    live_event: 'Join the live session (or the recording), then note what you learned.',
    boss: 'This week’s boss challenge: bring the week’s work together. Judges score it.',
}

/** "How to do this" steps + Ask Novo, shown above the activity. */
export default function MissionGuide({ mission, color }: { mission: MissionView; color: string })
{
    function ask()
    {
        const tips = mission.tips.length ? `\nTips given: ${mission.tips.join(' ')}` : ''
        askNovo(
            `I'm doing a Hubnovo Campus Competition mission: "${mission.title}".\nBrief: ${mission.story ?? ''}${tips}\n` +
            `Coach me: explain what a good answer looks like and help me get started with questions or an outline. Don't write it for me.`,
        )
    }

    return (
        <section className="hw-rise rounded-3xl border border-border bg-card p-4 sm:p-5" style={{ animationDelay: '80ms' }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1f`, color }}><Lightbulb className="h-4 w-4" /></span>
                    <h2 className="text-sm font-bold text-foreground">How to do this</h2>
                </div>
                <button
                    type="button"
                    onClick={ask}
                    className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
                >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Ask Novo for help
                </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{KIND_HINT[mission.kind]}</p>
            {mission.tips.length > 0 && (
                <ol className="mt-3 space-y-2">
                    {mission.tips.map((t, n) => (
                        <li key={n} className="hw-rise flex gap-3 text-sm text-foreground" style={{ animationDelay: `${120 + n * 70}ms` }}>
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: color }}>{n + 1}</span>
                            <span className="pt-0.5 leading-relaxed">{t}</span>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    )
}
