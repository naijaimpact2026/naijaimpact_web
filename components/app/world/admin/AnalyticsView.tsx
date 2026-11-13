import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Coins, Hourglass, Inbox, Users, Zap, type LucideIcon } from 'lucide-react'
import type { AnalyticsView as Data, Rate } from '@/lib/world/analytics'
import type { PathwayView } from '@/lib/world/types'
import { DAY_NAMES, KIND_META } from '@/lib/world/ui'

/*
 * Admin analytics (server component). Charts follow the dataviz rules:
 * pathway colours are the two categorical slots (validated light + dark),
 * text stays in text tokens, every chart has a legend + table view, and
 * target status uses an icon + label, never colour alone.
 */

const nf = (n: number) => n.toLocaleString('en-NG')
const pct = (r: Rate | null) => (r && r.pct !== null ? `${r.pct}%` : '—')
const dayLabel = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export default function AnalyticsView({ slug, name, data, pathways }: { slug: string; name: string; data: Data; pathways: PathwayView[] })
{
    const col = (k: string) => pathways.find((p) => p.key === k)?.color ?? '#64748B'
    const label = (k: string) => pathways.find((p) => p.key === k)?.name ?? k

    return (
        <div className="space-y-6">
            <Link href={`/app/competitions/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {name}
            </Link>
            <header className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h1 className="text-xl font-extrabold text-foreground sm:text-2xl">Analytics</h1>
                    <p className="text-sm text-muted-foreground">
                        {data.clock.phase === 'running' ? `Week ${data.clock.week}, ${DAY_NAMES[(data.clock.day ?? 1) - 1]}` : data.clock.phase === 'upcoming' ? 'Semester not started' : 'Semester ended'}
                        {' · '}updated {new Date(data.generatedAt).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' })} Lagos time
                    </p>
                </div>
            </header>

            {/* Pilot targets */}
            <section aria-label="Pilot targets" className="grid gap-3 sm:grid-cols-3">
                <Target title="Finish onboarding" rate={data.onboarding} target={data.targets.onboarding} hint="Joined and completed their Week 1 Day 1 mission" />
                <Target title="Still active in week 4" rate={data.week4} target={data.targets.week4} hint="Submitted in week 4, of those who joined before it" notYet="Shows from week 4" />
                <Target title="Complete the stage" rate={data.stage} target={data.targets.stage} hint="Stage 1 passed: score 60+ and the finale passed" notYet="Shows after week 4" />
            </section>

            {/* KPI row */}
            <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile icon={Users} label="Joined" value={nf(data.joined.total)} sub={pathways.map((p) => `${p.name.split(' ')[0]} ${nf(data.joined[p.key])}`).join(' · ')} />
                <Tile icon={Zap} label="Active this week" value={pct(data.activeThisWeek)} sub={`${nf(data.activeThisWeek.count)} of ${nf(data.activeThisWeek.of)} students`} />
                <Tile icon={Inbox} label="Review queue" value={nf(data.review.queue)} sub={`avg wait ${data.review.avgWaitHours ?? 0}h · ${data.review.appeals} appeals · judged in ${data.review.avgTurnaroundHours ?? '—'}h (14 days)`} href="/app/competitions/judging" />
                <Tile icon={Coins} label="HubTokens" value={nf(data.tokens.earned)} sub={`earned · ${nf(data.tokens.redeemed - data.tokens.refunded)} redeemed (net of ${nf(data.tokens.refunded)} refunded)`} />
            </section>

            {/* Sign-ups per day */}
            <section className="space-y-3 rounded-3xl border border-border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-foreground">Sign-ups per day</h2>
                    <Legend items={pathways.map((p) => ({ label: p.name, color: p.color }))} />
                </div>
                <SignupChart rows={data.signupsByDay} keys={pathways.map((p) => p.key)} color={col} label={label} />
                <details className="text-sm">
                    <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Show as a table</summary>
                    <div className="mt-2 max-h-72 overflow-auto">
                        <table className="w-full text-left text-xs tabular-nums">
                            <thead className="sticky top-0 bg-card text-muted-foreground"><tr><th className="py-1 pr-3 font-semibold">Day</th>{pathways.map((p) => <th key={p.key} className="py-1 pr-3 font-semibold">{p.name}</th>)}<th className="py-1 font-semibold">Total</th></tr></thead>
                            <tbody>
                                {[...data.signupsByDay].reverse().map((r) => (
                                    <tr key={r.date} className="border-t border-border"><td className="py-1 pr-3">{dayLabel(r.date)}</td>{pathways.map((p) => <td key={p.key} className="py-1 pr-3">{r[p.key]}</td>)}<td className="py-1 font-semibold">{r.career + r.enterprise}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            </section>

            {/* By school */}
            <section className="space-y-3 rounded-3xl border border-border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-foreground">Sign-ups by school</h2>
                    <Legend items={pathways.map((p) => ({ label: p.name, color: p.color }))} />
                </div>
                {data.bySchool.length === 0 ? <p className="text-sm text-muted-foreground">No sign-ups yet.</p> : (
                    <div className="max-h-96 overflow-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-card text-xs text-muted-foreground"><tr><th className="py-1.5 pr-3 font-semibold">School</th><th className="w-1/3 py-1.5 pr-3 font-semibold"><span className="sr-only">Split</span></th>{pathways.map((p) => <th key={p.key} className="py-1.5 pr-3 text-right font-semibold">{p.name.split(' ')[0]}</th>)}<th className="py-1.5 text-right font-semibold">Total</th></tr></thead>
                            <tbody className="tabular-nums">
                                {data.bySchool.map((s) => (
                                    <tr key={s.institutionId ?? 'none'} className="border-t border-border">
                                        <td className="max-w-[16rem] truncate py-1.5 pr-3 text-foreground" title={s.name}>{s.name}</td>
                                        <td className="py-1.5 pr-3">
                                            <div className="flex h-2 w-full gap-[2px]" style={{ maxWidth: `${(s.total / data.bySchool[0].total) * 100}%` }}>
                                                {pathways.map((p) => s[p.key] > 0 && <span key={p.key} className="h-full rounded-[2px]" style={{ flex: s[p.key], backgroundColor: p.color }} />)}
                                            </div>
                                        </td>
                                        {pathways.map((p) => <td key={p.key} className="py-1.5 pr-3 text-right text-muted-foreground">{s[p.key]}</td>)}
                                        <td className="py-1.5 text-right font-semibold text-foreground">{s.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Per mission */}
            <section className="space-y-3 rounded-3xl border border-border bg-card p-4 sm:p-5">
                <h2 className="text-base font-bold text-foreground">Missions so far</h2>
                <p className="text-xs text-muted-foreground">Started = students with at least one submission · Submitted = all submissions, retries included · Passed = students who passed. Opening a mission isn’t tracked.</p>
                {data.missions.length === 0 ? <p className="text-sm text-muted-foreground">No missions have opened yet.</p> : (
                    <div className="max-h-[32rem] overflow-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-card text-xs text-muted-foreground"><tr><th className="py-1.5 pr-3 font-semibold">When</th><th className="py-1.5 pr-3 font-semibold">Mission</th><th className="py-1.5 pr-3 text-right font-semibold">Started</th><th className="py-1.5 pr-3 text-right font-semibold">Submitted</th><th className="py-1.5 pr-3 text-right font-semibold">Passed</th><th className="py-1.5 text-right font-semibold">Pass rate</th></tr></thead>
                            <tbody className="tabular-nums">
                                {data.missions.map((m) => (
                                    <tr key={m.id} className="border-t border-border">
                                        <td className="whitespace-nowrap py-1.5 pr-3 text-xs text-muted-foreground">W{m.week} {DAY_NAMES[m.day - 1]}</td>
                                        <td className="py-1.5 pr-3">
                                            <span className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: col(m.pathway) }} title={label(m.pathway)} />
                                                <span className="truncate text-foreground">{m.title}</span>
                                                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{KIND_META[m.kind].label}</span>
                                            </span>
                                        </td>
                                        <td className="py-1.5 pr-3 text-right">{m.started}</td>
                                        <td className="py-1.5 pr-3 text-right text-muted-foreground">{m.submitted}</td>
                                        <td className="py-1.5 pr-3 text-right">{m.passed}</td>
                                        <td className="py-1.5 text-right font-semibold text-foreground">{m.started ? `${Math.round((m.passed / m.started) * 100)}%` : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}

function Target({ title, rate, target, hint, notYet }: { title: string; rate: Rate | null; target: number; hint: string; notYet?: string })
{
    const ready = rate !== null && rate.pct !== null
    const met = ready && rate!.pct! >= target
    const Icon = !ready ? Clock : met ? CheckCircle2 : AlertTriangle
    const status = !ready ? (notYet ?? 'No data yet') : met ? 'On target' : 'Below target'
    const tone = !ready ? 'bg-muted text-muted-foreground' : met ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/15 text-red-700 dark:text-red-300'
    return (
        <div className="space-y-2 rounded-3xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}><Icon className="h-3.5 w-3.5" />{status}</span>
            </div>
            <p className="text-3xl font-extrabold tabular-nums text-foreground">{ready ? `${rate!.pct}%` : '—'}<span className="ml-2 text-sm font-semibold text-muted-foreground">target {target}%+</span></p>
            {/* Bullet bar: progress against the target marker. */}
            <div className="relative h-2 rounded-full bg-muted" aria-hidden>
                {ready && <div className="h-2 rounded-full bg-foreground/70" style={{ width: `${Math.min(100, rate!.pct!)}%` }} />}
                <span className="absolute -top-1 h-4 w-0.5 rounded bg-foreground" style={{ left: `${target}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{ready ? `${nf(rate!.count)} of ${nf(rate!.of)}. ` : ''}{hint}</p>
        </div>
    )
}

function Tile({ icon: Icon, label, value, sub, href }: { icon: LucideIcon; label: string; value: string; sub: string; href?: string })
{
    const body = (
        <>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">{value}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{sub}</p>
        </>
    )
    return href
        ? <Link href={href} className="hw-press block rounded-3xl border border-border bg-card p-4 hover:bg-muted/50">{body}</Link>
        : <div className="rounded-3xl border border-border bg-card p-4">{body}</div>
}

function Legend({ items }: { items: { label: string; color: string }[] })
{
    return (
        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {items.map((i) => <li key={i.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: i.color }} />{i.label}</li>)}
        </ul>
    )
}

