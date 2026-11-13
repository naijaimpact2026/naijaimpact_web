'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Ban, Flag, Gavel, Inbox, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { toast } from '@/components/toast'
import { handleReportAction } from '@/lib/actions/world'
import type { ReportItem, ReportStatus } from '@/lib/world/reports'
import { REPORT_REASONS } from '@/lib/world/report-reasons'
import type { ReviewCounts } from '@/lib/world/service'
import { DAY_NAMES, STATUS_META } from '@/lib/world/ui'
import { TabLink } from './JudgingDesk'

const REASON_LABEL = Object.fromEntries(REPORT_REASONS.map((r) => [r.id, r.label])) as Record<string, string>
const who = (u: { displayName: string | null; username: string | null }) => u.displayName ?? (u.username ? `@${u.username}` : 'Player')

/** Judging → Reports: player reports from the leaderboard and squads. Dismiss, or reject an attempt with a note. */
export default function ReportsDesk({ enabled, reports, counts, open, status }: { enabled: boolean; reports: ReportItem[]; counts: ReviewCounts; open: number; status: ReportStatus })
{
    const router = useRouter()
    const [done, setDone] = useState<string[]>([])
    const shown = reports.filter((r) => !done.includes(r.id))

    return (
        <div className="space-y-4">
            <header className="hw-rise">
                <h1 className="flex items-center gap-2 text-xl font-extrabold text-foreground sm:text-2xl"><Gavel className="h-6 w-6 text-primary" /> Judging</h1>
                <p className="text-sm text-muted-foreground">Player reports from leaderboards and squads. Reporters stay anonymous to the reported player.</p>
            </header>
            <div className="flex flex-wrap items-center gap-2">
                <TabLink href="/app/competitions/judging" active={false} label="To score" count={counts.inReview} />
                <TabLink href="/app/competitions/judging?tab=appeals" active={false} label="Appeals" count={counts.appeals} />
                <TabLink href="/app/competitions/judging?tab=reports" active label="Reports" count={open} />
                <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
                {(['open', 'actioned', 'dismissed'] as const).map((s) => (
                    <Link key={s} href={`/app/competitions/judging?tab=reports${s === 'open' ? '' : `&status=${s}`}`}
                        className={`hw-press rounded-full px-3 py-1.5 text-xs font-bold ${status === s ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                        {s === 'open' ? 'Open' : s === 'actioned' ? 'Actioned' : 'Dismissed'}
                    </Link>
                ))}
            </div>

            {!enabled ? (
                <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                    Reports aren’t switched on yet. Run <span className="font-mono">supabase/migrations/20261113110000_campus_reports.sql</span>.
                </p>
            ) : shown.length === 0 ? (
                <section className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                    <Inbox className="mx-auto h-9 w-9 text-muted-foreground" />
                    <h2 className="mt-3 text-base font-bold text-foreground">{status === 'open' ? 'No open reports' : 'Nothing here yet'}</h2>
                </section>
            ) : (
                <ul className="space-y-3">
                    {shown.map((r) => <ReportCard key={r.id} r={r} onDone={() => { setDone((d) => [...d, r.id]); router.refresh() }} />)}
                </ul>
            )}
        </div>
    )
}

function ReportCard({ r, onDone }: { r: ReportItem; onDone: () => void })
{
    const [mode, setMode] = useState<'dismiss' | 'reject' | null>(null)
    const [attemptId, setAttemptId] = useState(r.attempt?.id ?? r.recentAttempts.find((a) => a.status !== 'rejected')?.id ?? '')
    const [note, setNote] = useState('')
    const [busy, start] = useTransition()
    const attempts = r.attempt && !r.recentAttempts.some((a) => a.id === r.attempt!.id) ? [r.attempt, ...r.recentAttempts] : r.recentAttempts

    function submit()
    {
        if (!mode) return
        start(async () =>
        {
            const res = await handleReportAction({ reportId: r.id, action: mode === 'dismiss' ? 'dismiss' : 'reject_attempt', attemptId: mode === 'reject' ? attemptId : null, note })
            if (!res.ok) { toast.error(res.error); return }
            toast.success(mode === 'dismiss' ? 'Report dismissed.' : 'Submission rejected. The student was notified.')
            onDone()
        })
    }

    return (
        <li className="hw-rise space-y-3 rounded-3xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:text-red-300"><Flag className="h-3 w-3" />{REASON_LABEL[r.reason] ?? r.reason}</span>
                        <span className="font-bold text-foreground">{who(r.target)}</span>
                        {r.openAboutTarget > 1 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">{r.openAboutTarget} open reports</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Reported by {who(r.reporter)}{r.context ? ` from the ${r.context}` : ''} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </p>
                </div>
                {r.status !== 'open' && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">{r.status === 'actioned' ? 'Actioned' : 'Dismissed'}</span>}
            </div>
            {r.note && <p className="rounded-2xl bg-muted/50 px-3 py-2 text-sm text-foreground">“{r.note}”</p>}
            {r.resolution && <p className="text-xs text-muted-foreground">Resolution: {r.resolution}</p>}

            {attempts.length > 0 && (
                <details open={Boolean(r.attempt)} className="rounded-2xl border border-border px-3 py-2">
                    <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">{r.attempt ? 'Reported submission and recent work' : `Recent submissions (${attempts.length})`}</summary>
                    <ul className="mt-2 space-y-1">
                        {attempts.map((a) => (
                            <li key={a.id} className="flex flex-wrap items-center gap-x-2 text-xs">
                                {a.id === r.attempt?.id && <span className="rounded bg-red-500/15 px-1 font-bold text-red-700 dark:text-red-300">reported</span>}
                                <Link href={`/app/competitions/${r.competition}/missions/${a.missionId}`} className="font-semibold text-foreground hover:underline">{a.missionTitle}</Link>
                                <span className="text-muted-foreground">W{a.week ?? '?'} {a.day ? DAY_NAMES[a.day - 1] : ''} · {STATUS_META[a.status].label}{a.score !== null ? ` · ${Math.round(a.score)}` : ''} · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            {r.status === 'open' && (mode === null ? (
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setMode('dismiss')} className="hw-press inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"><ShieldCheck className="h-4 w-4" /> Dismiss</button>
                    <button onClick={() => setMode('reject')} disabled={attempts.length === 0} title={attempts.length === 0 ? 'This player has no submissions' : undefined}
                        className="hw-press inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Ban className="h-4 w-4" /> Reject a submission</button>
                </div>
            ) : (
                <div className="space-y-2 rounded-2xl bg-muted/40 p-3">
                    {mode === 'reject' && (
                        <label className="block space-y-1"><span className="text-xs font-semibold text-muted-foreground">Submission to reject</span>
                            <select value={attemptId} onChange={(e) => setAttemptId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                                {attempts.filter((a) => a.status !== 'rejected').map((a) => <option key={a.id} value={a.id}>{a.missionTitle} · {STATUS_META[a.status].label}</option>)}
                            </select></label>
                    )}
                    <label className="block space-y-1"><span className="text-xs font-semibold text-muted-foreground">{mode === 'reject' ? 'Note to the student (why it was rejected)' : 'Internal note (optional)'}</span>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} className="min-h-[60px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /></label>
                    {mode === 'reject' && <p className="text-xs text-muted-foreground">The submission stops counting towards stage scores and certificates. The student is notified and can appeal. XP and {`HubTokens`} already awarded are not removed.</p>}
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setMode(null)} disabled={busy} className="hw-press rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Back</button>
                        <button onClick={submit} disabled={busy || (mode === 'reject' && (!attemptId || note.trim().length < 5))}
                            className={`hw-press inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-white disabled:opacity-50 ${mode === 'reject' ? 'bg-red-600' : 'bg-foreground text-background'}`}>
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'reject' ? <XCircle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                            {mode === 'reject' ? 'Reject submission' : 'Dismiss report'}
                        </button>
                    </div>
                </div>
            ))}
        </li>
    )
}
