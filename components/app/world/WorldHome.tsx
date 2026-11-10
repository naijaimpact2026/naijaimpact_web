import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Coins, Medal, Swords, Timer, Trophy, Zap } from 'lucide-react'
import type { User } from '@/lib/types'
import { characterPreviewUrl } from '@/lib/competitions/config'
import { getProgress, listQuests, todayQuests } from '@/lib/world/service'
import { BUCKET_WEIGHTS, TOKENS_LABEL, XP_LABEL, type CompetitionDetail, type MissionView, type ScoreBucket } from '@/lib/world/types'
import { DAY_LONG, DAY_NAMES, KIND_META, REVIEW_META, STATUS_META, formatUnlock } from '@/lib/world/ui'

/*
 * Player home for a Hubnovo World competition: who you are, today's quest,
 * this week (Mon–Sun), catch-up and your stage score. All reads go through
 * lib/world/service — the same code the mobile API uses.
 */

const BUCKET_LABEL: Record<ScoreBucket, string> = { evidence: 'Evidence', quality: 'Quality', reflection: 'Reflection', teamwork: 'Teamwork', showcase: 'Showcase' }

export default async function WorldHome({ competition: c, profile, week }: { competition: CompetitionDetail; profile: User; week?: number })
{
    const me = c.me!
    const pathway = c.pathways.find((p) => p.key === me.pathway)!
    const color = pathway.color
    const [progressRes, todayRes, weekRes] = await Promise.all([
        getProgress(c.slug, profile),
        todayQuests(c.slug, profile),
        listQuests(c.slug, profile, week),
    ])
    const progress = progressRes.ok ? progressRes.progress : null
    const today = todayRes.ok ? todayRes.today : null
    const catchUp = todayRes.ok ? todayRes.catchUp : []
    const shownWeek = weekRes.ok ? weekRes.week ?? 1 : 1
    const weekMissions = weekRes.ok ? weekRes.missions : []
    const stage = progress?.stages.find((s) => s.stage === (c.clock.stage ?? 1)) ?? progress?.stages[0]
    const base = `/app/competitions/${c.slug}`

    return (
        <div className="space-y-5">
            {/* You */}
            <section className="relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${color} 0%, #102A43 90%)` }}>
                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 shrink-0 rounded-3xl bg-white/15 p-2 sm:h-24 sm:w-24">
                        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                        <img src={characterPreviewUrl(me.avatar.character)} alt="" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">{pathway.name}{me.institution ? ` · ${me.institution.shortName ?? me.institution.name}` : ''}</p>
                        <h1 className="truncate text-xl font-extrabold sm:text-2xl">{profile.display_name ?? profile.username}</h1>
                        {progress && (
                            <>
                                <p className="text-xs font-semibold text-white/85">Level {progress.level.level} · {progress.level.name}</p>
                                <div className="h-2 max-w-sm overflow-hidden rounded-full bg-white/20">
                                    <div className="h-full rounded-full bg-white" style={{ width: `${Math.round(progress.level.progress * 100)}%` }} />
                                </div>
                                <p className="text-[11px] text-white/70">{progress.level.xpToNext > 0 ? `${progress.level.xpToNext.toLocaleString('en-NG')} ${XP_LABEL} to the next level` : 'Top level reached'}</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Stat icon={Zap} value={(progress?.xp ?? 0).toLocaleString('en-NG')} label={XP_LABEL} />
                    <Stat icon={Coins} value={(progress?.tokens ?? 0).toLocaleString('en-NG')} label={TOKENS_LABEL} />
                    <Stat icon={Medal} value={progress?.rank ? `#${progress.rank}` : '—'} label="Rank" />
                </div>
            </section>

            {/* Today */}
            <section className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-base font-bold text-foreground">Today’s quest</h2>
                    {c.clock.phase === 'running' && <span className="text-xs font-semibold text-muted-foreground">Week {c.clock.week} · {DAY_LONG[(c.clock.day ?? 1) - 1]}</span>}
                </div>
                {c.clock.phase !== 'running' ? (
                    <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                        {c.clock.phase === 'upcoming' ? 'The semester hasn’t started yet. Your first quest opens on day one.' : 'This semester has ended. Well done!'}
                    </p>
                ) : today ? (
                    <TodayCard mission={today} href={`${base}/missions/${today.id}`} color={color} />
                ) : (
                    <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">No quest is scheduled for today.</p>
                )}
            </section>

            {/* Catch-up */}
            {catchUp.length > 0 && (
                <section className="space-y-2">
                    <h2 className="text-base font-bold text-foreground">Catch up <span className="text-sm font-semibold text-muted-foreground">({catchUp.length})</span></h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {catchUp.slice(0, 6).map((m) => <MissionRow key={m.id} mission={m} href={`${base}/missions/${m.id}`} />)}
                    </div>
                </section>
            )}

            {/* Week */}
            <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-foreground">Week {shownWeek}</h2>
                    <div className="flex items-center gap-1">
                        <WeekLink href={`${base}?week=${shownWeek - 1}`} disabled={shownWeek <= 1} label="Previous week"><ChevronLeft className="h-4 w-4" /></WeekLink>
                        <WeekLink href={`${base}?week=${shownWeek + 1}`} disabled={shownWeek >= c.weeks} label="Next week"><ChevronRight className="h-4 w-4" /></WeekLink>
                    </div>
                </div>
                {weekMissions.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Missions for this week will be published soon.</p>
                ) : (
                    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
                        {weekMissions.map((m) => <DayTile key={m.id} mission={m} href={`${base}/missions/${m.id}`} today={c.clock.week === m.week && c.clock.day === m.day} color={color} />)}
                    </ol>
                )}
            </section>

            {/* Stage score */}
            {stage && (
                <section className="rounded-3xl border border-border bg-card p-4 sm:p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-foreground">Stage {stage.stage} score</h2>
                            <p className="text-xs text-muted-foreground">{stage.missionsDone}/{stage.missionsTotal} missions complete · pass mark {stage.passMark}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-extrabold tabular-nums text-foreground">{stage.total}</p>
                            <p className="text-[11px] font-semibold text-muted-foreground">out of 100</p>
                        </div>
                    </div>
                    <ul className="space-y-2.5">
                        {(Object.keys(BUCKET_WEIGHTS) as ScoreBucket[]).map((b) => (
                            <li key={b} className="grid grid-cols-[92px_1fr_36px] items-center gap-3 text-xs">
                                <span className="font-semibold text-foreground">{BUCKET_LABEL[b]} <span className="text-muted-foreground">{BUCKET_WEIGHTS[b]}%</span></span>
                                <span className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full" style={{ width: `${stage.buckets[b]}%`, backgroundColor: color }} /></span>
                                <span className="text-right font-bold tabular-nums text-foreground">{stage.buckets[b]}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-[11px] text-muted-foreground">Quizzes count your first try. Written work counts your best reviewed attempt.</p>
                </section>
            )}
        </div>
    )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Zap; value: string; label: string })
{
    return (
        <div className="rounded-2xl bg-black/20 px-2 py-2.5">
            <p className="flex items-center justify-center gap-1 text-lg font-extrabold tabular-nums"><Icon className="h-4 w-4 opacity-80" />{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{label}</p>
        </div>
    )
}

function WeekLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode })
{
    if (disabled) return <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/40">{children}</span>
    return <Link href={href} scroll={false} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted">{children}</Link>
}

function TodayCard({ mission: m, href, color }: { mission: MissionView; href: string; color: string })
{
    const kind = KIND_META[m.kind]
    const review = REVIEW_META[m.reviewMode]
    const status = STATUS_META[m.status]
    const boss = m.kind === 'boss'
    const done = m.status === 'passed'
    return (
        <Link href={href} className="group block rounded-3xl border-2 bg-card p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md" style={{ borderColor: boss ? '#F59E0B' : `${color}55` }}>
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: boss ? '#D97706' : color }}>
                    {boss ? <Swords className="h-3.5 w-3.5" /> : <kind.icon className="h-3.5 w-3.5" />}{kind.label}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.tone}`}><status.icon className="h-3.5 w-3.5" />{status.label}</span>
            </div>
            <h3 className="mt-3 text-lg font-extrabold leading-snug text-foreground sm:text-xl">{m.title}</h3>
            {m.story && <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{m.story}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{m.estMinutes} min</span>
                <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500" />{m.xp} {XP_LABEL}</span>
                <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-amber-500" />{m.tokens} {TOKENS_LABEL}</span>
                <span className="inline-flex items-center gap-1"><review.icon className="h-3.5 w-3.5" />{review.label}</span>
                {m.badge && <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-amber-500" />{m.badge.label} badge</span>}
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all group-hover:gap-2.5" style={{ backgroundColor: boss ? '#D97706' : color }}>
                {done ? 'View result' : m.status === 'in_review' ? 'View submission' : m.status === 'needs_revision' ? 'Try again' : 'Start mission'} <ArrowRight className="h-4 w-4" />
            </span>
        </Link>
    )
}

function MissionRow({ mission: m, href }: { mission: MissionView; href: string })
{
    const kind = KIND_META[m.kind]
    const status = STATUS_META[m.status]
    return (
        <Link href={href} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-muted/50">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"><kind.icon className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{m.title}</span>
                <span className="block text-xs text-muted-foreground">Week {m.week} · {DAY_NAMES[m.day - 1]} · {m.xp} {XP_LABEL}</span>
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.tone}`}>{status.label}</span>
        </Link>
    )
}

