'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Eye, EyeOff, Loader2, Radio, Square } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/toast'
import { createLiveStream, endLiveStream, getLiveStreamKey } from '@/lib/actions/modushive'

export function GoLiveForm()
{
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [pending, startTransition] = useTransition()

    function handleSubmit(e: React.FormEvent)
    {
        e.preventDefault()
        startTransition(async () =>
        {
            const res = await createLiveStream({ title, description })
            if (!res.ok) { toast.error(res.error); return }
            toast.success('Stream created. Copy the server URL and key into OBS to go live.')
            setTitle('')
            setDescription('')
            router.refresh()
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="space-y-1.5">
                <label htmlFor="stream-title" className="text-sm font-medium text-foreground">Stream title</label>
                <Input id="stream-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required disabled={pending} placeholder="e.g. Founders' Friday Q&A" />
            </div>
            <div className="space-y-1.5">
                <label htmlFor="stream-description" className="text-sm font-medium text-foreground">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea id="stream-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} disabled={pending} />
            </div>
            <button
                type="submit"
                disabled={pending || !title.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
                Create live stream
            </button>
        </form>
    )
}

function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean })
{
    const [shown, setShown] = useState(!secret)
    const [copied, setCopied] = useState(false)

    async function copy()
    {
        try
        {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch { toast.error('Could not copy to clipboard') }
    }

    return (
        <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2">
                <code className="flex-1 truncate text-xs text-foreground">{shown ? value : '•'.repeat(24)}</code>
                {secret && (
                    <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Hide' : 'Show'} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                        {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                )}
                <button type="button" onClick={copy} aria-label="Copy" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
            </div>
        </div>
    )
}

/** Stream key is fetched on demand (admin-only action), never rendered into the page HTML. */
export function StreamKeyPanel({ liveStreamId }: { liveStreamId: string })
{
    const [creds, setCreds] = useState<{ rtmpUrl: string; streamKey: string } | null>(null)
    const [pending, startTransition] = useTransition()

    if (creds)
    {
        return (
            <div className="space-y-3">
                <CopyField label="Server URL" value={creds.rtmpUrl} />
                <CopyField label="Stream key — keep private" value={creds.streamKey} secret />
            </div>
        )
    }

    return (
        <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () =>
            {
                const res = await getLiveStreamKey(liveStreamId)
                if (!res.ok) { toast.error(res.error); return }
                setCreds({ rtmpUrl: res.rtmpUrl, streamKey: res.streamKey })
            })}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
        >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            Show streaming credentials
        </button>
    )
}

export function EndStreamButton({ liveStreamId }: { liveStreamId: string })
{
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    return (
        <button
            type="button"
            disabled={pending}
            onClick={() =>
            {
                if (!window.confirm('End this stream for everyone? The stream key will stop working.')) return
                startTransition(async () =>
                {
                    const res = await endLiveStream(liveStreamId)
                    if (!res.ok) { toast.error(res.error); return }
                    toast.success('Stream ended. The replay will appear once Mux finishes processing it.')
                    router.refresh()
                })
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/15 disabled:opacity-50"
        >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
            End stream
        </button>
    )
}
