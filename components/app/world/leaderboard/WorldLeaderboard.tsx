import Link from 'next/link'
import { Building2, Crown, Flame, Globe2, GraduationCap, MapPin, Medal, Trophy, Users, Zap } from 'lucide-react'
import { characterPreviewUrl } from '@/lib/competitions/config'
import { XP_LABEL, type LeaderboardView, type LeagueView, type PathwayView, type WorldLeaderboardEntry, type WorldParticipantView } from '@/lib/world/types'
import { AnimatedBar, CountUp } from '../fx'
import StatePicker from './StatePicker'

/*
 * Leaderboard page body (server component — every filter is a link, so it
 * works without JS and each view is shareable). Two views:
 *   players: one pathway, overall / campus / state, all time or this week
 *   league:  campus vs campus by average XP per player
 */

export interface BoardParams { view: 'players' | 'league'; pathway?: string; scope?: string; value?: string; period?: string }

const nf = (n: number) => n.toLocaleString('en-NG')

export default function WorldLeaderboard({ slug, params, pathways, me, week, board, league }: {
    slug: string
    params: BoardParams
    pathways: PathwayView[]
    me: WorldParticipantView | null
    week: number | null
    board: LeaderboardView | null
    league: LeagueView | null
})
{
    const base = `/app/competitions/${slug}/leaderboard`
    const href = (next: Partial<BoardParams>) =>
    {
        const merged = { ...params, ...next }
        const q = new URLSearchParams()
        if (merged.view === 'league') q.set('view', 'league')
        for (const k of ['pathway', 'scope', 'value', 'period'] as const) if (merged[k]) q.set(k, merged[k]!)
        const s = q.toString()
        return s ? `${base}?${s}` : base
    }
    const activePathway = board?.pathway ?? league?.pathway ?? me?.pathway ?? 'career'
    const color = pathways.find((p) => p.key === activePathway)?.color ?? '#2563EB'

    return (
        <div className="space-y-4">
            {/* Header */}
            <section className="hw-rise relative overflow-hidden rounded-3xl p-5 text-white shadow-lg sm:p-6" style={{ background: `linear-gradient(135deg, ${color} 0%, #102A43 90%)` }}>
                <Trophy className="hw-float absolute -right-3 -top-3 h-28 w-28 text-white/10" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">Hubnovo World</p>
                <h1 className="text-2xl font-extrabold sm:text-3xl">{params.view === 'league' ? 'Campus league' : 'Leaderboard'}</h1>
                <p className="mt-1 max-w-lg text-sm text-white/80">
                    {params.view === 'league'
                        ? `Campuses ranked by average ${XP_LABEL} per player, so small campuses can beat big ones. A campus needs ${league?.minPlayers ?? 3}+ players to rank.`
                        : `Ranked by ${XP_LABEL}. Ties go to whoever got there first.`}
                </p>
                {board?.me && (
                    <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-black/25 px-4 py-2.5">
                        <Medal className="h-5 w-5 text-amber-300" />
                        <div>
                            <p className="text-lg font-extrabold leading-none tabular-nums">{board.me.rank ? <>#<CountUp value={board.me.rank} /></> : '—'}<span className="ml-1 text-xs font-semibold text-white/70">of {nf(board.total)}</span></p>
                            <p className="text-[11px] text-white/75">{board.me.rank ? `Your rank · ${nf(board.me.xp)} ${XP_LABEL}` : 'Earn XP this week to get ranked'}</p>
                        </div>
                    </div>
                )}
                {league?.me && (
                    <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-black/25 px-4 py-2.5">
                        <GraduationCap className="h-5 w-5 text-amber-300" />
                        <div>
                            <p className="text-lg font-extrabold leading-none">{league.me.rank ? `#${league.me.rank}` : 'Not ranked yet'} <span className="text-xs font-semibold text-white/70">{league.me.name}</span></p>
                            <p className="text-[11px] text-white/75">
                                {league.me.rank ? `${nf(league.me.averageXp)} avg ${XP_LABEL} · ${league.me.participants} players` : `Needs ${league.me.playersNeeded} more player${league.me.playersNeeded === 1 ? '' : 's'} to join the league`}
                            </p>
                        </div>
                    </div>
                )}
            </section>

            {/* View + pathway */}
            <div className="hw-rise flex flex-wrap items-center gap-2" style={{ animationDelay: '40ms' }}>
                <Seg href={href({ view: 'players', scope: undefined, value: undefined })} active={params.view === 'players'} icon={Users}>Players</Seg>
                <Seg href={href({ view: 'league', scope: undefined, value: undefined, period: undefined })} active={params.view === 'league'} icon={Building2}>Campus league</Seg>
                <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
                {params.view === 'league' && <Pill href={href({ pathway: undefined })} active={!league?.pathway}>Both pathways</Pill>}
                {pathways.map((p) => (
                    <Pill key={p.key} href={href({ pathway: p.key })} active={activePathway === p.key && (params.view === 'players' || Boolean(league?.pathway))} color={p.color}>
                        {p.name.split(' ')[0]}
                    </Pill>
                ))}
            </div>

            {board && (
                <>
                    {/* Scope + period */}
                    <div className="hw-rise flex flex-wrap items-center gap-2" style={{ animationDelay: '80ms' }}>
                        <Pill href={href({ scope: undefined, value: undefined })} active={board.scope === 'overall'} icon={Globe2}>Nigeria</Pill>
                        {me?.institution && <Pill href={href({ scope: 'institution', value: undefined })} active={board.scope === 'institution' && board.scopeValue === me.institution.id} icon={GraduationCap}>{me.institution.shortName ?? 'My campus'}</Pill>}
                        {board.scope === 'institution' && board.scopeValue !== me?.institution?.id && <Pill href="#" active icon={GraduationCap}>{board.scopeLabel}</Pill>}
                        <StatePicker base={href({ scope: 'state', value: undefined })} current={board.scope === 'state' ? board.scopeValue : null} mine={me?.state ?? null} />
                        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
                        <Pill href={href({ period: undefined })} active={board.period === 'all'}>All time</Pill>
                        {week && <Pill href={href({ period: 'week' })} active={board.period === 'week'} icon={Flame}>This week (W{week})</Pill>}
                    </div>
                    <Players board={board} color={color} />
                </>
            )}

            {league && <League league={league} hrefForCampus={(id) => href({ view: 'players', scope: 'institution', value: id, pathway: league.pathway ?? undefined })} />}
        </div>
    )
}

// ─── Players ─────────────────────────────────────────────────────────────────

function Players({ board, color }: { board: LeaderboardView; color: string })
{
    if (board.entries.length === 0)
        return (
            <section className="hw-rise rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                <Trophy className="mx-auto h-9 w-9 text-muted-foreground" />
                <h2 className="mt-3 text-base font-bold text-foreground">{board.scope !== 'overall' && !board.scopeValue ? board.scopeLabel : 'No one on this board yet'}</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    {board.period === 'week' ? 'Finish a quest this week to be the first on the board.' : 'Finish your first quest to claim the top spot.'}
                </p>
            </section>
        )

    const podium = board.entries.slice(0, 3)
    const rest = board.entries.slice(3)
    const top = board.entries[0]?.xp || 1
    const meShown = board.entries.some((e) => e.isMe)

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">
                {board.scopeLabel} · {board.period === 'week' ? `Week ${board.week}` : 'All time'} · {nf(board.total)} player{board.total === 1 ? '' : 's'}
            </p>

            {/* Podium: 2 · 1 · 3 */}
            <section className="grid grid-cols-3 items-end gap-2 sm:gap-4">
                {[podium[1], podium[0], podium[2]].map((e, i) => e ? <PodiumSpot key={e.userId} e={e} place={e.rank} delay={i * 90} color={color} /> : <div key={i} />)}
            </section>

            {rest.length > 0 && (
                <ol className="overflow-hidden rounded-3xl border border-border bg-card">
                    {rest.map((e, n) => <Row key={e.userId} e={e} top={top} color={color} delay={Math.min(n, 12) * 35} />)}
                </ol>
            )}

            {board.me && board.me.rank && !meShown && (
                <div className="sticky bottom-3 z-10">
                    <div className="hw-pop flex items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 shadow-lg" style={{ borderColor: color }}>
                        <span className="w-10 text-center text-sm font-extrabold tabular-nums text-foreground">#{nf(board.me.rank)}</span>
                        <span className="flex-1 text-sm font-bold text-foreground">You</span>
                        <span className="text-sm font-bold tabular-nums text-foreground">{nf(board.me.xp)} <span className="text-xs text-muted-foreground">{XP_LABEL}</span></span>
                    </div>
                </div>
            )}
        </div>
    )
}

