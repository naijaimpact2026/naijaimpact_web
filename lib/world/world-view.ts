import type { User } from '@/lib/types'
import { CHARACTERS, characterModelUrl, characterPreviewUrl } from '@/lib/competitions/config'
import {
    CENTER, N, ROAD_LINES, SPAWN, assignSlots, buildRoads, buildWorldGrid, idx, type DecorItem, type RoadTile, type Slot,
} from '@/components/app/competitions/city3d/layout'
import { DISTRICTS, HOSTS, districtStates, type DistrictKey, type DistrictState, type QuestHost } from './districts'
import { getTodayDrop, type DropView } from './drops'
import { getCompetitionDetail, getProgress, listQuests, todayQuests, type Result } from './service'
import { squadSummary } from './squads'
import { TOKENS_LABEL, type MissionView, type ProgressView, type StageScore } from './types'

/*
 * Everything the mobile app needs to draw the 3D Campus home in one call:
 * the HUD, this week's three quests, what each district shows, today's drop,
 * the squad, and the world layout (grid, roads, building slots, decor, which
 * tiles are walkable) plus the URLs of the same low-poly models the web uses.
 * The layout is deterministic, so web and mobile show the same Campus.
 */

export interface WorldLayout
{
    /** Grid is N × N tiles; tile (x, z) has its centre at world (x − N/2 + 0.5, z − N/2 + 0.5). x → east, z → south. */
    gridSize: number
    tileSize: 1
    roadLines: number[]
    center: { x: number; z: number }
    spawn: { x: number; z: number }
    roads: RoadTile[]
    /** One building slot per district: footprint [x0, x1) × [z0, z1), the door tile and facing (radians, 0 = +z). */
    districts: { key: DistrictKey; style: Slot['style']; x0: number; z0: number; x1: number; z1: number; door: { x: number; z: number }; facing: number }[]
    decor: DecorItem[]
    /** N strings of N chars: '1' = can't walk there, '0' = walkable. blocked[z][x]. */
    blocked: string[]
}

export interface WorldAssets
{
    /** Base URL of the GLB models (CC0, Kenney). */
    baseUrl: string
    models: Record<string, string | string[]>
    /** 12 avatar characters; index = `character` used by players and hosts. */
    characters: { index: number; model: string; preview: string }[]
}

export interface WorldScreen
{
    hud: {
        level: ProgressView['level']; xp: number; tokens: number; rank: number | null; streak: number; badges: number
        stage: StageScore | null
    }
    week: { number: number; current: number | null; total: number; quests: MissionView[] }
    /** Still-open quests from earlier weeks of this stage. */
    catchUp: MissionView[]
    districts: (DistrictState & { blurb: string; host: QuestHost })[]
    drop: DropView | null
    squad: { name: string; members: number; needed: number } | null
    me: { character: number; pathway: string; lite: boolean; reducedMotion: boolean }
    layout: WorldLayout
    assets: WorldAssets
}

let layoutCache: WorldLayout | null = null
export function campusLayout(): WorldLayout
{
    if (layoutCache) return layoutCache
    const placed = assignSlots(DISTRICTS.map((d) => ({ key: d.key })))
    const grid = buildWorldGrid(placed)
    const blocked = Array.from({ length: N }, (_, z) => Array.from({ length: N }, (_, x) => (grid.blocked[idx(x, z)] ? '1' : '0')).join(''))
    layoutCache = {
        gridSize: N, tileSize: 1, roadLines: [...ROAD_LINES], center: { x: CENTER, z: CENTER }, spawn: { ...SPAWN },
        roads: buildRoads(),
        districts: placed.map(({ zone, slot }) => ({ key: zone.key as DistrictKey, style: slot.style, x0: slot.x0, z0: slot.z0, x1: slot.x1, z1: slot.z1, door: { ...slot.door }, facing: slot.facing })),
        decor: grid.decor,
        blocked,
    }
    return layoutCache
}

