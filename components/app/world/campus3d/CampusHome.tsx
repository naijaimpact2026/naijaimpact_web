'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
    ArrowRight, Award, ChevronLeft, ChevronRight, Coins, Flame, Gift, IdCard, Lock, MapPin, RotateCcw, Sparkles, Star, Trophy, User, Users, X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { characterPreviewUrl } from '@/lib/competitions/config'
import { DISTRICTS, HOSTS, districtStates, hqOf, type DistrictKey } from '@/lib/world/districts'
import type { DropView } from '@/lib/world/drops'
import { QUEST_SLOT_LABEL, TOKENS_LABEL, XP_LABEL, type MissionView, type Pathway, type WorldParticipantView } from '@/lib/world/types'
import { DAY_NAMES } from '@/lib/world/ui'
import { DROP_KEY } from '@/components/app/competitions/city3d/layout'
import type { CityZone } from '@/components/app/competitions/city3d/CityScene'
import DropDialog from './DropDialog'
import MePanel, { type MeSummary } from './MePanel'
import QuestSheet, { SHEET_CLS } from './QuestSheet'
import { Stars } from './Stars'
import { AT, H, STREET, Street, W } from './WorldEntryCard'

// three.js only loads in the browser, when the 3D Campus is shown.
const CityView = dynamic(() => import('@/components/app/competitions/city3d/CityView'), {
    ssr: false,
    loading: () => <div className={`${CITY_H} w-full animate-pulse rounded-3xl bg-muted`} />,
})

const CITY_H = 'h-[60vh] min-h-[380px] sm:h-[68vh] sm:min-h-[480px] max-h-[860px]'
const GUIDE_KEY = 'hubnovo:campus-guide-done'

export interface CampusHomeProps
{
    slug: string
    pathway: { key: Pathway; name: string; color: string }
    participant: WorldParticipantView
    me: MeSummary
    week: number
    currentWeek: number | null
    totalWeeks: number
    /** The shown week's quests (Play, Do, Show). */
    quests: MissionView[]
    /** Still-open quests from earlier weeks of this stage. */
    catchUp: MissionView[]
    drop: DropView | null
    squad: { name: string; members: number; needed: number } | null
    lite: boolean
    initialDistrict?: DistrictKey | null
    initialQuest?: string | null
}

type Sheet = { kind: 'quest'; id: string } | { kind: 'district'; key: DistrictKey } | { kind: 'drop' } | { kind: 'me' } | null

const isOpen = (m: MissionView) => m.status === 'available' || m.status === 'needs_revision'

/**
 * The Campus Competition home: the 3D Campus itself. Walk your avatar
 * between districts; each week's three quests (Play, Do, Show) open inside
 * the building they belong to, and a daily drop lands somewhere on the map.
 * Squad, rankings, rewards and "Me" sit in the top bar. Lite mode (or a
 * phone that can't run 3D) gets a tappable 2D map of the same districts.
 */
