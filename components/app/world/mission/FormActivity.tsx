'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, FileText, Film, ImageIcon, Loader2, Send, ShieldCheck, Upload, X } from 'lucide-react'
import { toast } from '@/components/toast'
import { worldUploadUrlAction } from '@/lib/actions/world'
import type { AttemptPayload, FieldDef, FieldValue, FormConfig } from '@/lib/world/types'
import { AnimatedBar, CheckMark } from '../fx'

/*
 * Renders every form-based mission (board, canvas, evidence, video,
 * reflection, team, live_event, boss) from its FormConfig. Uploads go
 * straight to R2 via a presigned URL; the field value becomes { key }.
 * The server re-validates everything.
 */

type Value = FieldValue | FieldValue[]
type UploadState = { name: string; progress: number; key?: string }

const MIME: Record<'image' | 'pdf' | 'video', string[]> = {
    image: ['image/jpeg', 'image/png', 'image/webp'],
    pdf: ['application/pdf'],
    video: ['video/mp4', 'video/quicktime', 'video/webm'],
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

function isFilled(f: FieldDef, v: Value | undefined): boolean
{
    if (f.repeat) return Array.isArray(v) && v.length === f.repeat && v.every((x) => x !== null && x !== '' && x !== undefined)
    if (v === null || v === undefined || v === '') return false
    if (typeof v === 'string' && f.minWords) return words(v) >= f.minWords
    return true
}

const draftKey = (missionId: string) => `hubnovo:draft:${missionId}`

const CANVAS_VARIANTS = ['value_proposition', 'lean_canvas', 'business_canvas']
const STAR_BADGE: Record<string, { letter: string; word: string; color: string }> = {
    situation: { letter: 'S', word: 'Situation', color: '#2563EB' },
    task: { letter: 'T', word: 'Task', color: '#7C3AED' },
    action: { letter: 'A', word: 'Action', color: '#DB2777' },
    result: { letter: 'R', word: 'Result', color: '#16A34A' },
}

/** Live margin / revenue / profit from the unit-economics fields. */
function UnitEconomics({ values, color }: { values: Record<string, Value>; color: string })
{
    const n = (k: string) => (typeof values[k] === 'number' ? (values[k] as number) : null)
    const price = n('price'), cost = n('cost'), units = n('units')
    if (price === null || cost === null) return <p className="rounded-2xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">Enter your price and cost to see your margin.</p>
    const margin = price - cost
    const pct = price > 0 ? Math.round((margin / price) * 100) : 0
    const naira = (v: number) => `₦${Math.round(v).toLocaleString('en-NG')}`
    const rows = [
        { label: 'Margin per unit', value: naira(margin), good: margin > 0 },
        { label: 'Margin %', value: `${pct}%`, good: pct >= 20 },
        { label: 'Monthly revenue', value: units === null ? '—' : naira(price * units), good: true },
        { label: 'Monthly gross profit', value: units === null ? '—' : naira(margin * units), good: margin > 0 },
    ]
    return (
        <div className="hw-pop grid grid-cols-2 gap-2 rounded-2xl border-2 p-3" style={{ borderColor: `${color}44` }}>
            {rows.map((r) => (
                <div key={r.label} className="rounded-xl bg-muted/40 p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground">{r.label}</p>
                    <p className={`mt-0.5 text-lg font-extrabold tabular-nums ${r.good ? 'text-foreground' : 'text-red-600'}`}>{r.value}</p>
                </div>
            ))}
            {margin <= 0 && <p className="col-span-2 text-xs font-semibold text-red-600">You’re losing money on each unit. Check your price or costs.</p>}
        </div>
    )
}

/** Removes a saved draft (called after a successful submit). */
export function clearFormDraft(missionId: string)
{
    try { localStorage.removeItem(draftKey(missionId)) } catch { /* ignore */ }
}

export default function FormActivity({ slug, missionId, config, color, submitting, onSubmit }: {
    slug: string; missionId: string; config: FormConfig; color: string; submitting: boolean; onSubmit: (p: AttemptPayload) => void
})
{
    const [values, setValues] = useState<Record<string, Value>>({})
    const [checked, setChecked] = useState<string[]>([])
    const [uploads, setUploads] = useState<Record<string, UploadState>>({})
    const [showErrors, setShowErrors] = useState(false)
    const [savedAt, setSavedAt] = useState<number | null>(null)
    const [restored, setRestored] = useState(false)
    const loaded = useRef(false)
    const uploading = Object.values(uploads).some((u) => !u.key)

    const isCanvas = CANVAS_VARIANTS.includes(config.variant ?? '')
    const required = config.fields.filter((f) => f.required)
    const missing = useMemo(() => required.filter((f) => !isFilled(f, values[f.id])), [required, values])
    const checklistDone = (config.checklist ?? []).every((c) => checked.includes(c.id))
    const ready = missing.length === 0 && checklistDone && !uploading
    const donePct = required.length ? ((required.length - missing.length) / required.length) * 100 : 100

    // Restore a saved draft once.
    useEffect(() =>
    {
        try
        {
            const raw = localStorage.getItem(draftKey(missionId))
            if (raw)
            {
                const d = JSON.parse(raw) as { values?: Record<string, Value>; checked?: string[]; uploads?: Record<string, UploadState> }
                if (d.values && Object.keys(d.values).length) { setValues(d.values); setRestored(true) }
                if (d.checked) setChecked(d.checked)
                if (d.uploads) setUploads(Object.fromEntries(Object.entries(d.uploads).filter(([, u]) => u.key)))
            }
        } catch { /* ignore a broken draft */ }
        loaded.current = true
    }, [missionId])

    // Autosave (debounced) after the first restore.
    useEffect(() =>
    {
        if (!loaded.current) return
        const hasContent = Object.values(values).some((v) => v !== null && v !== '' && !(Array.isArray(v) && v.every((x) => !x))) || checked.length > 0
        if (!hasContent) return
        const t = setTimeout(() =>
        {
            try
            {
                localStorage.setItem(draftKey(missionId), JSON.stringify({ values, checked, uploads: Object.fromEntries(Object.entries(uploads).filter(([, u]) => u.key)) }))
                setSavedAt(Date.now())
            } catch { /* storage full or blocked */ }
        }, 600)
        return () => clearTimeout(t)
    }, [values, checked, uploads, missionId])

    const set = (id: string, v: Value) => setValues((s) => ({ ...s, [id]: v }))

    function submit()
    {
        if (!ready)
        {
            setShowErrors(true)
            const first = missing[0]
            const el = first ? document.getElementById(`field-${first.id}`) : document.getElementById('form-checklist')
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            toast.error(uploading ? 'Wait for your upload to finish.' : missing.length ? 'Fill in the highlighted fields first.' : 'Tick the checklist to submit.')
            return
        }
        // Drop empty optional fields so the server only sees what was given.
        const fields: Record<string, Value> = {}
        for (const f of config.fields)
        {
            const v = values[f.id]
            if (v === undefined || v === '' || v === null) continue
            fields[f.id] = v
        }
        onSubmit({ kind: 'form', fields, checklist: checked })
    }

    return (
        <div className="space-y-5">
            {restored && (
                <p className="hw-pop flex items-center justify-between gap-2 rounded-2xl bg-sky-500/10 px-4 py-2.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                    Draft restored. Pick up where you left off.
                    <button type="button" onClick={() => { setValues({}); setChecked([]); setUploads({}); setRestored(false); clearFormDraft(missionId) }} className="hw-press underline-offset-2 hover:underline">Start fresh</button>
                </p>
            )}

            {config.intro && <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-foreground">{config.intro}</p>}

            <div className={isCanvas ? 'grid gap-3 sm:grid-cols-2' : 'space-y-5'}>
            {config.fields.map((f, idx) =>
            {
                const filled = isFilled(f, values[f.id])
                const flagged = showErrors && f.required && !filled
                const star = config.variant === 'star' ? STAR_BADGE[f.id] : undefined
                return (
                    <div
                        key={f.id}
                        id={`field-${f.id}`}
                        className={`hw-rise space-y-1.5 rounded-2xl transition-colors ${isCanvas ? `hw-lift border bg-muted/20 p-3 ${filled ? 'border-emerald-500/40' : 'border-border'}` : ''} ${flagged ? `hw-shake bg-red-500/5 ring-1 ring-red-500/40 ${isCanvas ? '' : '-mx-2 px-2 py-2'}` : ''}`}
                        style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                    >
                        <label htmlFor={`f-${f.id}`} className="flex items-baseline justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                {star && <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-extrabold text-white" style={{ backgroundColor: star.color }} title={star.word}>{star.letter}</span>}
                                {filled && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckMark className="h-3 w-3" /></span>}
                                {f.label}{f.required ? '' : <span className="font-normal text-muted-foreground"> (optional)</span>}
                            </span>
                            {f.type === 'textarea' && typeof values[f.id] === 'string' && (
                                <WordCount value={values[f.id] as string} min={f.minWords} max={f.maxWords} />
                            )}
                        </label>
                        {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                        {f.repeat ? (
                            <div className={config.variant === 'five_whys' ? 'relative space-y-2 pl-1' : 'space-y-2'}>
                                {config.variant === 'five_whys' && <span aria-hidden className="absolute bottom-5 left-[19px] top-5 w-0.5 rounded-full" style={{ backgroundColor: `${color}55` }} />}
                                {Array.from({ length: f.repeat }, (_, n) =>
                                {
                                    const arr = (Array.isArray(values[f.id]) ? values[f.id] : Array(f.repeat).fill('')) as FieldValue[]
                                    const why = config.variant === 'five_whys'
                                    return (
                                        <div key={n} className="relative flex items-center gap-2">
                                            {why
                                                ? <span className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${arr[n] ? 'text-white' : 'bg-muted text-muted-foreground'}`} style={arr[n] ? { backgroundColor: color } : undefined} title={`Why #${n + 1}`}>W{n + 1}</span>
                                                : <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums text-muted-foreground">{n + 1}.</span>}
                                            <FieldInput
                                                id={n === 0 ? `f-${f.id}` : `f-${f.id}-${n}`}
                                                field={{ ...f, repeat: undefined }}
                                                value={arr[n] ?? ''}
                                                color={color}
                                                onChange={(v) => { const next = [...arr]; next[n] = v as FieldValue; set(f.id, next) }}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        ) : f.type === 'file' || f.type === 'video' ? (
                            <UploadField
                                field={f}
                                state={uploads[f.id]}
                                color={color}
                                onStart={(name) => setUploads((u) => ({ ...u, [f.id]: { name, progress: 0 } }))}
                                onProgress={(pct) => setUploads((u) => ({ ...u, [f.id]: { ...u[f.id], progress: pct } }))}
                                onDone={(key) => { setUploads((u) => ({ ...u, [f.id]: { ...u[f.id], progress: 100, key } })); set(f.id, { key }) }}
                                onClear={() => { setUploads((u) => { const n = { ...u }; delete n[f.id]; return n }); set(f.id, null) }}
                                getUrl={(contentType, sizeBytes) => worldUploadUrlAction(slug, missionId, { fieldId: f.id, contentType, sizeBytes })}
                            />
                        ) : (
                            <FieldInput id={`f-${f.id}`} field={f} value={(values[f.id] ?? '') as FieldValue} color={color} onChange={(v) => set(f.id, v)} />
                        )}
                    </div>
                )
            })}

            </div>

            {config.variant === 'unit_economics' && <UnitEconomics values={values} color={color} />}

            {(config.checklist?.length ?? 0) > 0 && (
                <fieldset id="form-checklist" className={`space-y-2 rounded-2xl border p-4 transition-colors ${showErrors && !checklistDone ? 'hw-shake border-red-500/50 bg-red-500/5' : 'border-border bg-muted/30'}`}>
                    <legend className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Before you submit</legend>
                    {config.checklist!.map((c) => (
                        <label key={c.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-1 text-sm text-foreground transition-colors hover:bg-muted/50">
                            <input
                                id={`chk-${c.id}`}
                                type="checkbox"
                                checked={checked.includes(c.id)}
                                onChange={(e) => setChecked((s) => e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id))}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded"
                                style={{ accentColor: color }}
                            />
                            {c.label}
                        </label>
                    ))}
                </fieldset>
            )}

            {/* Sticky progress + submit */}
            <div className="sticky bottom-3 z-10 -mx-1 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
                <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="font-semibold text-foreground">
                                {uploading ? 'Uploading…' : ready ? 'Ready to submit' : `${required.length - missing.length} of ${required.length} done${!checklistDone && missing.length === 0 ? ' · tick the checklist' : ''}`}
                            </span>
                            {savedAt && <span className="text-[11px] text-muted-foreground">Draft saved</span>}
                        </div>
                        <AnimatedBar pct={ready ? 100 : donePct * (checklistDone ? 1 : 0.95)} color={ready ? '#16A34A' : color} className="h-1.5" />
                    </div>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={submitting}
                        className={`hw-press inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md hover:shadow-lg ${ready ? 'hover:opacity-90' : 'opacity-60'}`}
                        style={{ backgroundColor: ready ? color : '#64748B' }}
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
                    </button>
                </div>
            </div>
        </div>
    )
}

function WordCount({ value, min, max }: { value: string; min?: number; max?: number })
{
    const n = words(value)
    const low = min && n < min
    const high = max && n > max
    return <span className={`text-[11px] font-semibold tabular-nums ${low || high ? 'text-amber-600' : 'text-muted-foreground'}`}>{n}{min ? ` / ${min}+` : ''} words</span>
}

function FieldInput({ id, field: f, value, onChange }: { id: string; field: FieldDef; value: FieldValue; onChange: (v: FieldValue) => void; color?: string })
{
    const base = 'w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground transition-[border-color,box-shadow] duration-150 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/15'
    switch (f.type)
    {
        case 'textarea':
            return <textarea id={id} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} rows={Math.min(8, Math.max(3, Math.ceil((f.minWords ?? 20) / 12)))} className={`${base} py-2.5 leading-relaxed`} />
        case 'number':
            return <input id={id} type="number" inputMode="decimal" min={f.min} max={f.max} value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} className={`${base} h-11 tabular-nums`} />
        case 'select':
            return (
                <select id={id} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || null)} className={`${base} h-11`}>
                    <option value="">Choose…</option>
                    {f.options?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
            )
        case 'checkbox':
            return <input id={id} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5" />
        case 'link':
            return (
                <input
                    id={id}
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={value && typeof value === 'object' && 'url' in value ? value.url : ''}
                    onChange={(e) => onChange(e.target.value.trim() ? { url: e.target.value.trim() } : null)}
                    className={`${base} h-11`}
                />
            )
        default:
            return <input id={id} type="text" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={`${base} h-11`} />
    }
}

function UploadField(props: {
    field: FieldDef
    state: UploadState | undefined
    color: string
    onStart: (name: string) => void
    onProgress: (p: number) => void
    onDone: (key: string) => void
    onClear: () => void
    getUrl: (contentType: string, sizeBytes: number) => Promise<{ ok: true; uploadUrl: string; key: string } | { ok: false; error: string }>
})
{
    const ref = useRef<HTMLInputElement>(null)
    const groups = props.field.accept ?? (props.field.type === 'video' ? ['video'] : ['image', 'pdf'])
    const accept = groups.flatMap((g) => MIME[g as keyof typeof MIME] ?? []).join(',')
    const Icon = props.field.type === 'video' ? Film : groups.includes('image') ? ImageIcon : FileText

    async function pick(file: File | undefined)
    {
        if (!file) return
        if (!accept.split(',').includes(file.type)) { toast.error(`Upload a ${groups.join(' or ')} file.`); return }
        props.onStart(file.name)
        const r = await props.getUrl(file.type, file.size)
        if (!r.ok) { toast.error(r.error); props.onClear(); return }
        await new Promise<void>((resolve) =>
        {
            const xhr = new XMLHttpRequest()
            xhr.open('PUT', r.uploadUrl)
            xhr.setRequestHeader('Content-Type', file.type)
            xhr.upload.onprogress = (e) => { if (e.lengthComputable) props.onProgress(Math.round((e.loaded / e.total) * 100)) }
            xhr.onload = () =>
            {
                if (xhr.status >= 200 && xhr.status < 300) props.onDone(r.key)
                else { toast.error('Upload failed. Please try again.'); props.onClear() }
                resolve()
            }
            xhr.onerror = () => { toast.error('Upload failed. Check your connection and try again.'); props.onClear(); resolve() }
            xhr.send(file)
        })
        if (ref.current) ref.current.value = ''
    }

    const s = props.state
    return (
        <div>
            <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            {s ? (
                <div className="hw-pop flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                    {s.key ? <CheckCircle2 className="hw-pop h-5 w-5 shrink-0 text-emerald-600" /> : <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />}
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{s.name}</span>
                        {!s.key && (
                            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="hw-bar block h-full rounded-full" style={{ width: `${s.progress}%`, backgroundColor: props.color }} /></span>
                        )}
                    </span>
                    {s.key && <button type="button" onClick={props.onClear} aria-label="Remove file" className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>}
                </div>
            ) : (
                <button type="button" onClick={() => ref.current?.click()} className="hw-press hw-lift flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border px-4 py-4 text-left hover:border-foreground/30 hover:bg-muted/40">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Icon className="h-5 w-5 text-muted-foreground" /></span>
                    <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Upload className="h-4 w-4" /> Upload {props.field.type === 'video' ? 'a video' : groups.join(' / ')}</span>
                        <span className="block text-xs text-muted-foreground">
                            {props.field.type === 'video' ? `MP4, MOV or WebM · up to ${props.field.maxSeconds ?? 120}s · 150 MB` : 'JPG, PNG, WebP or PDF · up to 10 MB'}
                        </span>
                    </span>
                </button>
            )}
        </div>
    )
}