function campusAssets(origin: string): WorldAssets
{
    const A = `${origin}/competitions/city`
    return {
        baseUrl: A,
        models: {
            road: `${A}/roads/road-straight.glb`, crossroad: `${A}/roads/road-crossroad.glb`, roundabout: `${A}/roads/road-roundabout.glb`, light: `${A}/roads/light-curved.glb`,
            palm: `${A}/nature/tree_palm.glb`, palmTall: `${A}/nature/tree_palmTall.glb`, bush: `${A}/nature/plant_bushLarge.glb`,
            flower: [`${A}/nature/flower_redA.glb`, `${A}/nature/flower_yellowA.glb`],
            shop: ['a', 'c', 'e', 'g', 'h', 'k', 'l', 'm'].map((k) => `${A}/commercial/building-${k}.glb`),
            house: ['a', 'c', 'f', 'k'].map((k) => `${A}/suburban/building-type-${k}.glb`),
            tall: ['b', 'c', 'e'].map((k) => `${A}/commercial/building-skyscraper-${k}.glb`),
            skyscraper: ['a', 'b', 'c', 'e'].map((k) => `${A}/commercial/building-skyscraper-${k}.glb`),
            cars: ['taxi', 'van', 'sedan', 'delivery', 'suv', 'truck'].map((k) => `${A}/cars/${k}.glb`),
        },
        characters: CHARACTERS.map((_, i) => ({ index: i, model: `${origin}${characterModelUrl(i)}`, preview: `${origin}${characterPreviewUrl(i)}` })),
    }
}

/** GET /api/competitions/:slug/world — the whole Campus home screen for the mobile app. */
export async function getWorldScreen(slug: string, profile: User, opts: { week?: number; origin: string }): Promise<Result<{ world: WorldScreen }>>
{
    const detail = await getCompetitionDetail(slug, profile)
    if (!detail.ok) return detail
    const c = detail.competition
    const me = c.me
    if (!me) return { ok: false, error: 'Join the competition first.' }

    const [progressRes, todayRes, weekRes, squad, dropRes] = await Promise.all([
        getProgress(slug, profile),
        todayQuests(slug, profile),
        listQuests(slug, profile, opts.week),
        squadSummary(c.id, profile.id),
        getTodayDrop(slug, profile),
    ])
    if (!weekRes.ok) return weekRes
    const progress = progressRes.ok ? progressRes.progress : null
    const shownWeek = weekRes.week ?? 1
    const quests = weekRes.missions.filter((m) => m.slot !== null).sort((a, b) => a.day - b.day)
    const catchUp = (todayRes.ok ? todayRes.catchUp : []).filter((m) => m.slot !== null && m.week !== shownWeek)
    const tokens = progress?.tokens ?? 0
    const blurbs = new Map(DISTRICTS.map((d) => [d.key, d.blurb]))

    return {
        ok: true,
        world: {
            hud: {
                level: progress?.level ?? { level: 1, name: 'Newcomer', xpToNext: 0, progress: 0 },
                xp: progress?.xp ?? 0, tokens, rank: progress?.rank ?? null, streak: progress?.streak ?? 0, badges: progress?.badges.length ?? 0,
                stage: progress?.stages.find((s) => s.stage === (c.clock.stage ?? 1)) ?? progress?.stages[0] ?? null,
            },
            week: { number: shownWeek, current: c.clock.week, total: c.weeks, quests },
            catchUp,
            districts: districtStates(quests, catchUp, me.pathway, tokens, TOKENS_LABEL).map((d) => ({ ...d, blurb: blurbs.get(d.key) ?? '', host: HOSTS[d.key] })),
            drop: dropRes.ok ? dropRes.drop : null,
            squad,
            me: { character: me.avatar.character, pathway: me.pathway, lite: Boolean(me.accessibility.lite), reducedMotion: Boolean(me.accessibility.reducedMotion) },
            layout: campusLayout(),
            assets: campusAssets(opts.origin),
        },
    }
}