function PodiumSpot({ e, place, delay, color }: { e: WorldLeaderboardEntry; place: number; delay: number; color: string })
{
    const height = place === 1 ? 'h-28 sm:h-32' : place === 2 ? 'h-20 sm:h-24' : 'h-14 sm:h-16'
    const medal = place === 1 ? '#F59E0B' : place === 2 ? '#94A3B8' : '#B45309'
    const name = e.displayName ?? e.username ?? 'Player'
    return (
        <div className="hw-rise flex flex-col items-center" style={{ animationDelay: `${120 + delay}ms` }}>
            <div className="relative">
                {place === 1 && <Crown className="hw-float absolute -top-6 left-1/2 h-6 w-6 -translate-x-1/2 text-amber-400" />}
                <Avatar e={e} size={place === 1 ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-12 w-12 sm:h-16 sm:w-16'} ring={e.isMe ? color : medal} />
            </div>
            <p className="mt-1.5 max-w-full truncate text-xs font-bold text-foreground sm:text-sm">{e.isMe ? 'You' : name}</p>
            <p className="max-w-full truncate text-[10px] text-muted-foreground">{e.institution ?? e.state ?? ''}</p>
            <p className="text-xs font-extrabold tabular-nums" style={{ color: medal }}>{nf(e.xp)} {XP_LABEL}</p>
            <div className={`hw-bar mt-1.5 flex w-full items-start justify-center rounded-t-2xl pt-2 text-xl font-black text-white ${height}`} style={{ background: `linear-gradient(180deg, ${medal}, ${medal}99)` }}>
                {place}
            </div>
        </div>
    )
}

function Row({ e, top, color, delay }: { e: WorldLeaderboardEntry; top: number; color: string; delay: number })
{
    const name = e.displayName ?? e.username ?? 'Player'
    return (
        <li className={`hw-rise flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 sm:px-4 ${e.isMe ? 'bg-primary/5' : ''}`} style={{ animationDelay: `${delay}ms` }}>
            <span className="w-8 text-center text-sm font-bold tabular-nums text-muted-foreground">{e.rank}</span>
            <Avatar e={e} size="h-9 w-9" ring={e.isMe ? color : undefined} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{name}{e.isMe && <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: color }}>You</span>}</p>
                <p className="truncate text-[11px] text-muted-foreground">{[e.institution, e.state].filter(Boolean).join(' · ') || `${e.missionsCompleted} quests`}</p>
                <AnimatedBar pct={(e.xp / top) * 100} color={color} className="mt-1 h-1 max-w-[12rem]" />
            </div>
            <div className="text-right">
                <p className="text-sm font-extrabold tabular-nums text-foreground">{nf(e.xp)}</p>
                <p className="text-[10px] text-muted-foreground">{XP_LABEL}</p>
            </div>
        </li>
    )
}