export default function CampusHome(props: CampusHomeProps)
{
    const { slug, pathway, participant, me, week, currentWeek, totalWeeks, quests, catchUp, drop, squad, lite, initialDistrict, initialQuest } = props
    const base = `/app/competitions/${slug}`
    const color = pathway.color
    const hq = hqOf(pathway.key)
    const everyQuest = useMemo(() => [...quests, ...catchUp.filter((c) => !quests.some((q) => q.id === c.id))], [quests, catchUp])

    const [sheet, setSheet] = useState<Sheet>(() =>
        initialQuest && everyQuest.some((q) => q.id === initialQuest) ? { kind: 'quest', id: initialQuest } : null)
    const [goTo, setGoTo] = useState<{ key: string; nonce: number } | null>(null)
    const pendingQuest = useRef<string | null>(null)
    const [failed, setFailed] = useState(false)
    const [forceCity, setForceCity] = useState(false)
    const [dropClaimed, setDropClaimed] = useState(Boolean(drop?.claimed))
    const [streak, setStreak] = useState(me.streak)
    const [guide, setGuide] = useState<1 | 2 | null>(null)
    const showCity = !failed && (!lite || forceCity)
    const dropLive = Boolean(drop?.enabled) && !dropClaimed

    // Re-sync when the server sends fresh data (after a submit or a claim).
    useEffect(() => { setDropClaimed(Boolean(drop?.claimed)) }, [drop?.claimed, drop?.day])
    useEffect(() => { setStreak(me.streak) }, [me.streak])

    // First visit: a two-step guide (drop, then the Academy).
    useEffect(() =>
    {
        if (initialDistrict || initialQuest) return
        try { if (!localStorage.getItem(GUIDE_KEY)) setGuide(drop?.enabled && !drop.claimed ? 1 : 2) } catch { /* storage blocked */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const finishGuide = () => { setGuide(null); try { localStorage.setItem(GUIDE_KEY, '1') } catch { /* ignore */ } }

    function pickQuest(k: DistrictKey): MissionView | null
    {
        const here = quests.filter((m) => m.district === k)
        return here.find(isOpen) ?? catchUp.find((m) => m.district === k && isOpen(m)) ?? here[0] ?? null
    }

    /** The avatar reached a door (or a marker/pin was tapped). */
    function enterDistrict(k: DistrictKey)
    {
        const wanted = pendingQuest.current ? everyQuest.find((m) => m.id === pendingQuest.current && m.district === k) : null
        pendingQuest.current = null
        const q = wanted ?? (k === 'rewards_exchange' ? null : pickQuest(k))
        setSheet(q ? { kind: 'quest', id: q.id } : { kind: 'district', key: k })
        if (guide === 2 && k === 'learning_academy') finishGuide()
    }

    function walk(key: string)
    {
        setSheet(null)
        setGoTo({ key, nonce: Date.now() })
    }
    function goToQuest(q: MissionView)
    {
        if (!showCity) { setSheet({ kind: 'quest', id: q.id }); return }
        pendingQuest.current = q.id
        walk(q.district)
    }
    function goToDistrict(k: DistrictKey)
    {
        if (!showCity) { enterDistrict(k); return }
        walk(k)
    }
    function goToDrop()
    {
        if (!showCity) { setSheet({ kind: 'drop' }); return }
        walk(DROP_KEY)
    }

    // Markers: open quest = beacon, done = check, locked = grey (same states the mobile API sends).
    const zones = useMemo<CityZone[]>(() => districtStates(quests, catchUp, pathway.key, me.tokens, TOKENS_LABEL)
        .map((d) => ({ key: d.key, label: d.label, emoji: d.emoji, done: d.done, total: d.total, state: d.state, note: d.note })), [quests, catchUp, pathway.key, me.tokens])

    const quest = sheet?.kind === 'quest' ? everyQuest.find((m) => m.id === sheet.id) ?? null : null
    const stage = me.stage

    return (
        <div className="space-y-3">
            {/* ─── Top bar ─────────────────────────────────────────────── */}
            <div className="hw-rise flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setSheet({ kind: 'me' })} className="hw-press flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-left shadow-sm hover:bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                    <img src={characterPreviewUrl(me.character)} alt="" className="h-8 w-8 rounded-full object-contain" style={{ backgroundColor: `${color}22` }} />
                    <span className="leading-tight">
                        <span className="block text-xs font-extrabold text-foreground">Level {me.level.level}</span>
                        <span className="block text-[10px] font-semibold text-muted-foreground">{me.level.name}</span>
                    </span>
                </button>
                <Pill icon={Flame} tone="text-orange-500" value={streak} label="day streak" />
                <Pill icon={Sparkles} tone="text-amber-500" value={me.xp.toLocaleString('en-NG')} label={XP_LABEL} />
                <Pill icon={Coins} tone="text-violet-500" value={me.tokens.toLocaleString('en-NG')} label={TOKENS_LABEL} />
                {stage && <Pill icon={Star} tone="fill-amber-400 text-amber-400" value={`${stage.stars}/${stage.maxStars}`} label={`stage ${stage.stage} stars`} />}

                <nav className="ml-auto flex items-center gap-1.5" aria-label="Campus">
                    <NavLink href={`${base}/squad`} icon={Users} label={squad ? squad.name : 'Squad'} badge={squad && squad.needed > 0 ? `+${squad.needed}` : null} />
                    <NavLink href={`${base}/leaderboard`} icon={Trophy} label="Rankings" />
                    <NavLink href={`${base}/rewards`} icon={Gift} label="Rewards" />
                    <button type="button" onClick={() => setSheet({ kind: 'me' })} className="hw-press inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-bold text-foreground shadow-sm hover:bg-muted">
                        <User className="h-4 w-4" style={{ color }} /><span className="hidden sm:inline">Me</span>
                    </button>
                </nav>
            </div>

            {/* ─── The Campus ──────────────────────────────────────────── */}
            {showCity ? (
                <div className="relative">
                    <CityView
                        zones={zones}
                        character={me.character}
                        themeColor={color}
                        paused={sheet !== null}
                        onZoneEnter={(k) => enterDistrict(k as DistrictKey)}
                        onError={() => setFailed(true)}
                        drop={dropLive && drop ? drop.tile : null}
                        onDrop={() => setSheet({ kind: 'drop' })}
                        goTo={goTo}
                        className={CITY_H}
                        hideHint
                    />
                    {/* Drop + guide overlays (top) */}
                    <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col items-start gap-2 pr-12">
                        {drop?.enabled && (dropLive ? (
                            <button type="button" onClick={goToDrop} className="hw-pop pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-[#102A43] shadow-md hover:bg-amber-300">
                                <Sparkles className="h-3.5 w-3.5" /> Today’s drop is on the map <span className="underline">Take me there</span>
                            </button>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                                <Flame className="h-3.5 w-3.5 text-orange-400" /> Drop claimed · {streak}-day streak
                            </span>
                        ))}
                        {guide && <Guide step={guide} color={color} onDrop={goToDrop} onAcademy={() => goToDistrict('learning_academy')} onSkip={finishGuide} />}
                    </div>
                    {/* This week (overlaid on large screens) */}
                    <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden lg:block">
                        <div className="pointer-events-auto mx-auto max-w-4xl">
                            <Tracker quests={quests} catchUp={catchUp} week={week} currentWeek={currentWeek} totalWeeks={totalWeeks} base={base} color={color} onGo={goToQuest} overlay />
                        </div>
                    </div>
                </div>
            ) : (
                <LiteMap color={color} zones={zones} failed={failed} onPick={(k) => enterDistrict(k)} onLoad3d={() => setForceCity(true)}
                    drop={drop?.enabled ? { live: dropLive, streak } : null} onDrop={() => setSheet({ kind: 'drop' })} />
            )}

            <div className={showCity ? 'lg:hidden' : ''}>
                <Tracker quests={quests} catchUp={catchUp} week={week} currentWeek={currentWeek} totalWeeks={totalWeeks} base={base} color={color} onGo={goToQuest} />
            </div>

            {/* ─── Sheets ──────────────────────────────────────────────── */}
            <QuestSheet slug={slug} quest={quest} color={color} onClose={() => setSheet(null)} />
            {drop?.enabled && (
                <DropDialog
                    key={drop.day}
                    slug={slug}
                    drop={drop}
                    open={sheet?.kind === 'drop'}
                    onClose={() => setSheet(null)}
                    onClaimed={(r) => { setDropClaimed(true); setStreak(r.streak); if (guide === 1) setGuide(2) }}
                />
            )}
            <MePanel slug={slug} open={sheet?.kind === 'me'} onClose={() => setSheet(null)} me={{ ...me, streak }} participant={participant} color={color} />
            <DistrictInfo
                district={sheet?.kind === 'district' ? sheet.key : null}
                onClose={() => setSheet(null)}
                base={base}
                color={color}
                hq={hq}
                pathwayName={pathway.name}
                tokens={me.tokens}
                badges={me.badges}
                squad={squad}
                onGoHq={() => goToDistrict(hq)}
            />
        </div>
    )
}

// ─── Top bar bits ────────────────────────────────────────────────────────────

function Pill({ icon: Icon, tone, value, label }: { icon: typeof Flame; tone: string; value: string | number; label: string })
{
    return (
        <span title={label} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-extrabold tabular-nums text-foreground shadow-sm">
            <Icon className={`h-4 w-4 ${tone}`} aria-hidden />{value}<span className="sr-only"> {label}</span>
        </span>
    )
}

function NavLink({ href, icon: Icon, label, badge }: { href: string; icon: typeof Users; label: string; badge?: string | null })
{
    return (
        <Link href={href} className="hw-press inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-bold text-foreground shadow-sm hover:bg-muted" aria-label={label}>
            <Icon className="h-4 w-4 text-muted-foreground" /><span className="hidden max-w-[9rem] truncate sm:inline">{label}</span>
            {badge && <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">{badge}</span>}
        </Link>
    )
}

// ─── This week: Play · Do · Show ─────────────────────────────────────────────

function Tracker({ quests, catchUp, week, currentWeek, totalWeeks, base, color, onGo, overlay }: {
    quests: MissionView[]; catchUp: MissionView[]; week: number; currentWeek: number | null; totalWeeks: number; base: string; color: string
    onGo: (q: MissionView) => void; overlay?: boolean
})
{
    const earlier = catchUp.filter((c) => !quests.some((q) => q.id === c.id))
    return (
        <section className={overlay ? 'rounded-3xl bg-white/85 p-2.5 shadow-xl backdrop-blur-md dark:bg-[#0b1a2b]/85' : 'hw-rise space-y-2'}>
            <div className={`flex items-center justify-between gap-2 ${overlay ? 'px-1.5 pb-2' : ''}`}>
                <h2 className="text-sm font-extrabold text-foreground">{week === currentWeek ? 'This week' : `Week ${week}`}</h2>
                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                    {week !== currentWeek && currentWeek && <Link href={base} className="mr-1 rounded-full px-2 py-1 hover:bg-muted">Back to this week</Link>}
                    <WeekLink href={`${base}?week=${week - 1}`} disabled={week <= 1} label="Previous week"><ChevronLeft className="h-4 w-4" /></WeekLink>
                    <span className="tabular-nums">Week {week}/{totalWeeks}</span>
                    <WeekLink href={`${base}?week=${week + 1}`} disabled={week >= totalWeeks} label="Next week"><ChevronRight className="h-4 w-4" /></WeekLink>
                </div>
            </div>
            {quests.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No quests for this week yet.</p>
            ) : (
                <ol className="grid gap-2 sm:grid-cols-3">
                    {quests.map((q) => <QuestCard key={q.id} q={q} color={color} onGo={() => onGo(q)} />)}
                </ol>
            )}
            {earlier.length > 0 && (
                <div className={`flex flex-wrap items-center gap-1.5 ${overlay ? 'px-1.5 pt-2' : 'pt-1'}`}>
                    <span className="text-xs font-bold text-muted-foreground">Catch up:</span>
                    {earlier.slice(0, 4).map((q) => (
                        <button key={q.id} type="button" onClick={() => onGo(q)} className="hw-press inline-flex max-w-[14rem] items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-muted">
                            <RotateCcw className="h-3 w-3 shrink-0" /><span className="truncate">W{q.week} {q.slot ? QUEST_SLOT_LABEL[q.slot] : ''}: {q.title}</span>
                        </button>
                    ))}
                </div>
            )}
        </section>
    )
}

const SLOT_TONE: Record<string, string> = { play: '#0EA5E9', do: '', show: '#D97706' }

function QuestCard({ q, color, onGo }: { q: MissionView; color: string; onGo: () => void })
{
    const tone = (q.slot && SLOT_TONE[q.slot]) || color
    const open = isOpen(q)
    const status = q.status === 'passed' ? <Stars n={q.stars} size="h-3.5 w-3.5" />
        : q.status === 'locked' ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground"><Lock className="h-3 w-3" />Opens {DAY_NAMES[q.day - 1]}</span>
            : q.status === 'in_review' ? <span className="text-[11px] font-bold text-sky-600">In review</span>
                : q.status === 'needs_revision' ? <span className="text-[11px] font-bold text-amber-600">Try again</span>
                    : q.status === 'rejected' ? <span className="text-[11px] font-bold text-muted-foreground">Closed</span>
                        : <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ backgroundColor: tone }}>Go <ArrowRight className="h-3 w-3" /></span>
    return (
        <li>
            <button
                type="button"
                onClick={onGo}
                className={`hw-press hw-lift flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left hover:bg-muted/50 ${open ? 'shadow-md' : ''}`}
                style={{ borderColor: open ? tone : undefined }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                <img src={characterPreviewUrl(q.host.character)} alt="" className={`h-11 w-11 shrink-0 rounded-xl object-contain ${q.status === 'locked' ? 'opacity-50 grayscale' : ''}`} style={{ backgroundColor: `${tone}1f` }} />
                <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: tone }}>{q.slot ? QUEST_SLOT_LABEL[q.slot] : 'Quest'} · {DAY_NAMES[q.day - 1]}</span>
                    <span className="block truncate text-sm font-bold text-foreground">{q.title}</span>
                    <span className="mt-0.5 flex items-center gap-2">{status}<span className="text-[11px] text-muted-foreground">{q.estMinutes} min · +{q.xp} {XP_LABEL}</span></span>
                </span>
            </button>
        </li>
    )
}

function WeekLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode })
{
    if (disabled) return <span className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/40">{children}</span>
    return <Link href={href} aria-label={label} className="hw-press flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted">{children}</Link>
}

// ─── First-visit guide ───────────────────────────────────────────────────────

function Guide({ step, color, onDrop, onAcademy, onSkip }: { step: 1 | 2; color: string; onDrop: () => void; onAcademy: () => void; onSkip: () => void })
{
    return (
        <div className="hw-pop pointer-events-auto w-full max-w-sm rounded-2xl bg-card/95 p-3.5 shadow-xl ring-1 ring-border backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-extrabold text-foreground">{step === 1 ? 'Welcome to the Campus!' : 'Your quests live in the buildings'}</p>
                <button type="button" onClick={onSkip} className="rounded-lg p-0.5 text-muted-foreground hover:bg-muted" aria-label="Close the guide"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
                {step === 1
                    ? 'A drop lands somewhere on the map every day. Walk to the glowing coin to claim it and start your streak.'
                    : 'Three quests a week: Play on Monday in the Academy, Do on Wednesday at your HQ, Show on Sunday in the Arena. Buildings with a bouncing marker have a quest open.'}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
                <button type="button" onClick={step === 1 ? onDrop : onAcademy} className="hw-press inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: color }}>
                    <MapPin className="h-3.5 w-3.5" /> {step === 1 ? 'Take me to the drop' : 'Take me to the Academy'}
                </button>
                <span className="text-[11px] text-muted-foreground">Step {step} of 2</span>
            </div>
        </div>
    )
}

