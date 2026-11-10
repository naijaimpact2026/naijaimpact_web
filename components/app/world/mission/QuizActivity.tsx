'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2, Send } from 'lucide-react'
import type { AttemptPayload, QuizConfig } from '@/lib/world/types'

/** One question at a time; multi-select questions allow several options. */
export default function QuizActivity({ config, color, submitting, onSubmit }: { config: QuizConfig; color: string; submitting: boolean; onSubmit: (p: AttemptPayload) => void })
{
    const [i, setI] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string[]>>({})
    const q = config.questions[i]
    const picked = answers[q.id] ?? []
    const last = i === config.questions.length - 1
    const allAnswered = config.questions.every((x) => (answers[x.id] ?? []).length > 0)

    function toggle(optionId: string)
    {
        setAnswers((a) =>
        {
            const cur = a[q.id] ?? []
            const next = q.multi ? (cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId]) : [optionId]
            return { ...a, [q.id]: next }
        })
        if (!q.multi && !last) setTimeout(() => setI((n) => Math.min(n + 1, config.questions.length - 1)), 180)
    }

    function submit()
    {
        onSubmit({ kind: 'quiz', answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, config.questions.find((x) => x.id === k)?.multi ? v : v[0]])) })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5" aria-label={`Question ${i + 1} of ${config.questions.length}`}>
                {config.questions.map((x, n) => (
                    <button
                        key={x.id}
                        type="button"
                        onClick={() => setI(n)}
                        aria-label={`Question ${n + 1}`}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${n === i ? '' : (answers[x.id] ?? []).length ? 'opacity-50' : 'bg-muted'}`}
                        style={n === i || (answers[x.id] ?? []).length ? { backgroundColor: color } : undefined}
                    />
                ))}
            </div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Question {i + 1} of {config.questions.length}{q.multi ? ' · choose all that apply' : ''}</p>
                <h3 className="mt-1.5 text-lg font-bold leading-snug text-foreground">{q.prompt}</h3>
            </div>
            <ul className="space-y-2">
                {q.options.map((o) =>
                {
                    const on = picked.includes(o.id)
                    return (
                        <li key={o.id}>
                            <button
                                type="button"
                                onClick={() => toggle(o.id)}
                                aria-pressed={on}
                                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${on ? 'text-foreground' : 'border-border text-foreground hover:bg-muted/50'}`}
                                style={on ? { borderColor: color, backgroundColor: `${color}12` } : undefined}
                            >
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${q.multi ? 'rounded-md' : 'rounded-full'} border-2`} style={on ? { borderColor: color, backgroundColor: color } : undefined}>
                                    {on && <Check className="h-3 w-3 text-white" />}
                                </span>
                                {o.label}
                            </button>
                        </li>
                    )
                })}
            </ul>
            <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:invisible">
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
                {last || allAnswered ? (
                    <button type="button" onClick={submit} disabled={!allAnswered || submitting} className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: color }}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit answers
                    </button>
                ) : (
                    <button type="button" onClick={() => setI((n) => n + 1)} disabled={picked.length === 0} className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-40">
                        Next <ArrowRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    )
}
