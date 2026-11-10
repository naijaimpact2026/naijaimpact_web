'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, Award, Coins, Flag, Hourglass, Loader2, RotateCcw, Zap } from 'lucide-react'
import { toast } from '@/components/toast'
import { appealWorldAttemptAction } from '@/lib/actions/world'
import { TOKENS_LABEL, XP_LABEL, type AttemptView, type MissionView } from '@/lib/world/types'
import { STATUS_META } from '@/lib/world/ui'

interface Props
{
    slug: string
    mission: MissionView
    attempt: AttemptView
    awarded?: { xp: number; tokens: number } | null
    badge?: { key: string; label: string } | null
    color: string
    canRetry: boolean
    onRetry: () => void
    homeHref: string
}

const HEADLINE = {
    passed: 'Mission complete!',
    needs_revision: 'Almost there',
    in_review: 'Submitted for review',
    rejected: 'Not accepted',
} as const

export default function AttemptResult({ slug, mission, attempt, awarded, badge, color, canRetry, onRetry, homeHref }: Props)
{
    const status = STATUS_META[attempt.status]
    const passMark = mission.rubric?.passMark ?? 60
    const attemptsLeft = mission.maxAttempts - mission.attemptsUsed

    return (
        <section className="space-y-4 rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm" aria-live="polite">
            {badge && (
                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-500/5 p-4 motion-safe:animate-in motion-safe:zoom-in-95">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-md"><Award className="h-6 w-6" /></span>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Badge unlocked</p>
                        <p className="text-base font-extrabold text-foreground">{badge.label}</p>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4">
                {attempt.score !== null ? <ScoreRing score={attempt.score} passMark={passMark} color={attempt.status === 'passed' ? '#16A34A' : '#D97706'} /> : (
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300"><Hourglass className="h-8 w-8" /></span>
                )}
                <div className="min-w-0">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.tone}`}><status.icon className="h-3.5 w-3.5" />{status.label}</span>
                    <h2 className="mt-1.5 text-xl font-extrabold text-foreground">{HEADLINE[attempt.status]}</h2>
                    <p className="text-xs text-muted-foreground">Attempt {attempt.attemptNo} of {mission.maxAttempts}{attempt.score !== null ? ` · pass mark ${passMark}` : ''}</p>
                </div>
            </div>

            {awarded && (awarded.xp > 0 || awarded.tokens > 0) && (
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-sm font-extrabold text-amber-700 dark:text-amber-300"><Zap className="h-4 w-4" />+{awarded.xp} {XP_LABEL}</span>
                    {awarded.tokens > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-sm font-extrabold text-amber-700 dark:text-amber-300"><Coins className="h-4 w-4" />+{awarded.tokens} {TOKENS_LABEL}</span>}
                </div>
            )}

            {attempt.feedback && <p className="whitespace-pre-wrap rounded-2xl bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground">{attempt.feedback}</p>}

            {attempt.rubricScores && mission.rubric && (
                <ul className="space-y-2">
                    {mission.rubric.criteria.map((c) =>
                    {
                        const v = attempt.rubricScores?.[c.id]
                        if (v === undefined) return null
                        return (
                            <li key={c.id} className="space-y-1">
                                <div className="flex items-baseline justify-between gap-2 text-xs">
                                    <span className="font-semibold text-foreground">{c.label}</span>
                                    <span className="font-bold tabular-nums text-foreground">{v}</span>
                                </div>
                                <span className="block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full" style={{ width: `${v}%`, backgroundColor: color }} /></span>
                            </li>
                        )
                    })}
                </ul>
            )}

            {attempt.status === 'in_review' && (
                <p className="text-sm text-muted-foreground">
                    {mission.reviewMode === 'human' ? 'Judges score boss challenges, usually within a few days. You’ll see your score here.' : 'A reviewer will check this soon. You’ll see your score here.'}
                </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
                {canRetry && attempt.status === 'needs_revision' && (
                    <button type="button" onClick={onRetry} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white shadow-md hover:opacity-90" style={{ backgroundColor: color }}>
                        <RotateCcw className="h-4 w-4" /> Try again ({attemptsLeft} left)
                    </button>
                )}
                <Link href={homeHref} className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted">
                    Back to today <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            {(attempt.status === 'rejected' || (attempt.status === 'needs_revision' && !canRetry)) && <AppealForm slug={slug} attemptId={attempt.id} />}
        </section>
    )
}

function ScoreRing({ score, passMark, color }: { score: number; passMark: number; color: string })
{
    const r = 34, c = 2 * Math.PI * r
    return (
        <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90" aria-hidden>
                <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted" />
                <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
                <circle cx={40 + r * Math.cos((passMark / 100) * 2 * Math.PI)} cy={40 + r * Math.sin((passMark / 100) * 2 * Math.PI)} r="2.5" fill="currentColor" className="text-foreground" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold tabular-nums text-foreground" aria-label={`Score ${score} out of 100`}>{Math.round(score)}</span>
        </div>
    )
}

function AppealForm({ slug, attemptId }: { slug: string; attemptId: string })
{
    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [pending, start] = useTransition()
    const [sent, setSent] = useState(false)

    if (sent) return <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Appeal sent. A reviewer will look at it.</p>
    if (!open) return <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"><Flag className="h-3.5 w-3.5" /> Think this result is wrong? Appeal it</button>

    return (
        <div className="space-y-2 rounded-2xl border border-border p-3">
            <label htmlFor={`appeal-${attemptId}`} className="text-sm font-semibold text-foreground">Why should this be reviewed again?</label>
            <textarea id={`appeal-${attemptId}`} value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            <button
                type="button"
                disabled={pending || reason.trim().length < 10}
                onClick={() => start(async () =>
                {
                    const r = await appealWorldAttemptAction(slug, attemptId, reason)
                    if (!r.ok) { toast.error(r.error); return }
                    setSent(true)
                })}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-bold text-background disabled:opacity-40"
            >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} Send appeal
            </button>
        </div>
    )
}