// ─── Lite mode: tappable 2D map ──────────────────────────────────────────────

function LiteMap({ color, zones, failed, onPick, onLoad3d, drop, onDrop }: {
    color: string; zones: CityZone[]; failed: boolean; onPick: (k: DistrictKey) => void; onLoad3d: () => void
    drop: { live: boolean; streak: number } | null; onDrop: () => void
})
{
    const byKey = new Map(zones.map((z) => [z.key, z]))
    return (
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="relative aspect-[600/220] min-h-[190px] w-full overflow-hidden bg-[#bfe6f7]">
                <Street color={color} />
                {STREET.map((key) =>
                {
                    const z = byKey.get(key)!
                    const bg = z.state === 'done' ? '#16a34a' : z.state === 'open' ? '#F59E0B' : z.state === 'locked' ? '#64748b' : '#102A43'
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onPick(key)}
                            className="absolute z-[2] flex -translate-x-1/2 flex-col items-center"
                            style={{ left: `${(AT[key].x / W) * 100}%`, top: `${(AT[key].y / H) * 100}%` }}
                            aria-label={`${z.label}: ${z.note ?? ''}`}
                        >
                            <span className={`relative flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white text-base shadow-lg ${z.state === 'open' ? 'motion-safe:animate-bounce' : ''}`} style={{ backgroundColor: bg }}>
                                {z.state === 'done' ? '✓' : z.emoji}
                            </span>
                            <span className="mt-1 hidden flex-col items-center rounded-xl bg-[#102A43]/90 px-2 py-0.5 leading-tight text-white shadow sm:flex">
                                <span className="whitespace-nowrap text-[11px] font-bold">{z.label}</span>
                                {z.note && <span className={`whitespace-nowrap text-[10px] font-semibold ${z.state === 'open' ? 'text-amber-300' : 'text-white/75'}`}>{z.note}</span>}
                            </span>
                        </button>
                    )
                })}
                {drop?.live && (
                    <button type="button" onClick={onDrop} className="absolute bottom-[6%] left-1/2 z-[3] -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-[#102A43] shadow-md motion-safe:animate-bounce">
                        <Sparkles className="mr-1 inline h-3.5 w-3.5" />Today’s drop
                    </button>
                )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
                <span>{failed ? 'The 3D Campus couldn’t load on this device, so here is the map.' : 'Lite mode is on: tap a building to open it.'}{drop && !drop.live ? ` Drop claimed · ${drop.streak}-day streak.` : ''}</span>
                {!failed && <button type="button" onClick={onLoad3d} className="hw-press rounded-full border border-border px-3 py-1 font-bold text-foreground hover:bg-muted">Load the 3D Campus</button>}
            </div>
        </section>
    )
}

