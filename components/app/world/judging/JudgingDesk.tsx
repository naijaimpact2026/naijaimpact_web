'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronDown, Coins, Gavel, Inbox, Loader2, MessageSquareQuote, RotateCcw, Scale, Sparkles, XCircle, Zap } from 'lucide-react'
import { toast } from '@/components/toast'
import { reviewWorldAttemptAction } from '@/lib/actions/world'
import type { ReviewCounts, ReviewQueueItem } from '@/lib/world/service'
import { TOKENS_LABEL, XP_LABEL, type Pathway } from '@/lib/world/types'
import { DAY_LONG, KIND_META, STATUS_META } from '@/lib/world/ui'
import SubmissionView from './SubmissionView'

const PATHWAY: Record<Pathway, { label: string; color: string }> = {
    career: { label: 'Career', color: '#2563EB' },
    enterprise: { label: 'Enterprise', color: '#16A34A' },
}

const FLAG_LABEL: Record<string, string> = {
    personal_data: 'May contain personal data about other people',
    unsafe: 'May contain unsafe content',
}

const QUICK_FEEDBACK = [
    'Clear and well evidenced. Great work this week.',
    'Use more evidence from your daily missions (numbers, quotes, what you tested).',
    'Be more specific: say exactly what you will do next and by when.',
    'Remove names and contact details of other people, then resubmit.',
]

type Tab = 'queue' | 'appeals'

