'use client'

import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react'
import type { FieldDef, FieldType, FormConfig, MissionConfig, MissionKind, QuizConfig, ScenarioConfig, SortConfig } from '@/lib/world/types'

/*
 * Per-kind activity editors for the admin mission form. Each edits the
 * client-safe config and, for auto-graded kinds, the server-only answer key:
 *   quiz     { correct: { questionId: optionId | optionId[] } }
 *   sort     { correct: { itemId: binId } }
 *   scenario { scores: { choiceId: 0–100 } }
 */

export type AnswerKey = Record<string, unknown> | null
interface EditorProps<C> { config: C; answerKey: AnswerKey; onChange: (config: C, answerKey: AnswerKey) => void }

export const inputCls = 'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60'
export const labelCls = 'text-xs font-semibold text-muted-foreground'
const smallBtn = 'hw-press inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40'
const card = 'rounded-2xl border border-border bg-muted/30 p-3 space-y-2'

/** Next free id like q1, q2 … among the given ids. */
export function nextId(prefix: string, taken: string[])
{
    const set = new Set(taken)
    for (let i = 1; ; i++) if (!set.has(`${prefix}${i}`)) return `${prefix}${i}`
}

function move<T>(list: T[], i: number, dir: -1 | 1): T[]
{
    const j = i + dir
    if (j < 0 || j >= list.length) return list
    const out = [...list]
    ;[out[i], out[j]] = [out[j], out[i]]
    return out
}

