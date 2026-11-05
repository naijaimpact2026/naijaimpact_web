'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Check, ExternalLink, FileText, Loader2, X } from 'lucide-react'
import { toast } from '@/components/toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getProofUrl, reviewSubmission } from '@/lib/actions/competitions'
import type { PendingSubmission } from '@/lib/competitions/queries'

function Row({ s }: { s: PendingSubmission })
{
    const router = useRouter()
    const [note, setNote] = useState('')
    const [pending, startTransition] = useTransition()
    const [opening, setOpening] = useState(false)
    const name = s.user?.display_name ?? s.user?.username ?? 'Member'

    async function openFile()
    {
        setOpening(true)
        const res = await getProofUrl(s.id)
        setOpening(false)
        if (!res.ok) { toast.error(res.error); return }
        window.open(res.url, '_blank', 'noopener,noreferrer')
    }

    function decide(approve: boolean)
    {
        if (!approve && !note.trim()) { toast.error('Add a short reason so they know what to fix.'); return }
        startTransition(async () =>
        {
            const res = await reviewSubmission({ submissionId: s.id, approve, note })
            if (!res.ok) { toast.error(res.error); router.refresh(); return }
            toast.success(approve ? `Approved${res.xp ? ` · +${res.xp} XP awarded` : ''}` : 'Rejected')
            router.refresh()
        })
    }

    return (
        <li className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 ring-1 ring-border">
                    <AvatarImage src={s.user?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{s.mission?.title ?? 'Mission'} <span className="text-xs font-semibold text-amber-600">+{s.mission?.xp ?? 0} XP</span></p>
                    <p className="text-xs text-muted-foreground">
                        {name}{s.user?.username ? ` (@${s.user.username})` : ''} · {s.competition?.name ?? ''} · {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </p>
                    {s.mission?.proof_hint && <p className="mt-1 text-[11px] text-muted-foreground">Asked for: {s.mission.proof_hint}</p>}
                </div>
            </div>

            {s.note && <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground whitespace-pre-wrap">{s.note}</p>}

            <div className="flex flex-wrap gap-2">
                {s.proof_r2_key && (
                    <button type="button" onClick={openFile} disabled={opening} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                        {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} View file
                    </button>
                )}
                {s.proof_link && (
                    <a href={s.proof_link} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{s.proof_link}</span>
                    </a>
                )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    placeholder="Note to the user (required to reject)"
                    className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
                />
                <div className="flex gap-2">
                    <button type="button" disabled={pending} onClick={() => decide(false)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/40 px-4 text-sm font-bold text-destructive hover:bg-destructive/10 sm:flex-none">
                        <X className="h-4 w-4" /> Reject
                    </button>
                    <button type="button" disabled={pending} onClick={() => decide(true)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 sm:flex-none">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                    </button>
                </div>
            </div>
        </li>
    )
}

export default function ReviewQueue({ submissions }: { submissions: PendingSubmission[] })
{
    if (submissions.length === 0)
        return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing to review right now.</p>
    return <ul className="space-y-3">{submissions.map((s) => <Row key={s.id} s={s} />)}</ul>
}
