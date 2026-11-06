import Link from 'next/link'
import { ArrowRight, Lock, Sparkles, Trophy, Users } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { normalizeRole } from '@/lib/modushive/config'
import { getParticipantCounts, listCompetitions } from '@/lib/competitions/queries'
import { competitionIcon } from '@/lib/competitions/icons'
import { POINTS_LABEL } from '@/lib/competitions/config'
import SeasonCountdown from '@/components/app/competitions/SeasonCountdown'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Competitions · Hubnovo' }

export default async function CompetitionsPage()
{
    const [{ profile }, competitions, counts] = await Promise.all([getCurrentUser(), listCompetitions(), getParticipantCounts()])
    const isAdmin = normalizeRole(profile?.role) === 'admin'
    const live = competitions.filter((c) => c.status === 'live')
    const others = competitions.filter((c) => c.status !== 'live')

    return (
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
            {/* Hero */}
            <section
                className="relative overflow-hidden rounded-3xl p-5 sm:p-8 text-white"
                style={{ background: 'linear-gradient(135deg, #0A1E33 0%, #102A43 50%, #00688A 100%)' }}
            >
                <Trophy className="absolute -right-6 -bottom-8 h-44 w-44 opacity-10" />
                <div className="relative max-w-xl space-y-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                        <Sparkles className="h-3.5 w-3.5" /> Hubnovo Competitions
                    </span>
                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">Play. Build. Win.</h1>
                    <p className="text-sm sm:text-base text-white/80">
                        Complete real missions, earn XP and {POINTS_LABEL}, climb the leaderboard and unlock badges.
                    </p>
                    {profile && (
                        <p className="inline-flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2 text-sm font-semibold">
                            Your {POINTS_LABEL}: <span className="text-amber-300 tabular-nums">{(profile.impact_points ?? 0).toLocaleString('en-NG')}</span>
                        </p>
                    )}
                </div>
                {isAdmin && (
                    <Link href="/app/competitions/review" className="absolute top-4 right-4 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">
                        Review queue
                    </Link>
                )}
            </section>

            {competitions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                    <p className="text-sm font-semibold text-foreground">Competitions are coming soon.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Check back shortly.</p>
                </div>
            )}

            {/* Live now */}
            {live.length > 0 && (
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live now
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {live.map((c) =>
                        {
                            const Icon = competitionIcon(c.icon)
                            return (
                                <Link
                                    key={c.id}
                                    href={`/app/competitions/${c.slug}`}
                                    className="group relative overflow-hidden rounded-3xl p-5 text-white shadow-lg transition-transform hover:-translate-y-0.5"
                                    style={{ background: `linear-gradient(135deg, ${c.theme_color} 0%, #102A43 100%)` }}
                                >
                                    <Icon className="absolute -right-4 -bottom-6 h-36 w-36 opacity-15" />
                                    <div className="relative space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><Icon className="h-5 w-5" /></span>
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{c.season_name ?? 'Season'}</p>
                                                <h3 className="text-lg font-extrabold leading-tight">{c.name}</h3>
                                            </div>
                                        </div>
                                        {c.tagline && <p className="text-sm text-white/85">{c.tagline}</p>}
                                        <SeasonCountdown start={c.season_start} end={c.season_end} />
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/85">
                                                <Users className="h-3.5 w-3.5" /> {(counts[c.id] ?? 0).toLocaleString('en-NG')} joined
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-slate-900 group-hover:gap-2 transition-all">
                                                Enter <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Coming soon */}
            {others.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-base font-bold text-foreground">Coming soon</h2>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {others.map((c) =>
                        {
                            const Icon = competitionIcon(c.icon)
                            return (
                                <Link
                                    key={c.id}
                                    href={`/app/competitions/${c.slug}`}
                                    className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/60"
                                >
                                    <span
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                                        style={{ backgroundColor: `${c.theme_color}22`, color: c.theme_color }}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="truncate text-sm font-bold text-foreground">{c.name}</h3>
                                        </div>
                                        {c.tagline && <p className="mt-0.5 text-xs text-muted-foreground">{c.tagline}</p>}
                                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                            <Lock className="h-3 w-3" /> {c.status === 'ended' ? 'Season ended' : 'Coming soon'}
                                        </span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </section>
            )}
        </div>
    )
}