function RowTools({ i, n, onMove, onRemove, minCount = 0 }: { i: number; n: number; onMove: (d: -1 | 1) => void; onRemove: () => void; minCount?: number })
{
    return (
        <div className="flex shrink-0 items-center">
            <button type="button" className={smallBtn} disabled={i === 0} onClick={() => onMove(-1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" className={smallBtn} disabled={i === n - 1} onClick={() => onMove(1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
            <button type="button" className={`${smallBtn} hover:text-red-600`} disabled={n <= minCount} onClick={onRemove} aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
    )
}

// ─── Defaults per kind ───────────────────────────────────────────────────────

export function defaultConfig(kind: MissionKind): { config: MissionConfig; answerKey: AnswerKey }
{
    if (kind === 'quiz')
        return { config: { graded: true, questions: [{ id: 'q1', prompt: '', options: [{ id: 'a', label: '' }, { id: 'b', label: '' }] }] }, answerKey: { correct: {} } }
    if (kind === 'sort')
        return { config: { prompt: '', items: [{ id: 'i1', label: '' }, { id: 'i2', label: '' }], bins: [{ id: 'b1', label: '' }, { id: 'b2', label: '' }] }, answerKey: { correct: {} } }
    if (kind === 'scenario')
        return { config: { intro: '', start: 'n1', nodes: [{ id: 'n1', text: '', choices: [{ id: 'n1a', label: '' }, { id: 'n1b', label: '' }] }] }, answerKey: { scores: {} } }
    const checklist = ['evidence', 'team', 'boss', 'video'].includes(kind)
        ? [{ id: 'no_pii', label: 'I removed names, phone numbers, addresses and anything that identifies a real person.' }, { id: 'honest', label: 'This is my own work and it is truthful — no made-up results or inflated claims.' }]
        : undefined
    return { config: { fields: [{ id: 'answer', label: '', type: 'textarea', required: true, minWords: 20, maxWords: 600 }], ...(checklist ? { checklist } : {}) }, answerKey: null }
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

export function QuizEditor({ config, answerKey, onChange }: EditorProps<QuizConfig>)
{
    const correct = ((answerKey?.correct ?? {}) as Record<string, string | string[]>)
    const set = (c: QuizConfig, k: Record<string, string | string[]> = correct) => onChange(c, c.graded ? { correct: k } : null)
    const qs = config.questions
    const setQ = (i: number, q: QuizConfig['questions'][number]) => set({ ...config, questions: qs.map((x, j) => (j === i ? q : x)) })

    function toggleCorrect(q: QuizConfig['questions'][number], optId: string)
    {
        const now = [correct[q.id] ?? []].flat()
        const next = q.multi ? (now.includes(optId) ? now.filter((x) => x !== optId) : [...now, optId]) : optId
        set(config, { ...correct, [q.id]: next })
    }

    return (
        <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input type="checkbox" checked={config.graded} onChange={(e) => set({ ...config, graded: e.target.checked })} />
                Graded (has right answers). Untick for a self-assessment that always passes.
            </label>
            {qs.map((q, i) => (
                <div key={i} className={card}>
                    <div className="flex items-start gap-2">
                        <span className="mt-2 text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                        <textarea className={`${inputCls} min-h-[60px]`} placeholder="Question" value={q.prompt} onChange={(e) => setQ(i, { ...q, prompt: e.target.value })} />
                        <RowTools i={i} n={qs.length} minCount={1} onMove={(d) => set({ ...config, questions: move(qs, i, d) })}
                            onRemove={() => { const k = { ...correct }; delete k[q.id]; set({ ...config, questions: qs.filter((_, j) => j !== i) }, k) }} />
                    </div>
                    <label className="flex items-center gap-2 pl-7 text-xs text-muted-foreground">
                        <input type="checkbox" checked={Boolean(q.multi)} onChange={(e) => { setQ(i, { ...q, multi: e.target.checked || undefined }) }} /> Students can pick more than one answer
                    </label>
                    <ul className="space-y-1.5 pl-7">
                        {q.options.map((o, oi) =>
                        {
                            const isRight = [correct[q.id] ?? []].flat().includes(o.id)
                            return (
                                <li key={oi} className="flex items-center gap-2">
                                    {config.graded && (
                                        <button type="button" onClick={() => toggleCorrect(q, o.id)} aria-label={isRight ? 'Correct answer' : 'Mark as correct'} title={isRight ? 'Correct answer' : 'Mark as correct'}
                                            className={`hw-press flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${isRight ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border text-transparent hover:text-muted-foreground'}`}>
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                    <input className={inputCls} placeholder={`Option ${oi + 1}`} value={o.label} onChange={(e) => setQ(i, { ...q, options: q.options.map((x, j) => (j === oi ? { ...x, label: e.target.value } : x)) })} />
                                    <RowTools i={oi} n={q.options.length} minCount={2} onMove={(d) => setQ(i, { ...q, options: move(q.options, oi, d) })}
                                        onRemove={() => setQ(i, { ...q, options: q.options.filter((_, j) => j !== oi) })} />
                                </li>
                            )
                        })}
                    </ul>
                    <button type="button" className={`${smallBtn} ml-7`} onClick={() => setQ(i, { ...q, options: [...q.options, { id: nextId('o', q.options.map((x) => x.id)), label: '' }] })}><Plus className="h-3.5 w-3.5" /> Option</button>
                </div>
            ))}
            <button type="button" className={smallBtn} onClick={() => set({ ...config, questions: [...qs, { id: nextId('q', qs.map((x) => x.id)), prompt: '', options: [{ id: 'a', label: '' }, { id: 'b', label: '' }] }] })}><Plus className="h-3.5 w-3.5" /> Question</button>
        </div>
    )
}

// ─── Sort ────────────────────────────────────────────────────────────────────

export function SortEditor({ config, answerKey, onChange }: EditorProps<SortConfig>)
{
    const correct = ((answerKey?.correct ?? {}) as Record<string, string>)
    const set = (c: SortConfig, k: Record<string, string> = correct) => onChange(c, { correct: k })
    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <span className={labelCls}>Instructions</span>
                <textarea className={`${inputCls} min-h-[60px]`} value={config.prompt} placeholder="e.g. Sort each skill into the right group." onChange={(e) => set({ ...config, prompt: e.target.value })} />
            </div>
            <div className={card}>
                <p className={labelCls}>Groups (bins)</p>
                {config.bins.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input className={inputCls} placeholder={`Group ${i + 1}`} value={b.label} onChange={(e) => set({ ...config, bins: config.bins.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                        <RowTools i={i} n={config.bins.length} minCount={2} onMove={(d) => set({ ...config, bins: move(config.bins, i, d) })}
                            onRemove={() => set({ ...config, bins: config.bins.filter((_, j) => j !== i) }, Object.fromEntries(Object.entries(correct).filter(([, v]) => v !== b.id)))} />
                    </div>
                ))}
                <button type="button" className={smallBtn} onClick={() => set({ ...config, bins: [...config.bins, { id: nextId('b', config.bins.map((x) => x.id)), label: '' }] })}><Plus className="h-3.5 w-3.5" /> Group</button>
            </div>
            <div className={card}>
                <p className={labelCls}>Items and the group each belongs in</p>
                {config.items.map((it, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                        <input className={inputCls} placeholder={`Item ${i + 1}`} value={it.label} onChange={(e) => set({ ...config, items: config.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                        <select className={`${inputCls} sm:max-w-[200px]`} value={correct[it.id] ?? ''} onChange={(e) => set(config, { ...correct, [it.id]: e.target.value })} aria-label="Right group">
                            <option value="">Right group…</option>
                            {config.bins.map((b) => <option key={b.id} value={b.id}>{b.label || b.id}</option>)}
                        </select>
                        <RowTools i={i} n={config.items.length} minCount={2} onMove={(d) => set({ ...config, items: move(config.items, i, d) })}
                            onRemove={() => { const k = { ...correct }; delete k[it.id]; set({ ...config, items: config.items.filter((_, j) => j !== i) }, k) }} />
                    </div>
                ))}
                <button type="button" className={smallBtn} onClick={() => set({ ...config, items: [...config.items, { id: nextId('i', config.items.map((x) => x.id)), label: '' }] })}><Plus className="h-3.5 w-3.5" /> Item</button>
            </div>
        </div>
    )
}

// ─── Scenario ────────────────────────────────────────────────────────────────

export function ScenarioEditor({ config, answerKey, onChange }: EditorProps<ScenarioConfig>)
{
    const scores = ((answerKey?.scores ?? {}) as Record<string, number>)
    const set = (c: ScenarioConfig, k: Record<string, number> = scores) => onChange(c, { scores: k })
    const nodes = config.nodes
    const setNode = (i: number, n: ScenarioConfig['nodes'][number]) => set({ ...config, nodes: nodes.map((x, j) => (j === i ? n : x)) })
    const allChoiceIds = nodes.flatMap((n) => n.choices.map((c) => c.id))

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <span className={labelCls}>Introduction</span>
                <textarea className={`${inputCls} min-h-[60px]`} value={config.intro} onChange={(e) => set({ ...config, intro: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
                <span className={labelCls}>Starts at</span>
                <select className={`${inputCls} max-w-[200px]`} value={config.start} onChange={(e) => set({ ...config, start: e.target.value })}>
                    {nodes.map((n) => <option key={n.id} value={n.id}>Step {n.id}</option>)}
                </select>
            </label>
            {nodes.map((n, i) => (
                <div key={i} className={card}>
                    <div className="flex items-start gap-2">
                        <span className="mt-2 rounded-md bg-muted px-1.5 text-xs font-bold text-muted-foreground">{n.id}</span>
                        <textarea className={`${inputCls} min-h-[60px]`} placeholder="What happens at this step?" value={n.text} onChange={(e) => setNode(i, { ...n, text: e.target.value })} />
                        <RowTools i={i} n={nodes.length} minCount={1} onMove={(d) => set({ ...config, nodes: move(nodes, i, d) })}
                            onRemove={() =>
                            {
                                const k = { ...scores }; n.choices.forEach((c) => delete k[c.id])
                                const rest = nodes.filter((_, j) => j !== i).map((x) => ({ ...x, choices: x.choices.map((c) => (c.next === n.id ? { ...c, next: undefined } : c)) }))
                                set({ ...config, nodes: rest, start: config.start === n.id ? rest[0]?.id ?? '' : config.start }, k)
                            }} />
                    </div>
                    <ul className="space-y-1.5 pl-8">
                        {n.choices.map((c, ci) => (
                            <li key={ci} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                                <input className={inputCls} placeholder={`Choice ${ci + 1}`} value={c.label} onChange={(e) => setNode(i, { ...n, choices: n.choices.map((x, j) => (j === ci ? { ...x, label: e.target.value } : x)) })} />
                                <select className={`${inputCls} sm:max-w-[150px]`} value={c.next ?? ''} aria-label="Leads to" onChange={(e) => setNode(i, { ...n, choices: n.choices.map((x, j) => (j === ci ? { ...x, next: e.target.value || undefined } : x)) })}>
                                    <option value="">Ends here</option>
                                    {nodes.filter((x) => x.id !== n.id).map((x) => <option key={x.id} value={x.id}>Go to {x.id}</option>)}
                                </select>
                                <input type="number" min={0} max={100} className={`${inputCls} w-20`} aria-label="Score 0–100" title="Score 0–100" placeholder="0–100"
                                    value={scores[c.id] ?? ''} onChange={(e) => set(config, { ...scores, [c.id]: e.target.value === '' ? (undefined as unknown as number) : Math.max(0, Math.min(100, Math.round(Number(e.target.value)))) })} />
                                <RowTools i={ci} n={n.choices.length} minCount={1} onMove={(d) => setNode(i, { ...n, choices: move(n.choices, ci, d) })}
                                    onRemove={() => { const k = { ...scores }; delete k[c.id]; set({ ...config, nodes: nodes.map((x, j) => (j === i ? { ...n, choices: n.choices.filter((_, jj) => jj !== ci) } : x)) }, k) }} />
                            </li>
                        ))}
                    </ul>
                    <button type="button" className={`${smallBtn} ml-8`} onClick={() => setNode(i, { ...n, choices: [...n.choices, { id: nextId(`${n.id}c`, allChoiceIds), label: '' }] })}><Plus className="h-3.5 w-3.5" /> Choice</button>
                </div>
            ))}
            <button type="button" className={smallBtn} onClick={() => { const id = nextId('n', nodes.map((x) => x.id)); set({ ...config, nodes: [...nodes, { id, text: '', choices: [{ id: nextId(`${id}c`, allChoiceIds), label: '' }] }] }) }}><Plus className="h-3.5 w-3.5" /> Step</button>
            <p className="text-xs text-muted-foreground">Score every choice from 0 to 100 (100 = best choice). The student’s score is the average of the choices they made.</p>
        </div>
    )
}

// ─── Form missions (board, canvas, evidence, video, reflection, team, live event, boss) ─

const FIELD_LABEL: Record<FieldType, string> = { text: 'Short text', textarea: 'Long text', number: 'Number', select: 'Choose one', checkbox: 'Tick box', file: 'File upload', link: 'Link', video: 'Video' }
const CHECKLIST_PRESETS = [
    { id: 'consent', label: 'Everyone I spoke to agreed to take part, and I asked their permission first.' },
    { id: 'no_pii', label: 'I removed names, phone numbers, addresses and anything that identifies a real person.' },
    { id: 'honest', label: 'This is my own work and it is truthful — no made-up results or inflated claims.' },
]

const num = (v: string) => (v === '' ? undefined : Number(v))

function FieldEditor({ f, onChange }: { f: FieldDef; onChange: (f: FieldDef) => void })
{
    const set = (patch: Partial<FieldDef>) =>
    {
        const next = { ...f, ...patch } as FieldDef
        for (const k of Object.keys(next) as (keyof FieldDef)[]) if (next[k] === undefined) delete next[k]
        onChange(next)
    }
    function changeType(type: FieldType)
    {
        const base: FieldDef = { id: f.id, label: f.label, type, required: f.required, hint: f.hint }
        if (type === 'textarea') Object.assign(base, { minWords: 20, maxWords: 600 })
        if (type === 'select') base.options = f.options?.length ? f.options : [{ id: 'o1', label: '' }, { id: 'o2', label: '' }]
        if (type === 'file') base.accept = ['image', 'pdf']
        if (type === 'video') Object.assign(base, { accept: ['video'], maxSeconds: 60 })
        onChange(Object.fromEntries(Object.entries(base).filter(([, v]) => v !== undefined)) as unknown as FieldDef)
    }
    return (
        <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
                <input className={inputCls} placeholder="Label the student sees" value={f.label} onChange={(e) => set({ label: e.target.value })} />
                <select className={inputCls} value={f.type} onChange={(e) => changeType(e.target.value as FieldType)} aria-label="Field type">
                    {(Object.keys(FIELD_LABEL) as FieldType[]).map((t) => <option key={t} value={t}>{FIELD_LABEL[t]}</option>)}
                </select>
            </div>
            <input className={inputCls} placeholder="Hint (optional)" value={f.hint ?? ''} onChange={(e) => set({ hint: e.target.value || undefined })} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={Boolean(f.required)} onChange={(e) => set({ required: e.target.checked || undefined })} /> Required</label>
                <label className="flex items-center gap-1.5">Repeat ×<input type="number" min={1} max={10} className={`${inputCls} w-16 py-1`} value={f.repeat ?? ''} placeholder="1" onChange={(e) => set({ repeat: num(e.target.value) && num(e.target.value)! > 1 ? num(e.target.value) : undefined })} /></label>
                {f.type === 'textarea' && <>
                    <label className="flex items-center gap-1.5">Min words<input type="number" min={0} className={`${inputCls} w-20 py-1`} value={f.minWords ?? ''} onChange={(e) => set({ minWords: num(e.target.value) })} /></label>
                    <label className="flex items-center gap-1.5">Max words<input type="number" min={1} className={`${inputCls} w-20 py-1`} value={f.maxWords ?? ''} onChange={(e) => set({ maxWords: num(e.target.value) })} /></label>
                </>}
                {f.type === 'number' && <>
                    <label className="flex items-center gap-1.5">Min<input type="number" className={`${inputCls} w-24 py-1`} value={f.min ?? ''} onChange={(e) => set({ min: num(e.target.value) })} /></label>
                    <label className="flex items-center gap-1.5">Max<input type="number" className={`${inputCls} w-28 py-1`} value={f.max ?? ''} onChange={(e) => set({ max: num(e.target.value) })} /></label>
                </>}
                {f.type === 'file' && (['image', 'pdf'] as const).map((g) => (
                    <label key={g} className="flex items-center gap-1.5"><input type="checkbox" checked={f.accept?.includes(g) ?? false}
                        onChange={(e) => set({ accept: e.target.checked ? [...(f.accept ?? []), g] : (f.accept ?? []).filter((x) => x !== g) })} /> {g === 'pdf' ? 'PDF' : 'Images'}</label>
                ))}
                {f.type === 'video' && <label className="flex items-center gap-1.5">Max seconds<input type="number" min={5} max={600} className={`${inputCls} w-20 py-1`} value={f.maxSeconds ?? ''} onChange={(e) => set({ maxSeconds: num(e.target.value) })} /></label>}
            </div>
            {f.type === 'select' && (
                <ul className="space-y-1.5">
                    {(f.options ?? []).map((o, i) => (
                        <li key={i} className="flex items-center gap-2">
                            <input className={inputCls} placeholder={`Option ${i + 1}`} value={o.label} onChange={(e) => set({ options: f.options!.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                            <RowTools i={i} n={f.options!.length} minCount={2} onMove={(d) => set({ options: move(f.options!, i, d) })} onRemove={() => set({ options: f.options!.filter((_, j) => j !== i) })} />
                        </li>
                    ))}
                    <button type="button" className={smallBtn} onClick={() => set({ options: [...(f.options ?? []), { id: nextId('o', (f.options ?? []).map((x) => x.id)), label: '' }] })}><Plus className="h-3.5 w-3.5" /> Option</button>
                </ul>
            )}
        </div>
    )
}

export function FormEditor({ config, onChange }: { config: FormConfig; onChange: (c: FormConfig) => void })
{
    const fields = config.fields
    const checklist = config.checklist ?? []
    const set = (patch: Partial<FormConfig>) =>
    {
        const next = { ...config, ...patch }
        if (!next.variant) delete next.variant
        if (!next.intro) delete next.intro
        if (!next.checklist?.length) delete next.checklist
        onChange(next)
    }
    return (
        <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
                <label className="space-y-1"><span className={labelCls}>Intro above the fields (optional)</span>
                    <textarea className={`${inputCls} min-h-[44px]`} value={config.intro ?? ''} onChange={(e) => set({ intro: e.target.value })} /></label>
                <label className="space-y-1"><span className={labelCls}>Layout hint (optional)</span>
                    <input className={inputCls} placeholder="e.g. five_whys, scorecard" value={config.variant ?? ''} onChange={(e) => set({ variant: e.target.value.trim() })} /></label>
            </div>
            {fields.map((f, i) => (
                <div key={i} className={card}>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-muted-foreground">Field {i + 1} <span className="font-mono font-normal">· {f.id}</span></span>
                        <RowTools i={i} n={fields.length} minCount={1} onMove={(d) => set({ fields: move(fields, i, d) })} onRemove={() => set({ fields: fields.filter((_, j) => j !== i) })} />
                    </div>
                    <FieldEditor f={f} onChange={(nf) => set({ fields: fields.map((x, j) => (j === i ? nf : x)) })} />
                </div>
            ))}
            <button type="button" className={smallBtn} onClick={() => set({ fields: [...fields, { id: nextId('f', fields.map((x) => x.id)), label: '', type: 'textarea', required: true, minWords: 20, maxWords: 600 }] })}><Plus className="h-3.5 w-3.5" /> Field</button>

            <div className={card}>
                <p className={labelCls}>Checklist (students must tick every item)</p>
                {checklist.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input className={inputCls} value={c.label} onChange={(e) => set({ checklist: checklist.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                        <RowTools i={i} n={checklist.length} onMove={(d) => set({ checklist: move(checklist, i, d) })} onRemove={() => set({ checklist: checklist.filter((_, j) => j !== i) })} />
                    </div>
                ))}
                <div className="flex flex-wrap gap-1">
                    {CHECKLIST_PRESETS.filter((p) => !checklist.some((c) => c.id === p.id)).map((p) => (
                        <button key={p.id} type="button" className={`${smallBtn} border border-border`} onClick={() => set({ checklist: [...checklist, p] })}><Plus className="h-3.5 w-3.5" /> {p.id === 'consent' ? 'Consent' : p.id === 'no_pii' ? 'No personal data' : 'Honesty'}</button>
                    ))}
                    <button type="button" className={smallBtn} onClick={() => set({ checklist: [...checklist, { id: nextId('c', checklist.map((x) => x.id)), label: '' }] })}><Plus className="h-3.5 w-3.5" /> Custom item</button>
                </div>
            </div>
        </div>
    )
}
