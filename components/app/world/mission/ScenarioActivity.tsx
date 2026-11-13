'use client'

import { useState } from 'react'
import { Loader2, RotateCcw, Send } from 'lucide-react'
import type { AttemptPayload, ScenarioConfig } from '@/lib/world/types'

/** Branching story: follow each choice's `next` until the scenario ends. */
export default function ScenarioActivity({ config, color, submitting, onSubmit }: { config: ScenarioConfig; color: string; submitting: boolean; onSubmit: (p: AttemptPayload) => void })
{
    const [path, setPath] = useState<{ node: string; choice: string }[]>([])
    const [current, setCurrent] = useState<string | null>(config.start)
    const node = config.nodes.find((n) => n.id === current) ?? null
    const finished = current === null

    function choose(choiceId: string, next?: string)
    {
        setPath((p) => [...p, { node: current!, choice: choiceId }])
        setCurrent(next ?? null)
    }

    return (
        <div className="space-y-4">
            {config.intro && <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-foreground">{config.intro}</p>}

            {path.length > 0 && (
                <ol className="space-y-2">
                    {path.map((step, n) =>
                    {
                        const nd = config.nodes.find((x) => x.id === step.node)
                        const ch = nd?.choices.find((c) => c.id === step.choice)
                        return (
                            <li key={n} className="hw-rise rounded-2xl border border-border p-3">
                                <p className="text-xs text-muted-foreground">{nd?.text}</p>
                                <p className="mt-1.5 text-sm font-semibold text-foreground">→ {ch?.label}</p>
                            </li>
                        )
                    })}
                </ol>
            )}

            {node && (
                <div key={node.id} className="hw-slide-in space-y-3 rounded-2xl border-2 p-4" style={{ borderColor: `${color}55` }}>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Step {path.length + 1}</p>
                    <p className="text-base font-semibold leading-snug text-foreground">{node.text}</p>
                    <ul className="space-y-2">
                        {node.choices.map((c, n) => (
                            <li key={c.id} className="hw-rise" style={{ animationDelay: `${80 + n * 50}ms` }}>
                                <button type="button" onClick={() => choose(c.id, c.next)} className="hw-press hw-lift w-full rounded-xl border-2 border-border px-4 py-3 text-left text-sm font-medium text-foreground hover:border-foreground/25 hover:bg-muted/50">
                                    {c.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {finished && <p className="hw-pop rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Scenario complete. Submit to see how you did.</p>}

            <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => { setPath([]); setCurrent(config.start) }} disabled={path.length === 0 || submitting} className="hw-press inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:invisible">
                    <RotateCcw className="h-4 w-4" /> Start over
                </button>
                <button type="button" onClick={() => onSubmit({ kind: 'scenario', path })} disabled={!finished || submitting} className="hw-press inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md hover:opacity-90 hover:shadow-lg disabled:opacity-40" style={{ backgroundColor: color }}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
                </button>
            </div>
        </div>
    )
}
