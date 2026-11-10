'use client'

import { useMemo, useRef, useState } from 'react'
import { CheckCircle2, FileText, Film, ImageIcon, Loader2, Send, ShieldCheck, Upload, X } from 'lucide-react'
import { toast } from '@/components/toast'
import { worldUploadUrlAction } from '@/lib/actions/world'
import type { AttemptPayload, FieldDef, FieldValue, FormConfig } from '@/lib/world/types'

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

export default function FormActivity({ slug, missionId, config, color, submitting, onSubmit }: {
    slug: string; missionId: string; config: FormConfig; color: string; submitting: boolean; onSubmit: (p: AttemptPayload) => void
})
{
    const [values, setValues] = useState<Record<string, Value>>({})
    const [checked, setChecked] = useState<string[]>([])
    const [uploads, setUploads] = useState<Record<string, UploadState>>({})
    const uploading = Object.values(uploads).some((u) => !u.key)

    const missing = useMemo(() => config.fields.filter((f) => f.required && !isFilled(f, values[f.id])), [config.fields, values])
    const checklistDone = (config.checklist ?? []).every((c) => checked.includes(c.id))
    const ready = missing.length === 0 && checklistDone && !uploading

    const set = (id: string, v: Value) => setValues((s) => ({ ...s, [id]: v }))

    function submit()
    {
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
            {config.intro && <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-foreground">{config.intro}</p>}

            {config.fields.map((f) => (
                <div key={f.id} className="space-y-1.5">
                    <label htmlFor={`f-${f.id}`} className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{f.label}{f.required ? '' : <span className="font-normal text-muted-foreground"> (optional)</span>}</span>
                        {f.type === 'textarea' && typeof values[f.id] === 'string' && (
                            <WordCount value={values[f.id] as string} min={f.minWords} max={f.maxWords} />
                        )}
                    </label>
                    {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                    {f.repeat ? (
                        <div className="space-y-2">
                            {Array.from({ length: f.repeat }, (_, n) =>
                            {
                                const arr = (Array.isArray(values[f.id]) ? values[f.id] : Array(f.repeat).fill('')) as FieldValue[]
                                return (
                                    <div key={n} className="flex items-center gap-2">
                                        <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums text-muted-foreground">{n + 1}.</span>
                                        <FieldInput
                                            id={n === 0 ? `f-${f.id}` : `f-${f.id}-${n}`}
                                            field={{ ...f, repeat: undefined }}
                                            value={arr[n] ?? ''}
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
                            onProgress={(p) => setUploads((u) => ({ ...u, [f.id]: { ...u[f.id], progress: p } }))}
                            onDone={(key) => { setUploads((u) => ({ ...u, [f.id]: { ...u[f.id], progress: 100, key } })); set(f.id, { key }) }}
                            onClear={() => { setUploads((u) => { const n = { ...u }; delete n[f.id]; return n }); set(f.id, null) }}
                            getUrl={(contentType, sizeBytes) => worldUploadUrlAction(slug, missionId, { fieldId: f.id, contentType, sizeBytes })}
                        />
                    ) : (
                        <FieldInput id={`f-${f.id}`} field={f} value={(values[f.id] ?? '') as FieldValue} onChange={(v) => set(f.id, v)} />
                    )}
                </div>
            ))}

            {(config.checklist?.length ?? 0) > 0 && (
                <fieldset className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4">
                    <legend className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Before you submit</legend>
                    {config.checklist!.map((c) => (
                        <label key={c.id} className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
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

            <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                    {uploading ? 'Waiting for uploads to finish…' : missing.length > 0 ? `${missing.length} required ${missing.length === 1 ? 'field' : 'fields'} left` : !checklistDone ? 'Tick the checklist to submit' : 'Ready to submit'}
                </p>
                <button type="button" onClick={submit} disabled={!ready || submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: color }}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
                </button>
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

function FieldInput({ id, field: f, value, onChange }: { id: string; field: FieldDef; value: FieldValue; onChange: (v: FieldValue) => void })
{
    const base = 'w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground'
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
                <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                    {s.key ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />}
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{s.name}</span>
                        {!s.key && (
                            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full transition-all" style={{ width: `${s.progress}%`, backgroundColor: props.color }} /></span>
                        )}
                    </span>
                    {s.key && <button type="button" onClick={props.onClear} aria-label="Remove file" className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>}
                </div>
            ) : (
                <button type="button" onClick={() => ref.current?.click()} className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border px-4 py-4 text-left hover:bg-muted/40">
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
