'use client'

import { useState, useTransition } from 'react'
import { Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from '@/components/toast'
import { saveRubricAction } from '@/lib/actions/world'
import type { RubricView } from '@/lib/world/types'
import { inputCls, labelCls, nextId } from './ConfigEditors'

type Rubric = RubricView & { missions: number }

const blank = (): RubricView => ({ key: '', title: '', passMark: 60, criteria: [{ id: 'c1', label: '', weight: 100 }] })

/** Rubrics (competition_rubrics): key, title, weighted criteria, pass mark. Keys can't change once used. */
export default function RubricEditor({ slug, rubrics: initial }: { slug: string; rubrics: Rubric[] })
{
    const [rubrics, setRubrics] = useState(initial)
    const [editing, setEditing] = useState<{ draft: RubricView; isNew: boolean } | null>(null)
    const [saving, start] = useTransition()
    const d = editing?.draft
    const total = d?.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0) ?? 0

    const set = (patch: Partial<RubricView>) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e))
    const setCrit = (i: number, patch: Partial<RubricView['criteria'][number]>) => set({ criteria: d!.criteria.map((c, j) => (j === i ? { ...c, ...patch } : c)) })

    function save()
    {
        if (!d) return
        start(async () =>
        {
            const r = await saveRubricAction(slug, d)
            if (!r.ok) { toast.error(r.error); return }
            setRubrics((xs) =>
            {
                const missions = xs.find((x) => x.key === r.rubric.key)?.missions ?? 0
                const next = { ...r.rubric, missions }
                return xs.some((x) => x.key === next.key) ? xs.map((x) => (x.key === next.key ? next : x)) : [...xs, next].sort((a, b) => a.key.localeCompare(b.key))
            })
            toast.success('Rubric saved.')
            setEditing(null)
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">AI reviewers and judges score against these. Weights add up to 100. Rubrics are shared by every pathway.</p>
                <button type="button" onClick={() => setEditing({ draft: blank(), isNew: true })} className="hw-press inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> New rubric</button>
            </div>

            {editing && d && (
                <section className="space-y-3 rounded-3xl border border-primary/40 bg-card p-4">
                    <div className="grid gap-3 sm:grid-cols-[180px_1fr_120px]">
                        <label className="space-y-1"><span className={labelCls}>Key</span>
                            <input className={`${inputCls} font-mono`} disabled={!editing.isNew} placeholder="e.g. pitch" value={d.key} onChange={(e) => set({ key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })} /></label>
                        <label className="space-y-1"><span className={labelCls}>Title</span>
                            <input className={inputCls} value={d.title} onChange={(e) => set({ title: e.target.value })} /></label>
                        <label className="space-y-1"><span className={labelCls}>Pass mark</span>
                            <input type="number" min={0} max={100} className={inputCls} value={d.passMark} onChange={(e) => set({ passMark: Math.round(Number(e.target.value)) })} /></label>
                    </div>
                    <div className="space-y-2">
                        <p className={labelCls}>Criteria</p>
                        {d.criteria.map((c, i) => (
                            <div key={i} className="grid gap-2 rounded-2xl bg-muted/30 p-2 sm:grid-cols-[1fr_1fr_90px_auto]">
                                <input className={inputCls} placeholder="Criterion" value={c.label} onChange={(e) => setCrit(i, { label: e.target.value })} />
                                <input className={inputCls} placeholder="What judges look for (optional)" value={c.description ?? ''} onChange={(e) => setCrit(i, { description: e.target.value || undefined })} />
                                <input type="number" min={1} max={100} className={inputCls} aria-label="Weight" value={c.weight} onChange={(e) => setCrit(i, { weight: Math.round(Number(e.target.value)) })} />
                                <button type="button" disabled={d.criteria.length <= 1} onClick={() => set({ criteria: d.criteria.filter((_, j) => j !== i) })} className="hw-press rounded-lg p-2 text-muted-foreground hover:text-red-600 disabled:opacity-40" aria-label="Remove criterion"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        ))}
                        <div className="flex items-center justify-between">
                            <button type="button" onClick={() => set({ criteria: [...d.criteria, { id: nextId('c', d.criteria.map((x) => x.id)), label: '', weight: Math.max(1, 100 - total) }] })} className="hw-press inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"><Plus className="h-3.5 w-3.5" /> Criterion</button>
                            <span className={`text-xs font-bold ${total === 100 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>Total weight {total}/100</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditing(null)} className="hw-press rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
                        <button type="button" onClick={save} disabled={saving || total !== 100} className="hw-press inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save rubric
                        </button>
                    </div>
                </section>
            )}

            <ul className="grid gap-3 md:grid-cols-2">
                {rubrics.map((r) => (
                    <li key={r.key} className="space-y-2 rounded-3xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-bold text-foreground">{r.title}</p>
                                <p className="text-xs text-muted-foreground"><span className="font-mono">{r.key}</span> · pass {r.passMark} · used by {r.missions} mission{r.missions === 1 ? '' : 's'}</p>
                            </div>
                            <button type="button" onClick={() => setEditing({ draft: { key: r.key, title: r.title, passMark: r.passMark, criteria: r.criteria }, isNew: false })} className="hw-press inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                        </div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {r.criteria.map((c) => <li key={c.id} className="flex justify-between gap-3"><span>{c.label}</span><span className="font-semibold tabular-nums">{c.weight}%</span></li>)}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    )
}
