'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Eye, EyeOff, GraduationCap, Loader2, Radio, Sparkles, Square, Ticket } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/toast'
import { createLiveStream, endLiveStream, getLiveStreamKey } from '@/lib/actions/modushive'

const STREAM_CATEGORIES = [
    'Entertainment',
    'Music',
    'Education',
    'Sports',
    'Faith',
    'News',
    'Lifestyle',
    'Technology',
]

const TICKET_PRESETS = [1000, 2500, 5000, 10000]

export function GoLiveForm()
{
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('Education')
    const [description, setDescription] = useState('')
    const [streamType, setStreamType] = useState<'free' | 'paid'>('free')
    const [presetPrice, setPresetPrice] = useState<number>(2500)
    const [customPrice, setCustomPrice] = useState<string>('')
    const [topicsInput, setTopicsInput] = useState<string>('')
    const [pending, startTransition] = useTransition()

    const effectivePrice = customPrice ? Number(customPrice) || 0 : presetPrice
    const creatorNet = Math.round(effectivePrice * 0.9)
    const fee10 = effectivePrice - creatorNet

    function handleSubmit(e: React.FormEvent)
    {
        e.preventDefault()
        if (streamType === 'paid' && effectivePrice < 500) {
            toast.error('Minimum ticket price for paid workshops is ₦500')
            return
        }

        startTransition(async () =>
        {
            const taggedDescription = category
                ? `[${category}] ${description.trim()}`.trim()
                : description.trim()

            const workshopTopics = topicsInput
                .split(/[\n,]/)
                .map((t) => t.trim())
                .filter(Boolean)

            const res = await createLiveStream({
                title,
                description: taggedDescription,
                isPaid: streamType === 'paid',
                ticketPrice: streamType === 'paid' ? effectivePrice : 0,
                workshopTopics: streamType === 'paid' ? workshopTopics : [],
            })

            if (!res.ok) { toast.error(res.error); return }
            toast.success(
                streamType === 'paid'
                    ? 'Paid workshop studio ready! Attendees will be paywalled with tickets.'
                    : 'Live stream studio ready! Turn on your camera and click Go Live.'
            )
            setTitle('')
            setDescription('')
            setCustomPrice('')
            setTopicsInput('')
            router.refresh()
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            {/* Stream Format Selector */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Broadcast format</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setStreamType('free')}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs sm:text-sm font-semibold transition-all ${
                            streamType === 'free'
                                ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30'
                                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                        <Radio className="h-4 w-4 shrink-0" />
                        <span>Free Public Stream</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setStreamType('paid')
                            if (category === 'Entertainment') setCategory('Education')
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs sm:text-sm font-semibold transition-all ${
                            streamType === 'paid'
                                ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-amber-500/30'
                                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                        <Ticket className="h-4 w-4 shrink-0 text-amber-500" />
                        <span>Paid Mini-Class / Workshop</span>
                    </button>
                </div>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="stream-title" className="text-sm font-medium text-foreground">
                    {streamType === 'paid' ? 'Workshop / Masterclass title' : 'Stream title'}
                </label>
                <Input
                    id="stream-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    required
                    disabled={pending}
                    placeholder={streamType === 'paid' ? 'e.g. Mastering Next.js 15 & High-Value Freelancing' : "e.g. Founders' Friday Q&A"}
                />
            </div>

            {/* Paid Workshop Controls */}
            {streamType === 'paid' && (
                <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                            <Ticket className="h-3.5 w-3.5" /> Ticket Pricing (NGN)
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">90/10 Creator Split</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                        {TICKET_PRESETS.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => {
                                    setPresetPrice(p)
                                    setCustomPrice('')
                                }}
                                className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                                    effectivePrice === p && !customPrice
                                        ? 'bg-amber-500 text-white shadow-sm'
                                        : 'border border-amber-500/20 bg-background/80 text-foreground hover:bg-amber-500/15'
                                }`}
                            >
                                ₦{p.toLocaleString('en-NG')}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="500"
                            step="500"
                            placeholder="Custom ticket amount (min ₦500)"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            disabled={pending}
                            className="text-xs bg-background"
                        />
                    </div>

                    {/* Dynamic Payout Transparency Card */}
                    <div className="rounded-lg bg-card/80 border border-border p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-muted-foreground">
                            <span>Ticket Price:</span>
                            <span className="font-semibold text-foreground">₦{effectivePrice.toLocaleString('en-NG')}</span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                            <span>Platform & Gateway Cost (10%):</span>
                            <span>-₦{fee10.toLocaleString('en-NG')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-border/60 text-xs font-bold">
                            <span className="text-foreground">Your 90% Net Take-Home:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                                +₦{creatorNet.toLocaleString('en-NG')} / attendee
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground pt-1">
                            Earnings credit immediately into your Hubnovo Wallet balance upon each ticket purchase.
                        </p>
                    </div>

                    {/* Workshop Topics / Syllabus */}
                    <div className="space-y-1.5 pt-1">
                        <label htmlFor="stream-topics" className="text-xs font-semibold text-foreground">
                            Learning Topics & Syllabus <span className="text-muted-foreground font-normal">(comma-separated)</span>
                        </label>
                        <Input
                            id="stream-topics"
                            value={topicsInput}
                            onChange={(e) => setTopicsInput(e.target.value)}
                            disabled={pending}
                            placeholder="e.g. Intro, UI Systems, Supabase Auth, Live Q&A"
                            className="text-xs bg-background"
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <div className="flex flex-wrap gap-2 pt-1">
                    {STREAM_CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                                category === cat
                                    ? 'bg-destructive text-white shadow-sm'
                                    : 'border border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="stream-description" className="text-sm font-medium text-foreground">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea id="stream-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} disabled={pending} placeholder="What will attendees learn or experience during this session?" />
            </div>
            <button
                type="submit"
                disabled={pending || !title.trim()}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${
                    streamType === 'paid' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-destructive'
                }`}
            >
                {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : streamType === 'paid' ? (
                    <Ticket className="h-4 w-4" />
                ) : (
                    <Radio className="h-4 w-4" />
                )}
                {streamType === 'paid' ? 'Create Paid Workshop' : 'Create live stream'}
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

/** Stream key is fetched on demand (host/admin-only action), never rendered into the page HTML. */
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
    const [open, setOpen] = useState(false)
    const [pending, startTransition] = useTransition()

    function handleEnd()
    {
        startTransition(async () =>
        {
            const res = await endLiveStream(liveStreamId)
            if (!res.ok) { toast.error(res.error); return }
            toast.success('Stream ended successfully.')
            setOpen(false)
            router.refresh()
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <button
                    type="button"
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/15 disabled:opacity-50"
                >
                    {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
                    End stream
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-base font-bold text-foreground">End this live stream?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-muted-foreground">
                        This will end the broadcast for all viewers. The stream key will stop working, and the recording will process into a replay video.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel disabled={pending} className="rounded-full">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={pending}
                        onClick={(e) =>
                        {
                            e.preventDefault()
                            handleEnd()
                        }}
                        className="rounded-full bg-destructive text-white hover:bg-destructive/90"
                    >
                        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                        End stream
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
