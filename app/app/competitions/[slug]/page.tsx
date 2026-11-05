import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Lock, Trophy, Users } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getCompetitionDetail, getLeaderboard } from '@/lib/competitions/queries'
import { competitionIcon } from '@/lib/competitions/icons'
import { POINTS_LABEL, getLevel, isSeasonOpen } from '@/lib/competitions/config'
import SeasonCountdown from '@/components/app/competitions/SeasonCountdown'
import JoinCompetitionCard from '@/components/app/competitions/JoinCompetitionCard'
import CompetitionWorld from '@/components/app/competitions/CompetitionWorld'
import Leaderboard from '@/components/app/competitions/Leaderboard'
import AvatarSprite from '@/components/app/competitions/AvatarSprite'
import EditLookButton from '@/components/app/competitions/EditLookButton'

export const dynamic = 'force-dynamic'

export default async function CompetitionPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ state?: string }>
})
{
    const [{ slug }, { state: stateParam }, { profile }] = await Promise.all([params, searchParams, getCurrentUser()])
    const detail = await getCompetitionDetail(slug, profile)
    if (!detail) notFound()

    const { competition: c, zones, missions, participant, myXp, myRank, participantCount, states } = detail
    const Icon = competitionIcon(c.icon)
    const basePath = `/app/competitions/${c.slug}`
    const activeState = stateParam && states.includes(stateParam) ? stateParam : null
    const leaderboard = activeState ? await getLeaderboard(c.id, { group: 'state', value: activeState }) : detail.leaderboard
    const seasonOpen = isSeasonOpen(c)
    const level = getLevel(myXp)
    const completedCount = missions.filter((m) => m.completed).length


    return (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
            <Link href="/app/competitions" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Competitions
            </Link>

            {/* Hero */}
            <section
                className="relative overflow-hidden rounded-3xl p-5 sm:p-7 text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${c.theme_color} 0%, #102A43 85%)` }}
            >
                <Icon className="absolute -right-6 -bottom-8 h-48 w-48 opacity-15" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2 max-w-xl">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                            {c.status === 'live' ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" /> {c.season_name ?? 'Live'}</> : <><Lock className="h-3 w-3" /> Coming soon</>}
                        </span>
                        <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">{c.name}</h1>
                        {c.tagline && <p className="text-sm sm:text-base font-semibold text-white/90">{c.tagline}</p>}
                        {c.description && <p className="text-sm text-white/75">{c.description}</p>}
                        {c.status === 'live' && (
                            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/85">
                                <Users className="h-3.5 w-3.5" /> {participantCount.toLocaleString('en-NG')} competing
                            </p>
                        )}
                    </div>
                    {c.status === 'live' && <SeasonCountdown start={c.season_start} end={c.season_end} />}
                </div>
            </section>

            {c.status !== 'live' ? (
                <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 text-center space-y-3">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${c.theme_color}22`, color: c.theme_color }}>
                        <Icon className="h-7 w-7" />
                    </span>
                    <h2 className="text-lg font-bold text-foreground">{c.status === 'ended' ? 'This season has ended' : 'Launching soon'}</h2>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                        {c.status === 'ended'
                            ? 'Thanks to everyone who took part. The next season will be announced soon.'
                            : 'We’re building this competition now. Missions, XP, badges and a leaderboard — just like the Marketplace Competition.'}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                        <Link href="/app/competitions/marketplace" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90">
                            <Trophy className="h-4 w-4" /> Try the Marketplace Competition
                        </Link>
                    </div>
                </section>
            ) : (
                <>
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                        <div className="min-w-0">
                            {/* You */}
                            {!profile ? null : participant ? (
                                <section className="rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl" style={{ backgroundColor: `${c.theme_color}22` }}>
                                            <AvatarSprite avatar={participant.avatar} size={68} className="text-foreground" />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-base font-bold text-foreground">{profile.display_name ?? profile.username}</p>
                                                <EditLookButton competitionId={c.id} themeColor={c.theme_color} state={participant.state} avatar={participant.avatar} />
                                            </div>
                                            <p className="text-xs font-semibold text-muted-foreground">
                                                Level {level.level} · <span style={{ color: c.theme_color }}>{level.name}</span>
                                                {participant.state ? ` · ${participant.state}` : ''}
                                            </p>
                                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round(level.progress * 100)}%`, backgroundColor: c.theme_color }} />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                {level.next ? `${level.xpToNext} XP to ${level.next.name}` : 'Max level reached!'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-2xl bg-muted/60 px-2 py-2.5">
                                            <p className="text-lg font-extrabold tabular-nums text-foreground">{myXp.toLocaleString('en-NG')}</p>
                                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Season XP</p>
                                        </div>
                                        <div className="rounded-2xl bg-muted/60 px-2 py-2.5">
                                            <p className="text-lg font-extrabold tabular-nums text-foreground">{myRank ? `#${myRank}` : '—'}</p>
                                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Rank</p>
                                        </div>
                                        <div className="rounded-2xl bg-muted/60 px-2 py-2.5">
                                            <p className="text-lg font-extrabold tabular-nums text-foreground">{completedCount}/{missions.length}</p>
                                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Missions</p>
                                        </div>
                                    </div>
                                </section>
                            ) : seasonOpen || (c.season_start && Date.now() < new Date(c.season_start).getTime()) ? (
                                <section className="rounded-3xl border-2 p-4 sm:p-5 shadow-sm bg-card" style={{ borderColor: `${c.theme_color}66` }}>
                                    <h2 className="text-base font-bold text-foreground">Create your competitor</h2>
                                    <p className="mb-4 text-xs text-muted-foreground">Pick your look, then start earning XP and {POINTS_LABEL}.</p>
                                    <JoinCompetitionCard mode="join" competitionId={c.id} themeColor={c.theme_color} />
                                </section>
                            ) : null}
                        </div>
                    <aside className="min-w-0">
                        <Leaderboard
                            entries={leaderboard}
                            meId={profile?.id}
                            basePath={basePath}
                            states={states}
                            activeState={activeState}
                            showStateFilter={c.leaderboard_groups.includes('state')}
                        />
                    </aside>
                    </div>

                    {/* The city gets the full page width. */}
                    <CompetitionWorld
                        themeColor={c.theme_color}
                        prizeNote={c.prize_note}
                        zones={zones}
                        missions={missions}
                        joined={Boolean(participant)}
                        seasonOpen={seasonOpen}
                        myXp={myXp}
                        avatar={participant?.avatar ?? null}
                    />
                </>
            )}
        </div>
    )
}
