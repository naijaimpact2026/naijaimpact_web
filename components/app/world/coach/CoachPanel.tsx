'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Loader2, Send, Sparkles, X } from 'lucide-react'
import { askCampusCoachAction } from '@/lib/actions/world-coach'
import type { CoachTurn } from '@/lib/world/coach'

/*
 * In-mission coach chat (Dev 2). Opens inside the mission's "How to do this"
 * card. The conversation is kept for this browser session per mission.
 */

const STARTERS = ['What does a good answer look like?', 'Help me get started', 'Explain the rubric simply']
const storeKey = (missionId: string) => `hw-coach:${missionId}`

export default function CoachPanel({ slug, missionId, color, boss, onClose }: { slug: string; missionId: string; color: string; boss: boolean; onClose: () => void })
{
    const [turns, setTurns] = useState<CoachTurn[]>([])
    const [text, setText] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, start] = useTransition()
    const end = useRef<HTMLDivElement>(null)

    useEffect(() =>
    {
        try { const raw = sessionStorage.getItem(storeKey(missionId)); if (raw) setTurns(JSON.parse(raw) as CoachTurn[]) } catch { /* storage blocked */ }
    }, [missionId])

    useEffect(() =>
    {
        try { sessionStorage.setItem(storeKey(missionId), JSON.stringify(turns.slice(-12))) } catch { /* storage blocked */ }
        end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, [turns, missionId])

    function send(message: string)
    {
        const m = message.trim()
        if (!m || pending) return
        setError(null)
        const history = turns
        setTurns([...history, { role: 'user', content: m }])
        setText('')
        start(async () =>
        {
            const r = await askCampusCoachAction(slug, missionId, m, history)
            if (!r.ok) { setError(r.error); setTurns(history); setText(m); return }
            setTurns([...history, { role: 'user', content: m }, { role: 'assistant', content: r.reply }])
        })
    }

    return (
        <div className="mt-4 rounded-2xl border border-border bg-background" role="region" aria-label="Novo coach">
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <span className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Sparkles className="h-4 w-4 text-amber-500" /> Novo coach</span>
                <button type="button" onClick={onClose} aria-label="Close coach" className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto px-3 py-3" aria-live="polite">
                {turns.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                        {boss
                            ? 'Judges score this challenge, so Novo can explain the brief and the rubric but won’t review your answer.'
                            : 'Novo explains the mission and helps you plan. It won’t write your answer for you, so the work (and the score) stays yours.'}
                    </p>
                )}
                {turns.map((t, i) => (
                    <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <p
                            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${t.role === 'user' ? 'text-white' : 'bg-muted text-foreground'}`}
                            style={t.role === 'user' ? { backgroundColor: color } : undefined}
                        >
                            {t.content}
                        </p>
                    </div>
                ))}
                {pending && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Novo is thinking…</p>}
                {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300">{error}</p>}
                <div ref={end} />
            </div>

            {turns.length === 0 && (
                <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                    {STARTERS.map((s) => (
                        <button key={s} type="button" disabled={pending} onClick={() => send(s)} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60">{s}</button>
                    ))}
                </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); send(text) }} className="flex items-end gap-2 border-t border-border p-2">
                <label htmlFor={`coach-${missionId}`} className="sr-only">Ask Novo</label>
                <textarea
                    id={`coach-${missionId}`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text) } }}
                    rows={1}
                    maxLength={1500}
                    placeholder="Ask about this mission…"
                    className="min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                />
                <button type="submit" disabled={pending || !text.trim()} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-50" style={{ backgroundColor: color }}>
                    <Send className="h-4 w-4" />
                </button>
            </form>
        </div>
    )
}
