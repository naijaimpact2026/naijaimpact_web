'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Award, ChevronLeft, ChevronRight, Coins, IdCard, Lock, MousePointerClick, Trophy, Users, X, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DISTRICTS, districtOf, districtProgress, type DistrictKey, type WorldMissionLite } from '@/lib/world/districts'
import { TOKENS_LABEL, XP_LABEL } from '@/lib/world/types'
import { DAY_NAMES, KIND_META, STATUS_META, formatUnlock } from '@/lib/world/ui'

// three.js only loads here, in the browser.
const CityView = dynamic(() => import('@/components/app/competitions/city3d/CityView'), {
    ssr: false,
    loading: () => <div className="h-[78vh] min-h-[460px] max-h-[920px] w-full animate-pulse rounded-3xl bg-muted" />,
})

const INTRO_KEY = 'hubnovo:world-intro-seen'

interface Props
{
    slug: string
    competitionName: string
    week: number
    currentWeek: number | null
    totalWeeks: number
    pathway: { key: string; name: string; color: string }
    character: number
    missions: WorldMissionLite[]
    xp: number
    tokens: number
    badges: number
    squad: { name: string; members: number; needed: number } | null
    lite: boolean
}

export default function CampusWorld(props: Props)
{
    const { slug, week, currentWeek, totalWeeks, pathway, character, missions, xp, tokens, badges, squad, lite } = props
    const base = `/app/competitions/${slug}`
    const color = pathway.color
    const myDistrict: DistrictKey = pathway.key === 'enterprise' ? 'enterprise_hub' : 'career_district'
    const [open, setOpen] = useState<DistrictKey | null>(null)
    const [failed, setFailed] = useState(false)
    const [intro, setIntro] = useState(false)
    const [forceCity, setForceCity] = useState(false)

    useEffect(() =>
    {
        try { if (!localStorage.getItem(INTRO_KEY)) setIntro(true) } catch { /* storage blocked */ }
    }, [])
    const closeIntro = () => { setIntro(false); try { localStorage.setItem(INTRO_KEY, '1') } catch { /* ignore */ } }

    const progress = useMemo(() => districtProgress(missions), [missions])
    const zones = useMemo(() => DISTRICTS.map((d) => ({ key: d.key, label: d.label, emoji: d.emoji, done: progress.get(d.key)!.done, total: progress.get(d.key)!.total })), [progress])
    const weekDone = missions.filter((m) => m.status === 'passed').length
    const showCity = !failed && (!lite || forceCity)

    return (
        <div className="space-y-3">
            {/* HUD */}
            <div className="hw-rise flex flex-wrap items-center gap-2">
                <Link href={base} className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted">
                    <ArrowLeft className="h-4 w-4" /> Campus home
                </Link>
                <div className="flex items-center gap-1 rounded-full border border-border bg-card p-0.5">
                    <WeekLink href={`${base}/world?week=${week - 1}`} disabled={week <= 1} label="Previous week"><ChevronLeft className="h-4 w-4" /></WeekLink>
                    <span className="px-2 text-sm font-bold tabular-nums text-foreground">Week {week}{week === currentWeek ? ' · now' : ''}</span>
                    <WeekLink href={`${base}/world?week=${week + 1}`} disabled={week >= totalWeeks} label="Next week"><ChevronRight className="h-4 w-4" /></WeekLink>
                </div>
                <span className="ml-auto inline-flex items-center gap-3 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-bold tabular-nums text-foreground">
                    <span className="inline-flex items-center gap-1"><Zap className="h-4 w-4 text-amber-500" />{xp.toLocaleString('en-NG')}</span>
                    <span className="inline-flex items-center gap-1"><Coins className="h-4 w-4 text-violet-500" />{tokens.toLocaleString('en-NG')}</span>
                    <span className="hidden items-center gap-1 sm:inline-flex"><Trophy className="h-4 w-4" style={{ color }} />{weekDone}/{missions.length} this week</span>
                </span>
            </div>

            {showCity ? (
                <div className="relative">
                    <CityView zones={zones} character={character} themeColor={color} paused={open !== null || intro} onZoneEnter={(k) => setOpen(k as DistrictKey)} onError={() => setFailed(true)} />
                    {intro && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-black/40 p-4 backdrop-blur-[2px]">
                            <div className="hw-pop w-full max-w-sm rounded-3xl bg-card p-5 shadow-2xl">
                                <div className="flex items-start justify-between gap-2">
                                    <h2 className="text-lg font-extrabold text-foreground">Welcome to Hubnovo World</h2>
                                    <button type="button" onClick={closeIntro} className="rounded-lg p-1 text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" /></button>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">Your avatar is in the Arrival Plaza. Each district holds this week’s quests:</p>
                                <ul className="mt-3 space-y-1.5 text-sm">
                                    {DISTRICTS.map((d) => (
                                        <li key={d.key} className="flex items-center gap-2">
                                            <span className="text-base">{d.emoji}</span>
                                            <span className="font-semibold text-foreground">{d.label}</span>
                                            {d.key === myDistrict && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: color }}>yours</span>}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-3 flex items-start gap-2 rounded-2xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                                    <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0" />
                                    Walk with WASD, the arrow keys or the joystick, or tap the ground. Walk into a district, or tap its label, to open it.
                                </p>
                                <button type="button" onClick={closeIntro} className="hw-press mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: color }}>
                                    Start exploring <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <section className="rounded-3xl border border-dashed border-border bg-card p-6 text-center">
                    <p className="text-sm font-semibold text-foreground">{failed ? 'The 3D world couldn’t load on this device.' : 'Lite mode is on, so the 3D world is paused to save data and battery.'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Open the districts below, or play from the Campus home.</p>
                    {!failed && <button type="button" onClick={() => setForceCity(true)} className="hw-press mt-3 rounded-full border border-border px-4 py-1.5 text-xs font-bold hover:bg-muted">Load the 3D world anyway</button>}
                </section>
            )}

            {/* District quick-jump */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {DISTRICTS.map((d, i) =>
                {
                    const p = progress.get(d.key)!
                    const mine = d.key === myDistrict
                    return (
                        <button
                            key={d.key}
                            type="button"
                            onClick={() => setOpen(d.key)}
                            className={`hw-rise hw-lift hw-press flex items-center gap-2.5 rounded-2xl border bg-card p-3 text-left hover:bg-muted/50 ${mine ? 'ring-1' : 'border-border'}`}
                            style={{ animationDelay: `${i * 50}ms`, ...(mine ? { borderColor: color, ['--tw-ring-color' as string]: color } : {}) }}
                        >
                            <span className="text-2xl" aria-hidden>{d.emoji}</span>
                            <span className="min-w-0">
                                <span className="block truncate text-xs font-bold text-foreground">{d.label}</span>
                                <span className="block text-[11px] text-muted-foreground">
                                    {p.total ? `${p.done}/${p.total} done${p.open ? ` · ${p.open} open` : ''}` : d.key === 'rewards_exchange' ? `${tokens} ${TOKENS_LABEL}` : 'Visit'}
                                </span>
                            </span>
                        </button>
                    )
                })}
            </div>

            <DistrictPanel
                district={open}
                onClose={() => setOpen(null)}
                onGo={setOpen}
                missions={missions}
                base={base}
                color={color}
                myDistrict={myDistrict}
                pathwayName={pathway.name}
                tokens={tokens}
                badges={badges}
                squad={squad}
                week={week}
            />
        </div>
    )
}

function WeekLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode })
{
    if (disabled) return <span className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/40">{children}</span>
    return <Link href={href} aria-label={label} className="hw-press flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-muted">{children}</Link>
}

// ─── District panel ──────────────────────────────────────────────────────────

function DistrictPanel({ district, onClose, onGo, missions, base, color, myDistrict, pathwayName, tokens, badges, squad, week }: {
    district: DistrictKey | null; onClose: () => void; onGo: (d: DistrictKey) => void; missions: WorldMissionLite[]; base: string; color: string
    myDistrict: DistrictKey; pathwayName: string; tokens: number; badges: number; squad: Props['squad']; week: number
})
{
    const def = DISTRICTS.find((d) => d.key === district) ?? null
    const list = district ? missions.filter((m) => districtOf(m) === district).sort((a, b) => a.day - b.day) : []
    const otherPathway = (district === 'career_district' || district === 'enterprise_hub') && district !== myDistrict

    return (
        <Dialog open={def !== null} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent
                className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-xl
                    max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0
                    max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:zoom-in-100"
            >
                {def && (
                    <>
                        <DialogHeader className="shrink-0 border-b border-border px-5 pb-4 pt-5 pr-12 text-left">
                            <DialogTitle className="flex items-center gap-2 text-lg"><span className="text-2xl">{def.emoji}</span>{def.label}</DialogTitle>
                            <DialogDescription>{def.blurb}</DialogDescription>
                        </DialogHeader>
                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                            {otherPathway ? (
                                <div className="rounded-2xl bg-muted p-4 text-sm">
                                    <p className="text-foreground">This district belongs to the other pathway. You’re on <span className="font-bold">{pathwayName}</span>, so your real-world tasks are in your own district.</p>
                                    <button type="button" onClick={() => onGo(myDistrict)} className="hw-press mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: color }}>
                                        Go to {DISTRICTS.find((d) => d.key === myDistrict)!.label} <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : district === 'rewards_exchange' ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-2xl bg-violet-500/10 p-3 text-center"><p className="text-2xl font-extrabold tabular-nums text-foreground">{tokens}</p><p className="text-xs text-muted-foreground">{TOKENS_LABEL}</p></div>
                                        <div className="rounded-2xl bg-amber-500/10 p-3 text-center"><p className="text-2xl font-extrabold tabular-nums text-foreground">{badges}</p><p className="text-xs text-muted-foreground">badges</p></div>
                                    </div>
                                    <p className="rounded-2xl border border-dashed border-border p-3 text-sm text-muted-foreground">The Rewards Exchange opens soon. Keep earning {TOKENS_LABEL}; you’ll spend them here on approved rewards.</p>
                                    <div className="flex flex-wrap gap-2">
                                        <PanelLink href={`${base}/certificates`} icon={Award}>My certificates</PanelLink>
                                        <PanelLink href={`${base}/passport`} icon={IdCard}>My Passport</PanelLink>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Week {week} quests here</p>
                                    {list.length === 0 ? (
                                        <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">No quests in this district this week.</p>
                                    ) : (
                                        <ul className="space-y-2">{list.map((m) => <QuestRow key={m.id} m={m} href={`${base}/missions/${m.id}`} color={color} />)}</ul>
                                    )}
                                    {district === 'competition_arena' && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <PanelLink href={`${base}/squad`} icon={Users}>{squad ? `${squad.name}${squad.needed ? ` (needs ${squad.needed})` : ''}` : 'Find a squad'}</PanelLink>
                                            <PanelLink href={`${base}/leaderboard`} icon={Trophy}>Leaderboard</PanelLink>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

function QuestRow({ m, href, color }: { m: WorldMissionLite; href: string; color: string })
{
    const st = STATUS_META[m.status]
    const Kind = KIND_META[m.kind].icon
    const locked = m.status === 'locked'
    const body = (
        <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1f`, color }}>{locked ? <Lock className="h-4 w-4" /> : <Kind className="h-4 w-4" />}</span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">{m.title}</span>
                <span className="block text-[11px] text-muted-foreground">
                    {DAY_NAMES[m.day - 1]} · {KIND_META[m.kind].label} · {m.estMinutes} min · +{m.xp} {XP_LABEL}
                    {locked ? ` · opens ${formatUnlock(m.unlocksAt)}` : ''}
                </span>
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.tone}`}>{st.label}</span>
        </span>
    )
    return (
        <li>
            {locked
                ? <div className="rounded-2xl border border-border p-3 opacity-70">{body}</div>
                : <Link href={href} className="hw-lift block rounded-2xl border border-border p-3 hover:bg-muted/50">{body}</Link>}
        </li>
    )
}

function PanelLink({ href, icon: Icon, children }: { href: string; icon: typeof Users; children: React.ReactNode })
{
    return (
        <Link href={href} className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
            <Icon className="h-3.5 w-3.5" /> {children}
        </Link>
    )
}