export default function JudgingDesk({ tab, items: initial, counts }: { tab: Tab; items: ReviewQueueItem[]; counts: ReviewCounts })
{
    const [items, setItems] = useState(initial)
    const [done, setDone] = useState(0)
    const [filter, setFilter] = useState<'all' | Pathway>('all')
    const shown = useMemo(() => items.filter((i) => filter === 'all' || i.mission.pathway === filter), [items, filter])
    const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.attemptId ?? null)
    const [mobileDetail, setMobileDetail] = useState(false)
    const selected = shown.find((i) => i.attemptId === selectedId) ?? shown[0] ?? null

    function finished(id: string)
    {
        const idx = shown.findIndex((i) => i.attemptId === id)
        const next = shown[idx + 1] ?? shown[idx - 1] ?? null
        setItems((xs) => xs.filter((x) => x.attemptId !== id))
        setSelectedId(next?.attemptId ?? null)
        setDone((n) => n + 1)
        if (!next) setMobileDetail(false)
    }

    return (
        <div className="space-y-4">
            <header className="hw-rise flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-extrabold text-foreground sm:text-2xl"><Gavel className="h-6 w-6 text-primary" /> Judging</h1>
                    <p className="text-sm text-muted-foreground">Score Sunday boss challenges, the Week 4 finale, flagged work and appeals. Oldest first.</p>
                </div>
                {done > 0 && <p className="hw-pop rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">{done} scored this session</p>}
            </header>

            <div className="flex flex-wrap items-center gap-2">
                <TabLink href="/app/competitions/judging" active={tab === 'queue'} label="To score" count={counts.inReview} />
                <TabLink href="/app/competitions/judging?tab=appeals" active={tab === 'appeals'} label="Appeals" count={counts.appeals} />
                <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
                {(['all', 'career', 'enterprise'] as const).map((f) => (
                    <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={`hw-press rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${filter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                        {f === 'all' ? 'All pathways' : PATHWAY[f].label}
                    </button>
                ))}
            </div>

            {shown.length === 0 ? (
                <section className="hw-rise rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                    <Inbox className="mx-auto h-9 w-9 text-muted-foreground" />
                    <h2 className="mt-3 text-base font-bold text-foreground">{tab === 'appeals' ? 'No open appeals' : 'Nothing waiting to be scored'}</h2>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                        {tab === 'appeals' ? 'When a student appeals a result, it shows up here.' : 'Sunday boss challenges and the Week 4 finale land here once students submit them.'}
                    </p>
                </section>
            ) : (
                <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                    {/* Queue */}
                    <ul className={`space-y-2 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 ${mobileDetail ? 'hidden lg:block' : ''}`}>
                        {shown.map((i, n) =>
                        {
                            const active = selected?.attemptId === i.attemptId
                            const name = i.user.displayName ?? i.user.username ?? 'Student'
                            const Kind = KIND_META[i.mission.kind].icon
                            return (
                                <li key={i.attemptId} className="hw-rise" style={{ animationDelay: `${Math.min(n, 10) * 40}ms` }}>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedId(i.attemptId); setMobileDetail(true) }}
                                        className={`hw-lift w-full rounded-2xl border p-3 text-left transition-colors ${active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:bg-muted/50'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Initials name={name} url={i.user.avatarUrl} color={PATHWAY[i.mission.pathway].color} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-foreground">{name}</p>
                                                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><Kind className="h-3 w-3 shrink-0" /> {i.mission.title}</p>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                                                    <span className="rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: PATHWAY[i.mission.pathway].color }}>{PATHWAY[i.mission.pathway].label}</span>
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Week {i.mission.week}</span>
                                                    {i.aiSuggestion.score !== null && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">AI {Math.round(i.aiSuggestion.score)}</span>}
                                                    {i.flags.length > 0 && <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/15 px-2 py-0.5 text-red-700 dark:text-red-300"><AlertTriangle className="h-2.5 w-2.5" /> Flagged</span>}
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(i.createdAt))}</span>
                                        </div>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>

                    {/* Detail */}
                    {selected && (
                        <div className={mobileDetail ? '' : 'hidden lg:block'}>
                            <button type="button" onClick={() => setMobileDetail(false)} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground lg:hidden">
                                <ArrowLeft className="h-4 w-4" /> Back to the queue
                            </button>
                            <ReviewPanel key={selected.attemptId} item={selected} appeal={tab === 'appeals'} onDone={finished} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function TabLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number })
{
    return (
        <Link href={href} className={`hw-press inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card text-foreground ring-1 ring-border hover:bg-muted'}`}>
            {label}
            <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${active ? 'bg-white/25' : 'bg-muted'}`}>{count}</span>
        </Link>
    )
}

function Initials({ name, url, color }: { name: string; url: string | null; color: string })
{
    if (url)
        // eslint-disable-next-line @next/next/no-img-element -- small avatar from storage
        return <img src={url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border" />
    return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: color }}>{name.slice(0, 2).toUpperCase()}</span>
}

// ─── One submission ──────────────────────────────────────────────────────────

function ReviewPanel({ item, appeal, onDone }: { item: ReviewQueueItem; appeal: boolean; onDone: (id: string) => void })
{
    const rubric = item.rubric
    const start = (): Record<string, number> =>
        Object.fromEntries((rubric?.criteria ?? []).map((c) => [c.id, item.current.rubricScores?.[c.id] ?? 0]))
    const [scores, setScores] = useState<Record<string, number>>(start)
    const [touched, setTouched] = useState(Boolean(item.current.rubricScores))
    const [feedback, setFeedback] = useState('')
    const [busy, setBusy] = useState<string | null>(null)
    const [confirmReject, setConfirmReject] = useState(false)
    const [briefOpen, setBriefOpen] = useState(false)

    const weight = rubric?.criteria.reduce((s, c) => s + c.weight, 0) || 1
    const total = rubric ? Math.round(rubric.criteria.reduce((s, c) => s + (scores[c.id] ?? 0) * c.weight, 0) / weight) : 0
    const passMark = rubric?.passMark ?? 60
    const canPass = Boolean(rubric) && touched && total >= passMark
    const name = item.user.displayName ?? item.user.username ?? 'Student'
    const p = PATHWAY[item.mission.pathway]
    const Kind = KIND_META[item.mission.kind].icon
    const ai = item.aiSuggestion
    const aiCriteria = ai.criteria && rubric ? rubric.criteria.every((c) => typeof ai.criteria?.[c.id] === 'number') : false

    async function submit(decision: 'pass' | 'revise' | 'reject', appealOutcome?: 'upheld' | 'dismissed')
    {
        if (appealOutcome !== 'dismissed')
        {
            if (feedback.trim().length < 5) { toast.error('Write a short note for the student first.'); return }
            if (decision !== 'reject' && !touched) { toast.error('Score each rubric item first.'); return }
        }
        setBusy(appealOutcome === 'dismissed' ? 'dismiss' : decision)
        const r = await reviewWorldAttemptAction({
            attemptId: item.attemptId, decision, feedback: feedback.trim() || 'Appeal reviewed.',
            rubricScores: decision === 'reject' ? undefined : scores,
            ...(appeal ? { appeal: appealOutcome ?? 'upheld' } : {}),
        })
        setBusy(null)
        if (!r.ok) { toast.error(r.error); return }
        if (appealOutcome === 'dismissed') toast.success('Appeal dismissed. The original result stands.')
        else if (decision === 'pass') toast.success(`Passed with ${r.score}${r.awarded.xp ? ` · +${r.awarded.xp} ${XP_LABEL} · +${r.awarded.tokens} ${TOKENS_LABEL}` : ''}`)
        else if (decision === 'revise') toast.success(`Sent back for revision${r.score !== null ? ` (scored ${r.score})` : ''}`)
        else toast.success('Marked as not accepted')
        onDone(item.attemptId)
    }

    return (
        <article className="hw-rise space-y-4">
            {/* Who + what */}
            <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: p.color }}><Kind className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: p.color }}>{p.label} · Week {item.mission.week} · {DAY_LONG[item.mission.day - 1]} · {KIND_META[item.mission.kind].label}</p>
                        <h2 className="text-lg font-extrabold leading-tight text-foreground">{item.mission.title}</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {name}{item.user.username ? ` (@${item.user.username})` : ''} · attempt {item.attemptNo} · submitted {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="flex gap-1.5 text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-amber-700 dark:text-amber-300"><Zap className="h-3 w-3" />{item.mission.xp}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-1 text-violet-700 dark:text-violet-300"><Coins className="h-3 w-3" />{item.mission.tokens}</span>
                    </div>
                </div>
                {item.mission.story && (
                    <div className="mt-3">
                        <button type="button" onClick={() => setBriefOpen((v) => !v)} className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${briefOpen ? 'rotate-180' : ''}`} /> What the student was asked
                        </button>
                        {briefOpen && <p className="hw-rise mt-2 rounded-2xl bg-muted/60 p-3 text-sm leading-relaxed text-foreground">{item.mission.story}</p>}
                    </div>
                )}
            </section>

            {item.flags.length > 0 && (
                <section className="hw-shake flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                        <p className="font-bold">The AI flagged this submission</p>
                        <ul className="mt-0.5 list-disc pl-4 text-xs">{item.flags.map((f) => <li key={f}>{FLAG_LABEL[f] ?? f}</li>)}</ul>
                        <p className="mt-1 text-xs opacity-80">If it includes names or contact details of other people, ask for a revision.</p>
                    </div>
                </section>
            )}

            {appeal && (
                <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm">
                    <p className="flex items-center gap-1.5 font-bold text-sky-800 dark:text-sky-200"><Scale className="h-4 w-4" /> Appeal</p>
                    <p className="mt-1 whitespace-pre-wrap text-foreground">{item.appeal.reason ?? 'No reason given.'}</p>
                    <div className="mt-3 rounded-xl bg-background/70 p-3 text-xs">
                        <p className="font-bold text-muted-foreground">Result being appealed</p>
                        <p className="mt-1 text-foreground">
                            <span className={`rounded-full px-2 py-0.5 font-bold ${STATUS_META[item.current.status].tone}`}>{STATUS_META[item.current.status].label}</span>
                            {item.current.score !== null && <span className="ml-2 font-bold tabular-nums">{Math.round(item.current.score)}/100</span>}
                        </p>
                        {item.current.feedback && <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground">“{item.current.feedback}”</p>}
                    </div>
                </section>
            )}

            {/* The work */}
            <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
                <h3 className="mb-3 text-sm font-bold text-foreground">Submission</h3>
                <SubmissionView item={item} />
            </section>

            {/* AI suggestion */}
            {(ai.score !== null || ai.feedback) && (
                <section className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Sparkles className="h-4 w-4 text-amber-500" /> AI suggestion {ai.score !== null && <span className="tabular-nums text-amber-700 dark:text-amber-300">{Math.round(ai.score)}/100</span>}</p>
                        <div className="flex gap-2">
                            {aiCriteria && (
                                <button type="button" onClick={() => { setScores(Object.fromEntries(rubric!.criteria.map((c) => [c.id, Math.round(ai.criteria![c.id])]))); setTouched(true) }} className="hw-press rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:bg-muted">
                                    Use AI scores
                                </button>
                            )}
                            {ai.feedback && (
                                <button type="button" onClick={() => setFeedback(ai.feedback!)} className="hw-press rounded-full border border-border bg-background px-3 py-1 text-xs font-bold hover:bg-muted">
                                    Use AI feedback
                                </button>
                            )}
                        </div>
                    </div>
                    {ai.feedback && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{ai.feedback}</p>}
                    <p className="mt-2 text-[11px] text-muted-foreground">A suggestion only. You make the final call.</p>
                </section>
            )}

            {/* Score */}
            <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-foreground">{rubric ? rubric.title : 'Score'}</h3>
                    {rubric && (
                        <div className="text-right">
                            <p className={`text-2xl font-extrabold tabular-nums ${!touched ? 'text-muted-foreground' : total >= passMark ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{touched ? total : '–'}<span className="text-sm text-muted-foreground">/100</span></p>
                            <p className="text-[11px] text-muted-foreground">Pass mark {passMark}</p>
                        </div>
                    )}
                </div>
                {rubric ? (
                    <div className="mt-4 space-y-4">
                        {rubric.criteria.map((c) => (
                            <div key={c.id}>
                                <div className="flex items-baseline justify-between gap-3">
                                    <label htmlFor={`cr-${c.id}`} className="text-sm font-semibold text-foreground">{c.label} <span className="text-xs font-normal text-muted-foreground">· {Math.round((c.weight / weight) * 100)}%</span></label>
                                    <input
                                        type="number" min={0} max={100} inputMode="numeric"
                                        value={scores[c.id] ?? 0}
                                        onChange={(e) => { setScores((s) => ({ ...s, [c.id]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })); setTouched(true) }}
                                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-right text-sm font-bold tabular-nums"
                                        aria-label={`${c.label} score`}
                                    />
                                </div>
                                {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                                <input
                                    id={`cr-${c.id}`} type="range" min={0} max={100} step={5}
                                    value={scores[c.id] ?? 0}
                                    onChange={(e) => { setScores((s) => ({ ...s, [c.id]: Number(e.target.value) })); setTouched(true) }}
                                    className="mt-2 w-full accent-primary"
                                />
                                {ai.criteria?.[c.id] !== undefined && <p className="text-[11px] text-muted-foreground">AI: {Math.round(ai.criteria[c.id])}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-2 text-sm text-muted-foreground">This mission has no rubric, so it can only be marked as not accepted.</p>
                )}

                <div className="mt-5">
                    <label htmlFor="judge-feedback" className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><MessageSquareQuote className="h-4 w-4" /> Feedback for the student</label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {QUICK_FEEDBACK.map((q) => (
                            <button key={q} type="button" onClick={() => setFeedback((f) => (f.trim() ? `${f.trim()} ${q}` : q))} className="hw-press rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                                + {q.split(':')[0].split('.')[0]}
                            </button>
                        ))}
                    </div>
                    <textarea
                        id="judge-feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        placeholder="What went well, and one or two things to improve. The student sees this."
                        className="mt-2 w-full rounded-2xl border border-border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Decisions */}
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button" disabled={Boolean(busy) || !canPass} onClick={() => submit('pass')}
                        title={!canPass ? `Needs ${passMark}+ to pass` : undefined}
                        className="hw-press inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                        {busy === 'pass' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {appeal ? 'Uphold: pass' : 'Pass'}
                    </button>
                    <button
                        type="button" disabled={Boolean(busy) || !rubric} onClick={() => submit('revise')}
                        className="hw-press inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                        {busy === 'revise' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} {appeal ? 'Uphold: revise' : 'Ask to revise'}
                    </button>
                    {confirmReject ? (
                        <span className="hw-pop inline-flex items-center gap-1.5 rounded-2xl border border-red-500/40 px-2 py-1">
                            <span className="text-xs font-semibold text-red-700 dark:text-red-300">Final, no retry. Sure?</span>
                            <button type="button" disabled={Boolean(busy)} onClick={() => submit('reject')} className="hw-press inline-flex items-center gap-1 rounded-xl bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-700">
                                {busy === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Yes
                            </button>
                            <button type="button" onClick={() => setConfirmReject(false)} className="rounded-xl px-2 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground">No</button>
                        </span>
                    ) : (
                        <button type="button" disabled={Boolean(busy)} onClick={() => setConfirmReject(true)} className="hw-press inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-500/10 disabled:opacity-50">
                            <XCircle className="h-4 w-4" /> Not accepted
                        </button>
                    )}
                    {appeal && (
                        <button type="button" disabled={Boolean(busy)} onClick={() => submit('reject', 'dismissed')} className="hw-press inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-50">
                            {busy === 'dismiss' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />} Dismiss appeal
                        </button>
                    )}
                </div>
                {rubric && touched && total < passMark && <p className="mt-2 text-xs text-muted-foreground">Below the pass mark, so this can only be sent back for revision or not accepted.</p>}
                <p className="mt-2 text-[11px] text-muted-foreground">Passing awards {item.mission.xp} {XP_LABEL} + {item.mission.tokens} {TOKENS_LABEL}{item.mission.kind === 'boss' ? ' and the weekly badge' : ''}, once.</p>
            </section>
        </article>
    )
}
