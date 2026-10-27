'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Film, Loader2, UploadCloud, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/toast'
import { createVideoUpload, finalizeVideoUpload } from '@/lib/actions/modushive'
import { ALLOWED_VIDEO_TYPES, formatBytes, formatDuration } from '@/lib/modushive/config'

interface UploadFormProps
{
    maxBytes: number
    maxDurationS: number
}

type Phase = 'idle' | 'uploading' | 'processing'

/** Reads duration from the file's own metadata, without uploading it. */
function readDuration(file: File): Promise<number>
{
    return new Promise((resolve, reject) =>
    {
        const url = URL.createObjectURL(file)
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration) }
        video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')) }
        video.src = url
    })
}

/** PUT straight to R2 — XHR rather than fetch for upload progress events. */
function putFile(url: string, file: File, onProgress: (pct: number) => void): Promise<void>
{
    return new Promise((resolve, reject) =>
    {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
    })
}

export default function UploadForm({ maxBytes, maxDurationS }: UploadFormProps)
{
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [duration, setDuration] = useState(0)
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('Entertainment')
    const [description, setDescription] = useState('')
    const [phase, setPhase] = useState<Phase>('idle')
    const [progress, setProgress] = useState(0)

    const busy = phase !== 'idle'
    const maxMinutes = Math.round(maxDurationS / 60)
    const lengthLabel = maxDurationS < 60 ? `${maxDurationS}s` : `${maxMinutes} min`

    // Don't let a half-finished upload disappear on an accidental tab close.
    useEffect(() =>
    {
        if (!busy) return
        const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [busy])

    async function pickFile(next: File | undefined)
    {
        if (!next) return
        if (!ALLOWED_VIDEO_TYPES.includes(next.type))
        {
            toast.warning('Choose an MP4, MOV or WebM video.')
            return
        }
        if (next.size > maxBytes)
        {
            toast.warning(`That file is ${formatBytes(next.size)}. The limit is ${formatBytes(maxBytes)}.`)
            return
        }

        let seconds = 0
        try { seconds = await readDuration(next) } catch { /* some codecs can't be probed in-browser — the server re-checks */ }
        if (seconds > maxDurationS + 1)
        {
            toast.warning(`That video is ${formatDuration(seconds)} long. The limit is ${lengthLabel}.`)
            return
        }

        setFile(next)
        setDuration(seconds)
        if (!title) setTitle(next.name.replace(/\.[^.]+$/, '').slice(0, 120))
    }

    async function handleSubmit(e: React.FormEvent)
    {
        e.preventDefault()
        if (!file || busy) return

        setPhase('uploading')
        setProgress(0)
        try
        {
            const taggedDescription = category
                ? `[${category}] ${description.trim()}`.trim()
                : description.trim()

            const created = await createVideoUpload({
                title,
                description: taggedDescription,
                contentType: file.type,
                sizeBytes: file.size,
                durationS: duration,
            })
            if (!created.ok) throw new Error(created.error)

            await putFile(created.uploadUrl, file, setProgress)

            setPhase('processing')
            const finalized = await finalizeVideoUpload(created.videoId)
            if (!finalized.ok) throw new Error(finalized.error)

            toast.success('Uploaded! Your video will appear once processing finishes.')
            router.push('/app/modushive')
        } catch (err)
        {
            toast.error(err instanceof Error ? err.message : 'Upload failed. Please try again.')
            setPhase('idle')
        }
    }

    const CATEGORIES = [
        'Entertainment',
        'Music',
        'Education',
        'Sports',
        'Faith',
        'News',
        'Lifestyle',
        'Business',
    ]

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {!file ? (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]) }}
                    className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-6 py-14 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <UploadCloud className="h-7 w-7 text-primary" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">Drop a video here or click to choose</span>
                    <span className="text-xs text-muted-foreground">MP4, MOV or WebM · up to {lengthLabel} · {formatBytes(maxBytes)} max</span>
                </button>
            ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Film className="h-5 w-5 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}{duration ? ` · ${formatDuration(duration)}` : ''}</p>
                    </div>
                    {!busy && (
                        <button type="button" onClick={() => { setFile(null); setDuration(0) }} aria-label="Remove video" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={ALLOWED_VIDEO_TYPES.join(',')}
                className="hidden"
                onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }}
            />

            <div className="space-y-1.5">
                <label htmlFor="video-title" className="text-sm font-medium text-foreground">Title</label>
                <Input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="What's this video about?" disabled={busy} required />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <div className="flex flex-wrap gap-2 pt-1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                category === cat
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="video-description" className="text-sm font-medium text-foreground">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea id="video-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} disabled={busy} placeholder="Tell viewers what happens in your video..." />
            </div>

            {busy && (
                <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className={`h-full rounded-full bg-primary transition-[width] duration-300 ${phase === 'processing' ? 'animate-pulse' : ''}`}
                            style={{ width: `${phase === 'processing' ? 100 : progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {phase === 'uploading' ? `Uploading… ${progress}%` : 'Sending to processing…'}
                    </p>
                </div>
            )}

            <button
                type="submit"
                disabled={!file || !title.trim() || busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? 'Uploading…' : 'Publish video'}
            </button>
        </form>
    )
}
