'use client'

import { CheckSquare, ExternalLink, FileText, Link2 } from 'lucide-react'
import type { ReviewQueueItem } from '@/lib/world/service'
import type { AttemptPayload, FieldDef, FieldValue, FormConfig } from '@/lib/world/types'

/** Renders what a student submitted, labelled with the mission's own questions. */
export default function SubmissionView({ item }: { item: ReviewQueueItem })
{
    const payload = item.payload as AttemptPayload | null
    if (!payload || payload.kind !== 'form')
        return <pre className="max-h-96 overflow-auto rounded-2xl bg-muted/60 p-3 text-xs">{JSON.stringify(payload, null, 2)}</pre>

    const config = item.mission.config as FormConfig
    const fields = config.fields ?? []
    // Signed URLs come back in field order, one per uploaded file.
    const queues = new Map<string, string[]>()
    for (const f of item.files) queues.set(f.fieldId, [...(queues.get(f.fieldId) ?? []), f.url])
    const nextUrl = (fieldId: string) => queues.get(fieldId)?.shift() ?? null

    const known = new Set(fields.map((f) => f.id))
    const extra = Object.keys(payload.fields ?? {}).filter((k) => !known.has(k))

    return (
        <div className="space-y-4">
            {fields.map((f) =>
            {
                const raw = payload.fields?.[f.id]
                const values = (Array.isArray(raw) && (f.repeat || raw.some((v) => v && typeof v === 'object' && !Array.isArray(v))) ? raw : [raw]) as FieldValue[]
                const filled = values.filter((v) => !empty(v))
                return (
                    <div key={f.id}>
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{f.label}</p>
                        {filled.length === 0 ? (
                            <p className="mt-1 text-sm italic text-muted-foreground">Left blank</p>
                        ) : filled.length === 1 ? (
                            <div className="mt-1"><Value field={f} value={filled[0]} url={nextUrl} /></div>
                        ) : (
                            <ol className="mt-1 space-y-1.5">
                                {filled.map((v, n) => (
                                    <li key={n} className="flex gap-2">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">{n + 1}</span>
                                        <div className="min-w-0 flex-1"><Value field={f} value={v} url={nextUrl} /></div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                )
            })}
            {extra.map((k) => (
                <div key={k}>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{k}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{JSON.stringify(payload.fields[k])}</p>
                </div>
            ))}
            {(config.checklist?.length ?? 0) > 0 && (
                <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Student confirmed</p>
                    <ul className="mt-1.5 space-y-1">
                        {config.checklist!.map((c) =>
                        {
                            const ok = payload.checklist?.includes(c.id)
                            return (
                                <li key={c.id} className={`flex gap-2 text-xs ${ok ? 'text-foreground' : 'text-red-600'}`}>
                                    <CheckSquare className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${ok ? 'text-emerald-600' : 'text-red-600'}`} /> {c.label}{!ok && ' (not ticked)'}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}

function empty(v: FieldValue | undefined)
{
    return v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)
}

function Value({ field, value, url }: { field: FieldDef; value: FieldValue; url: (fieldId: string) => string | null })
{
    if (typeof value === 'boolean') return <p className="text-sm text-foreground">{value ? 'Yes' : 'No'}</p>
    if (typeof value === 'number') return <p className="text-sm font-semibold tabular-nums text-foreground">{value.toLocaleString('en-NG')}</p>
    if (typeof value === 'string')
    {
        const option = field.options?.find((o) => o.id === value)
        const text = option?.label ?? value
        const words = text.trim().split(/\s+/).length
        return (
            <div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{text}</p>
                {field.type === 'textarea' && <p className="mt-0.5 text-[10px] text-muted-foreground">{words} words</p>}
            </div>
        )
    }
    if (Array.isArray(value))
        return <p className="text-sm text-foreground">{value.map((v) => field.options?.find((o) => o.id === v)?.label ?? v).join(', ')}</p>
    if (value && 'url' in value)
        return (
            <a href={safeHref(value.url)} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1.5 break-all text-sm font-semibold text-primary hover:underline">
                <Link2 className="h-4 w-4 shrink-0" /> {value.url}
            </a>
        )
    if (value && 'key' in value)
    {
        const href = url(field.id)
        if (!href) return <p className="text-sm text-muted-foreground">File uploaded (preview unavailable)</p>
        const ext = fileExt(href)
        if (field.type === 'video' || ['mp4', 'mov', 'webm'].includes(ext))
            return <video src={href} controls playsInline preload="metadata" className="max-h-96 w-full rounded-2xl bg-black" />
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext))
            return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed R2 URL */}
                    <img src={href} alt={field.label} className="max-h-96 rounded-2xl border border-border object-contain" />
                </a>
            )
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="hw-press inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted">
                <FileText className="h-4 w-4" /> Open {ext ? ext.toUpperCase() : 'file'} <ExternalLink className="h-3.5 w-3.5" />
            </a>
        )
    }
    return null
}

function fileExt(href: string)
{
    try { return new URL(href).pathname.split('.').pop()?.toLowerCase() ?? '' }
    catch { return '' }
}

/** Only open http(s) links a student typed. */
function safeHref(u: string)
{
    try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:' ? x.href : '#' }
    catch { return '#' }
}