function DayTile({ mission: m, href, today, color }: { mission: MissionView; href: string; today: boolean; color: string })
{
    const kind = KIND_META[m.kind]
    const status = STATUS_META[m.status]
    const locked = m.status === 'locked'
    const inner = (
        <>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{DAY_NAMES[m.day - 1]}{today ? ' · Today' : ''}</span>
                <status.icon className={`h-4 w-4 ${status.tone.split(' ')[0]}`} aria-label={status.label} />
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><kind.icon className="h-3.5 w-3.5" />{kind.label}</span>
            <span className={`line-clamp-2 text-sm font-semibold leading-snug ${locked ? 'text-muted-foreground' : 'text-foreground'}`}>{m.title}</span>
            <span className="mt-auto text-[11px] font-semibold text-muted-foreground">{locked ? `Opens ${formatUnlock(m.unlocksAt)}` : `${m.xp} ${XP_LABEL}`}</span>
        </>
    )
    const cls = `flex h-full min-h-[132px] flex-col gap-1.5 rounded-2xl border p-3 transition-colors ${today ? 'border-2' : 'border-border'} ${m.kind === 'boss' ? 'bg-amber-500/5' : 'bg-card'}`
    return (
        <li>
            {locked
                ? <div className={`${cls} opacity-70`} style={today ? { borderColor: color } : undefined}>{inner}</div>
                : <Link href={href} className={`${cls} hover:bg-muted/50`} style={today ? { borderColor: color } : undefined}>{inner}</Link>}
        </li>
    )
}
