import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Coins, Swords, Timer, Trophy, Zap } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getCompetitionDetail, getMission } from '@/lib/world/service'
import { TOKENS_LABEL, XP_LABEL } from '@/lib/world/types'
import { DAY_LONG, KIND_META, REVIEW_META, STATUS_META } from '@/lib/world/ui'
import MissionPlayer from '@/components/app/world/mission/MissionPlayer'

export const dynamic = 'force-dynamic'

export default async function WorldMissionPage({ params }: { params: Promise<{ slug: string; missionId: string }> })
{
    const { slug, missionId } = await params
    const { profile } = await getCurrentUser()
    if (!profile) redirect(`/auth/login?next=/app/competitions/${slug}/missions/${missionId}`)

    const [detail, got] = await Promise.all([getCompetitionDetail(slug, profile), getMission(slug, missionId, profile)])
    if (!detail.ok) notFound()
    // Not joined yet → onboarding first.
    if (!detail.competition.me) redirect(`/app/competitions/${slug}`)
    if (!got.ok) notFound()

    const { mission: m, attempts } = got
    const color = detail.competition.pathways.find((p) => p.key === m.pathway)?.color ?? '#4B2BB8'
    const kind = KIND_META[m.kind]
    const review = REVIEW_META[m.reviewMode]
    const status = STATUS_META[m.status]
    const boss = m.kind === 'boss'
    const home = `/app/competitions/${slug}?week=${m.week}`
    const history = attempts.slice(0, -1).reverse()

    return (
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
            <Link href={home} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Week {m.week}
            </Link>

            <header className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Week {m.week} · {DAY_LONG[m.day - 1]}</span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: boss ? '#D97706' : color }}>
                        {boss ? <Swords className="h-3.5 w-3.5" /> : <kind.icon className="h-3.5 w-3.5" />}{kind.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.tone}`}><status.icon className="h-3.5 w-3.5" />{status.label}</span>
                </div>
                <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">{m.title}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{m.estMinutes} min</span>
                    <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500" />{m.xp} {XP_LABEL}</span>
                    <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-amber-500" />{m.tokens} {TOKENS_LABEL}</span>
                    <span className="inline-flex items-center gap-1"><review.icon className="h-3.5 w-3.5" />{review.label}</span>
                    {m.badge && <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-amber-500" />{m.badge.label} badge</span>}
                </div>
            </header>

            {m.story && (
                <p className="rounded-3xl px-4 py-4 text-sm leading-relaxed text-foreground sm:px-5" style={{ backgroundColor: `${color}12`, borderLeft: `4px solid ${boss ? '#D97706' : color}` }}>
                    {m.story}
                </p>
            )}

            <MissionPlayer slug={slug} mission={m} attempts={attempts} color={color} homeHref={home} />

            {m.rubric && m.status !== 'locked' && (
                <details className="rounded-2xl border border-border bg-card px-4 py-3">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground">How this is scored</summary>
                    <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                        {m.rubric.criteria.map((c) => <li key={c.id} className="flex justify-between gap-3"><span>{c.label}</span><span className="font-semibold tabular-nums">{c.weight}%</span></li>)}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">Pass mark {m.rubric.passMark}/100 · {m.maxAttempts} attempts</p>
                </details>
            )}

            {history.length > 0 && (
                <details className="rounded-2xl border border-border bg-card px-4 py-3">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground">Earlier attempts ({history.length})</summary>
                    <ul className="mt-3 space-y-2">
                        {history.map((a) => (
                            <li key={a.id} className="rounded-xl bg-muted/50 px-3 py-2 text-sm">
                                <span className="font-semibold text-foreground">Attempt {a.attemptNo}</span>
                                <span className="text-muted-foreground"> · {STATUS_META[a.status].label}{a.score !== null ? ` · ${Math.round(a.score)}` : ''}</span>
                                {a.feedback && <p className="mt-1 text-xs text-muted-foreground">{a.feedback}</p>}
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    )
}
