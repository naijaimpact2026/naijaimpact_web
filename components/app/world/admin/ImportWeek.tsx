'use client'

import { useMemo, useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle2, FileJson, Loader2, Upload } from 'lucide-react'
import { toast } from '@/components/toast'
import { importWeekAction } from '@/lib/actions/world'
import { checkMission, checkWeek, type MissionInput } from '@/lib/world/content-rules'
import { DAY_NAMES } from '@/lib/world/ui'
import { inputCls } from './ConfigEditors'

const EXAMPLE = `[
  {
    "key": "c-w5-d1", "pathway": "career", "week": 5, "day": 1,
    "title": "…", "story": "…", "kind": "quiz",
    "config": { "graded": true, "questions": [ { "id": "q1", "prompt": "…", "options": [ { "id": "a", "label": "…" }, { "id": "b", "label": "…" } ] } ] },
    "answerKey": { "correct": { "q1": "b" } },
    "xp": 60, "tokens": 5, "bucket": "quality", "reviewMode": "auto", "estMinutes": 10
  }
]`

/** Paste or upload a whole week as JSON (same shape as SeedMission in lib/world/content). */
export default function ImportWeek({ slug, weeks, rubricKeys, onImported }: { slug: string; weeks: number; rubricKeys: string[]; onImported: () => void })
{
    const [text, setText] = useState('')
    const [replace, setReplace] = useState(false)
    const [activate, setActivate] = useState(true)
    const [busy, start] = useTransition()

    // Instant check while typing (the server runs the same rules again).
    const parsed = useMemo((): { missions: MissionInput[] | null; error: string | null; rows: { m: MissionInput; problem: string | null }[] } =>
    {
        if (!text.trim()) return { missions: null, error: null, rows: [] }
        try
        {
            const v = JSON.parse(text) as unknown
            const missions = (Array.isArray(v) ? v : (v as { missions?: unknown })?.missions) as MissionInput[] | undefined
            if (!Array.isArray(missions)) return { missions: null, error: 'Paste a JSON list of missions (or { "missions": [...] }).', rows: [] }
            const rubrics = new Set(rubricKeys)
            return { missions, error: null, rows: missions.map((m) => ({ m, problem: checkMission(m, { weeks, rubrics }) })) }
        } catch (e) { return { missions: null, error: `Not valid JSON: ${e instanceof Error ? e.message : ''}`, rows: [] } }
    }, [text, weeks, rubricKeys])

    const weekSet = new Set(parsed.rows.map((r) => r.m?.week))
    const checks = parsed.missions && weekSet.size === 1
        ? [...new Set(parsed.rows.map((r) => r.m.pathway))].map((p) => checkWeek(p, parsed.rows[0].m.week, parsed.rows.map((r) => ({ ...r.m, rubricKey: r.m.rubricKey ?? null, isActive: true }))))
        : []
    const ready = parsed.missions && parsed.rows.every((r) => !r.problem) && weekSet.size === 1 && (!activate || checks.every((c) => c.ready))

    async function loadFile(f: File | undefined)
    {
        if (!f) return
        if (f.size > 1_000_000) { toast.error('That file is too big (1 MB max).'); return }
        setText(await f.text())
    }

    function run()
    {
        if (!parsed.missions) return
        start(async () =>
        {
            const r = await importWeekAction(slug, { missions: parsed.missions!, replace, activate })
            if (!r.ok) { toast.error(r.error); return }
            toast.success(`Imported: ${r.inserted} new, ${r.updated} updated${r.switchedOff ? `, ${r.switchedOff} switched off` : ''}.`)
            setText('')
            onImported()
        })
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Load a whole week at once: a JSON list in the same shape as the missions in <span className="font-mono">lib/world/content</span>. One week per import; with “Make live” on, each pathway in the file needs 7 missions (Mon–Sun, Sunday = boss). Missions whose <span className="font-mono">key</span> already exists are updated.
            </p>
            <div className="flex flex-wrap items-center gap-3">
                <label className="hw-press inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted">
                    <Upload className="h-4 w-4" /> Upload .json
                    <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => loadFile(e.target.files?.[0])} />
                </label>
                <button type="button" onClick={() => setText(EXAMPLE)} className="hw-press inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"><FileJson className="h-4 w-4" /> Show an example</button>
            </div>
            <textarea className={`${inputCls} min-h-[260px] font-mono text-xs`} spellCheck={false} placeholder="Paste the week’s JSON here" value={text} onChange={(e) => setText(e.target.value)} />

            {parsed.error && <p className="flex items-center gap-1.5 text-sm text-red-600"><AlertTriangle className="h-4 w-4" />{parsed.error}</p>}
            {parsed.rows.length > 0 && (
                <div className="space-y-2 rounded-3xl border border-border bg-card p-4">
                    {weekSet.size > 1 && <p className="text-sm font-semibold text-red-600">All missions must be for the same week (found weeks {[...weekSet].join(', ')}).</p>}
                    {activate && checks.map((c) => (
                        <p key={c.pathway} className={`text-sm font-semibold ${c.ready ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                            {c.pathway === 'career' ? 'Career' : 'Enterprise'} week {c.week}: {c.ready ? 'complete (7 missions, Sunday boss).' : c.problems.join(' ')}
                        </p>
                    ))}
                    <ul className="divide-y divide-border text-sm">
                        {parsed.rows.map(({ m, problem }, i) => (
                            <li key={i} className="flex items-start gap-2 py-1.5">
                                {problem ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
                                <span className="min-w-0">
                                    <span className="font-semibold text-foreground">{m?.pathway ?? '?'} · W{m?.week ?? '?'} {DAY_NAMES[(m?.day ?? 1) - 1] ?? `day ${m?.day}`} · {m?.title || 'Untitled'}</span>
                                    {problem && <span className="block text-xs text-amber-700 dark:text-amber-300">{problem}</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} /> Make live (students see them on their days)</label>
                <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> Replace existing (switch off missions already on those days)</label>
                <button type="button" onClick={run} disabled={!ready || busy} className="hw-press ml-auto inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import {parsed.rows.length || ''} mission{parsed.rows.length === 1 ? '' : 's'}
                </button>
            </div>
        </div>
    )
}
