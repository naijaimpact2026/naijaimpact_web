'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { List, Map as MapIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { normalizeAvatar, type AvatarConfig, type CompetitionZone, type MissionView } from '@/lib/competitions/config'
import { competitionIcon } from '@/lib/competitions/icons'
import MissionCard from './MissionCard'
import RewardsHub from './RewardsHub'

// The 3D city (three.js) only loads when the city view is actually shown (never on the server).
const CityView = dynamic(() => import('./city3d/CityView'), {
    ssr: false,
    loading: () => <div className="h-[78vh] min-h-[460px] max-h-[920px] w-full animate-pulse rounded-3xl bg-muted" />,
})

type View = 'city' | 'list'
const VIEW_KEY = 'hubnovo:competition-view'

interface Props
{
    themeColor: string
    prizeNote: string | null
    zones: CompetitionZone[]
    missions: MissionView[]
    joined: boolean
    seasonOpen: boolean
    myXp: number
    avatar: AvatarConfig | null
}

/** Light phones / data saver start in the list ("Lite mode"); everyone can switch. */
function defaultView(): View
{
    try
    {
        const saved = localStorage.getItem(VIEW_KEY)
        if (saved === 'city' || saved === 'list') return saved
    } catch { /* storage blocked */ }
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } }
    if (nav.connection?.saveData || ['slow-2g', '2g'].includes(nav.connection?.effectiveType ?? '')) return 'list'
    if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return 'list'
    return 'city'
}

export default function CompetitionWorld({ themeColor, prizeNote, zones, missions, joined, seasonOpen, myXp, avatar }: Props)
{
    const [view, setView] = useState<View | null>(null)
    const [openZone, setOpenZone] = useState<string | null>(null)
    const [cityFailed, setCityFailed] = useState(false)

    useEffect(() => { setView(defaultView()) }, [])

    function choose(v: View)
    {
        setView(v)
        try { localStorage.setItem(VIEW_KEY, v) } catch { /* ignore */ }
    }

    const groups = useMemo(() =>
    {
        const zoned = zones.map((z) => ({ zone: z, missions: missions.filter((m) => m.zone_key === z.key) }))
        const loose = missions.filter((m) => !m.zone_key || !zones.some((z) => z.key === m.zone_key))
        return { zoned, loose }
    }, [zones, missions])

    const cityZones = useMemo(
        () => groups.zoned.map(({ zone, missions: list }) => ({ key: zone.key, label: zone.label, done: list.filter((m) => m.completed).length, total: list.length })),
        [groups],
    )

    const character = normalizeAvatar(avatar).character

    const active = groups.zoned.find((g) => g.zone.key === openZone) ?? null
    const showCity = view === 'city' && !cityFailed

    const renderZoneBody = (zoneKey: string, list: MissionView[]) =>
        zoneKey === 'rewards_hub' && list.length === 0
            ? <RewardsHub xp={myXp} themeColor={themeColor} prizeNote={prizeNote} />
            : list.map((m) => <MissionCard key={m.id} mission={m} joined={joined} seasonOpen={seasonOpen} themeColor={themeColor} />)

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-foreground">{showCity ? 'The City' : 'Missions'}</h2>
                <div className="inline-flex rounded-full border border-border bg-card p-0.5" role="tablist" aria-label="View">
                    {([['city', MapIcon, 'City'], ['list', List, 'Lite']] as const).map(([v, Icon, label]) => (
                        <button
                            key={v}
                            type="button"
                            role="tab"
                            aria-selected={view === v}
                            onClick={() => choose(v)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${view === v ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Icon className="h-3.5 w-3.5" /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {!seasonOpen && <p className="text-xs font-semibold text-muted-foreground">The season isn’t open right now. Missions unlock when it starts.</p>}
            {cityFailed && view === 'city' && <p className="text-xs text-muted-foreground">The city couldn’t load on this device, so here’s the Lite view.</p>}

            {view === null ? (
                <div className="h-[78vh] min-h-[460px] max-h-[920px] w-full animate-pulse rounded-3xl bg-muted" />
            ) : showCity ? (
                <>
                    <CityView
                        zones={cityZones}
                        character={character}
                        themeColor={themeColor}
                        paused={openZone !== null}
                        onZoneEnter={setOpenZone}
                        onError={() => setCityFailed(true)}
                    />
                    {/* Quick-jump chips: same panels without walking */}
                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                        {groups.zoned.map(({ zone }, i) =>
                        {
                            const Icon = competitionIcon(zone.icon)
                            const z = cityZones[i]
                            return (
                                <button
                                    key={zone.id}
                                    type="button"
                                    onClick={() => setOpenZone(zone.key)}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                                >
                                    <Icon className="h-3.5 w-3.5" style={{ color: themeColor }} /> {zone.label}
                                    {z.total > 0 && <span className="tabular-nums text-muted-foreground">{z.done}/{z.total}</span>}
                                </button>
                            )
                        })}
                    </div>
                    {groups.loose.length > 0 && <div className="space-y-2">{groups.loose.map((m) => <MissionCard key={m.id} mission={m} joined={joined} seasonOpen={seasonOpen} themeColor={themeColor} />)}</div>}
                </>
            ) : (
                <>
                    {groups.zoned.filter((g) => g.missions.length > 0 || g.zone.key === 'rewards_hub').map(({ zone, missions: list }) =>
                    {
                        const Icon = competitionIcon(zone.icon)
                        return (
                            <div key={zone.id} className="rounded-3xl border border-border bg-card/60 p-3 sm:p-4 space-y-2.5">
                                <div className="flex items-center gap-3 px-1">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${themeColor}22`, color: themeColor }}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-foreground">{zone.label}</h3>
                                        {zone.description && <p className="text-xs text-muted-foreground">{zone.description}</p>}
                                    </div>
                                    {list.length > 0 && (
                                        <span className="ml-auto shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
                                            {list.filter((m) => m.completed).length}/{list.length}
                                        </span>
                                    )}
                                </div>
                                {renderZoneBody(zone.key, list)}
                            </div>
                        )
                    })}
                    {groups.loose.length > 0 && (
                        <div className="rounded-3xl border border-border bg-card/60 p-3 sm:p-4 space-y-2.5">
                            <h3 className="px-1 text-sm font-bold text-foreground">More missions</h3>
                            {groups.loose.map((m) => <MissionCard key={m.id} mission={m} joined={joined} seasonOpen={seasonOpen} themeColor={themeColor} />)}
                        </div>
                    )}
                </>
            )}

            {/* Building panel: centred dialog on desktop, bottom sheet on phones. */}
            <Dialog open={active !== null} onOpenChange={(o) => { if (!o) setOpenZone(null) }}>
                <DialogContent
                    className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl rounded-3xl
                        max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0
                        max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:zoom-in-100"
                >
                    {active && (
                        <>
                            <DialogHeader className="shrink-0 border-b border-border px-5 pt-5 pb-4 pr-12 text-left">
                                <DialogTitle className="flex items-center gap-2">
                                    {(() => { const Icon = competitionIcon(active.zone.icon); return <Icon className="h-5 w-5" style={{ color: themeColor }} /> })()}
                                    {active.zone.label}
                                </DialogTitle>
                                {active.zone.description && <DialogDescription>{active.zone.description}</DialogDescription>}
                            </DialogHeader>
                            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                                {!joined && <p className="rounded-2xl bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">Join the competition above to start these missions.</p>}
                                {active.missions.length === 0 && active.zone.key !== 'rewards_hub'
                                    ? <p className="text-sm text-muted-foreground">No missions here yet.</p>
                                    : renderZoneBody(active.zone.key, active.missions)}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    )
}
