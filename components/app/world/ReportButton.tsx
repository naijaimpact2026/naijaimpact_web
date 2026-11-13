'use client'

import { useState, useTransition } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import { toast } from '@/components/toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { reportPlayerAction } from '@/lib/actions/world'
import { REPORT_REASONS, type ReportInput, type ReportReason } from '@/lib/world/report-reasons'

/** "Report" on another player (leaderboard rows, squad members). Reports go to the judging page. */
export default function ReportButton({ slug, userId, name, context, attemptId, className = '' }: {
    slug: string; userId: string; name: string; context: ReportInput['context']; attemptId?: string; className?: string
})
{
    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState<ReportReason | null>(null)
    const [note, setNote] = useState('')
    const [busy, start] = useTransition()

    function send()
    {
        if (!reason) return
        start(async () =>
        {
            const r = await reportPlayerAction(slug, { targetUserId: userId, reason, note: note.trim() || null, context, attemptId: attemptId ?? null })
            if (!r.ok) { toast.error(r.error); return }
            toast.success('Thanks. Our team will look at your report. The player won’t know who sent it.')
            setOpen(false); setReason(null); setNote('')
        })
    }

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} aria-label={`Report ${name}`} title="Report"
                className={`hw-press shrink-0 rounded-lg p-1.5 text-muted-foreground/70 hover:bg-red-500/10 hover:text-red-600 ${className}`}>
                <Flag className="h-3.5 w-3.5" />
            </button>
            <Dialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o) }}>
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Report {name}</DialogTitle>
                        <DialogDescription>Tell us what’s wrong. Reports are private: {name} won’t see who sent it.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2" role="radiogroup" aria-label="Reason">
                        {REPORT_REASONS.map((r) => (
                            <label key={r.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${reason === r.id ? 'border-red-500/60 bg-red-500/5' : 'border-border hover:bg-muted/50'}`}>
                                <input type="radio" name="reason" className="mt-1" checked={reason === r.id} onChange={() => setReason(r.id)} />
                                <span>
                                    <span className="block text-sm font-semibold text-foreground">{r.label}</span>
                                    <span className="block text-xs text-muted-foreground">{r.hint}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                    <label className="block space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground">Note {reason === 'other' ? '(required)' : '(optional)'}</span>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000}
                            className="min-h-[70px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="What happened? Don’t include anyone’s phone number or address." />
                    </label>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setOpen(false)} disabled={busy} className="hw-press rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
                        <button type="button" onClick={send} disabled={!reason || busy || (reason === 'other' && note.trim().length < 5)}
                            className="hw-press inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />} Send report
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