// ─── Buildings without a quest ───────────────────────────────────────────────

function DistrictInfo({ district, onClose, base, color, hq, pathwayName, tokens, badges, squad, onGoHq }: {
    district: DistrictKey | null; onClose: () => void; base: string; color: string; hq: DistrictKey; pathwayName: string
    tokens: number; badges: number; squad: CampusHomeProps['squad']; onGoHq: () => void
})
{
    const def = DISTRICTS.find((d) => d.key === district) ?? null
    const host = district ? HOSTS[district] : null
    const otherHq = (district === 'career_district' || district === 'enterprise_hub') && district !== hq
    return (
        <Dialog open={def !== null} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className={SHEET_CLS}>
                {def && host && (
                    <>
                        <DialogHeader className="shrink-0 border-b border-border px-5 pb-4 pt-5 pr-12 text-left">
                            <div className="flex items-end gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                                <img src={characterPreviewUrl(host.character)} alt="" className="-mb-1 h-14 w-14 shrink-0 object-contain" />
                                <div className="min-w-0">
                                    <DialogTitle className="flex items-center gap-2 text-lg"><span aria-hidden>{def.emoji}</span>{def.label}</DialogTitle>
                                    <DialogDescription>{def.blurb}</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="space-y-3 px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                            {otherHq ? (
                                <div className="rounded-2xl bg-muted p-4 text-sm">
                                    <p className="text-foreground">This is the other pathway’s HQ. You’re on <b>{pathwayName}</b>, so your Wednesday tasks are at your own HQ.</p>
                                    <button type="button" onClick={onGoHq} className="hw-press mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: color }}>
                                        Take me to my HQ <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : district === 'rewards_exchange' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-2xl bg-violet-500/10 p-3 text-center"><p className="text-2xl font-extrabold tabular-nums text-foreground">{tokens}</p><p className="text-xs text-muted-foreground">{TOKENS_LABEL}</p></div>
                                        <div className="rounded-2xl bg-amber-500/10 p-3 text-center"><p className="text-2xl font-extrabold tabular-nums text-foreground">{badges}</p><p className="text-xs text-muted-foreground">badges</p></div>
                                    </div>
                                    <Link href={`${base}/rewards`} className="hw-press flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)' }}>
                                        <Gift className="h-4 w-4" /> Open the Rewards Exchange <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <div className="flex flex-wrap gap-2">
                                        <InfoLink href={`${base}/certificates`} icon={Award}>My certificates</InfoLink>
                                        <InfoLink href={`${base}/passport`} icon={IdCard}>My Passport</InfoLink>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">No quest here this week. Check the tracker below to see what’s open.</p>
                                    {district === 'competition_arena' && (
                                        <div className="flex flex-wrap gap-2">
                                            <InfoLink href={`${base}/squad`} icon={Users}>{squad ? `${squad.name}${squad.needed ? ` (needs ${squad.needed})` : ''}` : 'Find a squad'}</InfoLink>
                                            <InfoLink href={`${base}/leaderboard`} icon={Trophy}>Rankings</InfoLink>
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

function InfoLink({ href, icon: Icon, children }: { href: string; icon: typeof Users; children: React.ReactNode })
{
    return (
        <Link href={href} className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
            <Icon className="h-3.5 w-3.5" /> {children}
        </Link>
    )
}