function Avatar({ e, size, ring }: { e: WorldLeaderboardEntry; size: string; ring?: string })
{
    const style = ring ? { boxShadow: `0 0 0 2px ${ring}` } : undefined
    if (e.avatarUrl)
        // eslint-disable-next-line @next/next/no-img-element -- profile photo
        return <img src={e.avatarUrl} alt="" className={`${size} shrink-0 rounded-full object-cover`} style={style} />
    return (
        <span className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted`} style={style}>
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
            <img src={characterPreviewUrl(e.character)} alt="" className="h-full w-full object-contain p-0.5" />
        </span>
    )
}

// ─── Campus league ───────────────────────────────────────────────────────────

function League({ league, hrefForCampus }: { league: LeagueView; hrefForCampus: (id: string) => string })
{
    if (league.entries.length === 0)
        return (
            <section className="hw-rise rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                <Building2 className="mx-auto h-9 w-9 text-muted-foreground" />
                <h2 className="mt-3 text-base font-bold text-foreground">No campus has {league.minPlayers}+ players yet</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    {league.me ? `Invite ${league.me.playersNeeded || 'more'} classmate${league.me.playersNeeded === 1 ? '' : 's'} from ${league.me.name} to put your campus on the board first.` : 'Invite classmates to put your campus on the board.'}
                </p>
            </section>
        )
    const top = league.entries[0].averageXp || 1
    return (
        <ol className="space-y-2">
            {league.entries.map((e, n) => (
                <li key={e.institutionId} className="hw-rise" style={{ animationDelay: `${Math.min(n, 12) * 40}ms` }}>
                    <Link href={hrefForCampus(e.institutionId)} className={`hw-lift flex items-center gap-3 rounded-2xl border bg-card p-3 sm:p-4 ${e.isMine ? 'border-primary ring-1 ring-primary' : 'border-border hover:bg-muted/40'}`}>
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${e.rank === 1 ? 'bg-amber-400 text-amber-950' : e.rank === 2 ? 'bg-slate-300 text-slate-800' : e.rank === 3 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'}`}>
                            {e.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-foreground">
                                {e.shortName ?? e.name}{e.isMine && <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">Your campus</span>}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                                {e.shortName ? `${e.name} · ` : ''}{e.state && <><MapPin className="inline h-3 w-3" /> {e.state} · </>}{e.participants} players
                            </p>
                            <AnimatedBar pct={(e.averageXp / top) * 100} color="#F59E0B" className="mt-1.5 h-1.5 max-w-xs" />
                        </div>
                        <div className="text-right">
                            <p className="flex items-center justify-end gap-1 text-sm font-extrabold tabular-nums text-foreground"><Zap className="h-3.5 w-3.5 text-amber-500" />{nf(e.averageXp)}</p>
                            <p className="text-[10px] text-muted-foreground">avg {XP_LABEL} · {nf(e.totalXp)} total</p>
                        </div>
                    </Link>
                </li>
            ))}
        </ol>
    )
}

// ─── Small bits ──────────────────────────────────────────────────────────────

function Seg({ href, active, icon: Icon, children }: { href: string; active: boolean; icon: typeof Users; children: React.ReactNode })
{
    return (
        <Link href={href} scroll={false} className={`hw-press inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card text-foreground ring-1 ring-border hover:bg-muted'}`}>
            <Icon className="h-4 w-4" /> {children}
        </Link>
    )
}

function Pill({ href, active, color, icon: Icon, children }: { href: string; active: boolean; color?: string; icon?: typeof Users; children: React.ReactNode })
{
    return (
        <Link
            href={href}
            scroll={false}
            className={`hw-press inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${active ? 'text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            style={active ? { backgroundColor: color ?? 'var(--foreground)', color: color ? '#fff' : 'var(--background)' } : undefined}
        >
            {Icon && <Icon className="h-3.5 w-3.5" />} {children}
        </Link>
    )
}
