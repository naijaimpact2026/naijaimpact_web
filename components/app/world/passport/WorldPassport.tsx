import Link from 'next/link'
import { Award, CheckCircle2, Coins, Hourglass, Lock, Medal, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import type { User } from '@/lib/types'
import { characterPreviewUrl } from '@/lib/competitions/config'
import { BUCKET_WEIGHTS, STAGE_WEEKS, TOKENS_LABEL, XP_LABEL, type CompetitionDetail, type MissionView, type ProgressView, type ScoreBucket, type StageScore } from '@/lib/world/types'
import { DAY_NAMES, KIND_META } from '@/lib/world/ui'
import { AnimatedBar, CountUp } from '../fx'

/*
 * Passport / My Progress (Dev 2). Built only from the shared contract:
 * ProgressView (GET /progress) and MissionView (GET /quests?week=N),
 * so the mobile app can render the same screen from the same endpoints.
 */

const BUCKET_LABEL: Record<ScoreBucket, string> = { evidence: 'Evidence', quality: 'Quality', reflection: 'Reflection', teamwork: 'Teamwork', showcase: 'Showcase' }

export default function WorldPassport({ competition: c, profile, progress, missions }: { competition: CompetitionDetail; profile: User; progress: ProgressView; missions: MissionView[] })
{
    const me = c.me!
    const pathway = c.pathways.find((p) => p.key === me.pathway)!
    const color = pathway.color
    const base = `/app/competitions/${c.slug}`

    const passed = missions.filter((m) => m.status === 'passed').sort((a, b) => a.week - b.week || a.day - b.day)
    const inReview = missions.filter((m) => m.status === 'in_review')
    const earned = new Map(progress.badges.map((b) => [b.key, b]))
    // Every badge this pathway can award, in the order the missions award them.
    const allBadges = missions.filter((m) => m.badge).map((m) => ({ ...m.badge!, mission: m }))
    const extraBadges = progress.badges.filter((b) => !allBadges.some((a) => a.key === b.key))
    const stages = progress.stages.filter((s) => s.missionsTotal > 0)

    return (
        <div className="space-y-5">
            {/* Identity */}
            <section className="hw-rise relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${color} 0%, #102A43 90%)` }}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">Hubnovo Passport</p>
                <div className="mt-3 flex items-center gap-4">
                    <div className="h-20 w-20 shrink-0 rounded-3xl bg-white/15 p-2 sm:h-24 sm:w-24">
                        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                        <img src={characterPreviewUrl(me.avatar.character)} alt="" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <h1 className="truncate text-xl font-extrabold sm:text-2xl">{profile.display_name || profile.username}</h1>
                        <p className="text-xs font-semibold text-white/85">
                            {pathway.name}{me.institution ? ` · ${me.institution.shortName ?? me.institution.name}` : ''}{me.state ? ` · ${me.state}` : ''}
                        </p>
                        <p className="text-xs font-semibold text-white/85">Level {progress.level.level} · {progress.level.name}</p>
                        <AnimatedBar pct={progress.level.progress * 100} color="#ffffff" track="bg-white/20" className="h-2 max-w-sm" />
                        <p className="text-[11px] text-white/70">Joined {new Date(me.joinedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                    <Stat icon={Zap} value={<CountUp value={progress.xp} />} label={XP_LABEL} />
                    <Stat icon={Coins} value={<CountUp value={progress.tokens} />} label={TOKENS_LABEL} />
                    <Stat icon={Medal} value={progress.rank ? `#${progress.rank}` : '—'} label="Rank" />
                    <Stat icon={CheckCircle2} value={<CountUp value={passed.length} />} label="Missions done" />
                </div>
            </section>

            {/* Stage readiness */}
            <section className="hw-rise space-y-3" style={{ animationDelay: '80ms' }}>
                <h2 className="text-base font-bold text-foreground">Stage readiness</h2>
                {stages.length === 0 ? (
                    <Empty>Your stage scores appear once missions are published.</Empty>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {stages.map((s) => <StageCard key={s.stage} stage={s} color={color} />)}
                    </div>
                )}
            </section>

            {/* Badges */}
            <section className="hw-rise space-y-3" style={{ animationDelay: '140ms' }}>
                <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-base font-bold text-foreground">Badges</h2>
                    <span className="text-xs font-semibold text-muted-foreground">{progress.badges.length} earned</span>
                </div>
                {allBadges.length + extraBadges.length === 0 ? (
                    <Empty>Win a Sunday boss challenge to earn your first badge.</Empty>
                ) : (
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {allBadges.map((b) =>
                        {
                            const got = earned.get(b.key)
                            return (
                                <li key={b.key} className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center ${got ? 'border-amber-400/60 bg-amber-500/5' : 'border-dashed border-border bg-card'}`}>
                                    <span className={`flex h-12 w-12 items-center justify-center rounded-full ${got ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        {got ? <Award className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                                    </span>
                                    <span className={`text-sm font-bold leading-tight ${got ? 'text-foreground' : 'text-muted-foreground'}`}>{b.label}</span>
                                    <span className="text-[11px] text-muted-foreground">
                                        {got
                                            ? `Earned ${new Date(got.awardedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`
                                            : `Pass “${b.mission.title}” (Week ${b.mission.week})`}
                                    </span>
                                </li>
                            )
                        })}
                        {extraBadges.map((b) => (
                            <li key={b.key} className="flex flex-col items-center gap-2 rounded-2xl border border-amber-400/60 bg-amber-500/5 p-4 text-center">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white"><Award className="h-6 w-6" /></span>
                                <span className="text-sm font-bold leading-tight text-foreground">{b.label}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Portfolio */}
            <section className="hw-rise space-y-3" style={{ animationDelay: '200ms' }}>
                <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-base font-bold text-foreground">Portfolio</h2>
                    {inReview.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-300"><Hourglass className="h-3.5 w-3.5" />{inReview.length} in review</span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">Every mission you pass is saved here, with its score and feedback. This becomes your CV and showcase evidence.</p>
                {passed.length === 0 ? (
                    <Empty>Nothing here yet. <Link href={base} className="font-semibold underline">Start today’s quest</Link> to add your first piece of work.</Empty>
                ) : (
                    <ul className="grid gap-2 sm:grid-cols-2">
                        {passed.map((m) => <PortfolioRow key={m.id} mission={m} href={`${base}/missions/${m.id}`} color={color} />)}
                    </ul>
                )}
            </section>

            <section className="rounded-3xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                <ShieldCheck className="mx-auto mb-1 h-5 w-5" />
                Certificates and CV export are coming soon. Pass a stage to earn a certificate you can share and verify.
            </section>
        </div>
    )
}

function StageCard({ stage: s, color }: { stage: StageScore; color: string })
{
    const gap = Math.max(0, s.passMark - s.total)
    const firstWeek = (s.stage - 1) * STAGE_WEEKS + 1
    return (
        <div className="rounded-3xl border border-border bg-card p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-foreground">Stage {s.stage} <span className="font-semibold text-muted-foreground">· Weeks {firstWeek}–{firstWeek + STAGE_WEEKS - 1}</span></h3>
                    <p className="text-xs text-muted-foreground">{s.missionsDone}/{s.missionsTotal} missions · pass mark {s.passMark}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-extrabold tabular-nums text-foreground"><CountUp value={s.total} /></p>
                    <p className="text-[11px] font-semibold text-muted-foreground">out of 100</p>
                </div>
            </div>
            <ul className="space-y-2">
                {(Object.keys(BUCKET_WEIGHTS) as ScoreBucket[]).map((b) => (
                    <li key={b} className="grid grid-cols-[92px_1fr_32px] items-center gap-3 text-xs">
                        <span className="font-semibold text-foreground">{BUCKET_LABEL[b]} <span className="text-muted-foreground">{BUCKET_WEIGHTS[b]}%</span></span>
                        <AnimatedBar pct={s.buckets[b]} color={color} />
                        <span className="text-right font-bold tabular-nums text-foreground">{s.buckets[b]}</span>
                    </li>
                ))}
            </ul>
            <p className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${s.passed ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                {s.passed
                    ? <><Sparkles className="h-4 w-4" /> Stage passed. The next stage is unlocked.</>
                    : <><Lock className="h-4 w-4" /> {gap} more point{gap === 1 ? '' : 's'} to pass this stage.</>}
            </p>
        </div>
    )
}

function PortfolioRow({ mission: m, href, color }: { mission: MissionView; href: string; color: string })
{
    const kind = KIND_META[m.kind]
    const a = m.lastAttempt
    return (
        <li>
            <Link href={href} className="hw-lift hw-press flex h-full gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-muted/50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: color }}><kind.icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">{m.title}</span>
                        {a?.score != null && <span className="shrink-0 text-sm font-extrabold tabular-nums text-foreground">{Math.round(a.score)}</span>}
                    </span>
                    <span className="block text-xs text-muted-foreground">Week {m.week} · {DAY_NAMES[m.day - 1]} · {kind.label}</span>
                    {a?.feedback && <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{a.feedback}</span>}
                </span>
            </Link>
        </li>
    )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Zap; value: React.ReactNode; label: string })
{
    return (
        <div className="rounded-2xl bg-black/20 px-2 py-2.5">
            <p className="flex items-center justify-center gap-1 text-lg font-extrabold tabular-nums"><Icon className="h-4 w-4 opacity-80" />{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{label}</p>
        </div>
    )
}

function Empty({ children }: { children: React.ReactNode })
{
    return <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{children}</p>
}