/** Stacked daily bars (2px gaps, rounded top), hover tooltip per day, sparse date labels. */
function SignupChart({ rows, keys, color, label }: { rows: Data['signupsByDay']; keys: ('career' | 'enterprise')[]; color: (k: string) => string; label: (k: string) => string })
{
    if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No sign-ups yet.</p>
    const max = Math.max(1, ...rows.map((r) => r.career + r.enterprise))
    const every = Math.max(1, Math.ceil(rows.length / 8))
    return (
        <div className="flex gap-2">
            <div className="flex h-44 flex-col justify-between py-0 text-right text-[10px] tabular-nums text-muted-foreground" aria-hidden>
                <span>{max}</span><span>{Math.round(max / 2)}</span><span>0</span>
            </div>
            <div className="min-w-0 flex-1">
                <div className="relative flex h-44 items-end gap-[2px] border-b border-border" role="img" aria-label={`Sign-ups per day for the last ${rows.length} days; table below.`}>
                    <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border/70" aria-hidden />
                    {rows.map((r) =>
                    {
                        const total = r.career + r.enterprise
                        return (
                            <div key={r.date} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
                                <div className="flex flex-col-reverse gap-[2px]" style={{ height: `${(total / max) * 100}%` }}>
                                    {keys.map((k, i) => r[k] > 0 && (
                                        <span key={k} className={i === keys.length - 1 || keys.slice(i + 1).every((x) => r[x] === 0) ? 'rounded-t-[4px]' : ''} style={{ flex: r[k], backgroundColor: color(k), minHeight: 2 }} />
                                    ))}
                                </div>
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-md group-hover:block">
                                    <p className="font-semibold">{dayLabel(r.date)} · {total}</p>
                                    {keys.map((k) => <p key={k} className="flex items-center gap-1"><span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color(k) }} />{label(k)} {r[k]}</p>)}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="mt-1 flex gap-[2px] text-[10px] text-muted-foreground" aria-hidden>
                    {rows.map((r, i) => <span key={r.date} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">{i % every === 0 ? dayLabel(r.date) : ''}</span>)}
                </div>
            </div>
        </div>
    )
}
