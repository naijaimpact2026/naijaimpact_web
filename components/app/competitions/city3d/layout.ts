/*
 * City layout as plain data (no three.js) — grid, roads, landmark slots,
 * decor and pathfinding. One tile = 1 world unit; the grid is centred on
 * the origin, x → east, z → south.
 */

export const N = 21
export const HALF = N / 2
export const ROAD_LINES = [3, 10, 17] as const
export const CENTER = 10

/** World position of a tile centre. */
export const tileToWorld = (i: number) => i - HALF + 0.5
export const worldToTile = (v: number) => Math.floor(v + HALF)
export const idx = (x: number, z: number) => z * N + x
export const inside = (x: number, z: number) => x >= 0 && z >= 0 && x < N && z < N

export type RoadPiece = 'straight' | 'crossroad' | 'roundabout'
export interface RoadTile { x: number; z: number; piece: RoadPiece; rot: number }

export type LandmarkStyle = 'market' | 'tower' | 'logistics' | 'arena' | 'trophy' | 'plaza' | 'academy'

export interface Slot
{
    /** Footprint (tiles, inclusive start, exclusive end). */
    x0: number; z0: number; x1: number; z1: number
    /** Walk here to "enter". */
    door: { x: number; z: number }
    /** Direction the building faces (radians, 0 = +z/south). */
    facing: number
    style: LandmarkStyle
}

// The four city blocks around the roundabout, then the roundabout island.
// Blocks are tiles 4–9 / 11–16; the building fills 5 rows, the row nearest
// the centre road stays free as a walkway with the door on it.
export const SLOTS: Slot[] = [
    { x0: 4, z0: 4, x1: 10, z1: 9, door: { x: 6, z: 9 }, facing: 0, style: 'market' },
    { x0: 11, z0: 4, x1: 17, z1: 9, door: { x: 14, z: 9 }, facing: 0, style: 'tower' },
    { x0: 4, z0: 12, x1: 10, z1: 17, door: { x: 6, z: 11 }, facing: Math.PI, style: 'logistics' },
    { x0: 11, z0: 12, x1: 17, z1: 17, door: { x: 14, z: 11 }, facing: Math.PI, style: 'arena' },
    { x0: CENTER, z0: CENTER, x1: CENTER + 1, z1: CENTER + 1, door: { x: CENTER, z: CENTER }, facing: 0, style: 'trophy' },
]

const STYLE_BY_KEY: Record<string, LandmarkStyle> = {
    market_square: 'market',
    training_hub: 'tower',
    logistics_hub: 'logistics',
    showcase_arena: 'arena',
    rewards_hub: 'trophy',
    // Hubnovo World (Campus) districts
    learning_academy: 'academy',
    career_district: 'tower',
    enterprise_hub: 'market',
    competition_arena: 'arena',
    rewards_exchange: 'trophy',
}

/** Assign zones to slots. Rewards goes on the roundabout island; others fill the blocks in order. */
export function assignSlots<T extends { key: string }>(zones: T[]): { zone: T; slot: Slot }[]
{
    const out: { zone: T; slot: Slot }[] = []
    const blockSlots = SLOTS.filter((s) => s.style !== 'trophy')
    const island = SLOTS.find((s) => s.style === 'trophy')!
    let b = 0
    for (const zone of zones)
    {
        if (STYLE_BY_KEY[zone.key] === 'trophy' && !out.some((o) => o.slot === island)) out.push({ zone, slot: island })
        else if (b < blockSlots.length)
        {
            const base = blockSlots[b++]
            out.push({ zone, slot: { ...base, style: STYLE_BY_KEY[zone.key] && STYLE_BY_KEY[zone.key] !== 'trophy' ? STYLE_BY_KEY[zone.key] : base.style } })
        }
    }
    return out
}

// ─── Roads ───────────────────────────────────────────────────────────────────

export function buildRoads(): RoadTile[]
{
    const tiles: RoadTile[] = []
    const isLine = (v: number) => (ROAD_LINES as readonly number[]).includes(v)
    const inRoundabout = (x: number, z: number) => Math.abs(x - CENTER) <= 1 && Math.abs(z - CENTER) <= 1
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++)
    {
        const h = isLine(z), v = isLine(x)
        if (!h && !v) continue
        if (inRoundabout(x, z)) continue
        if (h && v) tiles.push({ x, z, piece: 'crossroad', rot: 0 })
        else tiles.push({ x, z, piece: 'straight', rot: h ? Math.PI / 2 : 0 })
    }
    tiles.push({ x: CENTER, z: CENTER, piece: 'roundabout', rot: 0 })
    return tiles
}

export function isRoad(x: number, z: number)
{
    return (ROAD_LINES as readonly number[]).includes(x) || (ROAD_LINES as readonly number[]).includes(z)
}

// ─── Decor (deterministic) ───────────────────────────────────────────────────

export interface DecorItem { kind: 'palm' | 'palmTall' | 'palmBend' | 'bush' | 'flower' | 'house' | 'shop' | 'tall' | 'light'; x: number; z: number; rot: number; variant: number }

function rng(seed: number) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) }

export function buildDecor(occupied: (x: number, z: number) => boolean): DecorItem[]
{
    const rand = rng(2026)
    const items: DecorItem[] = []
    const taken = new Set<number>()
    const free = (x: number, z: number) => inside(x, z) && !isRoad(x, z) && !occupied(x, z) && !taken.has(idx(x, z))
    const put = (kind: DecorItem['kind'], x: number, z: number, rot = 0, variant = 0) =>
    {
        if (!free(x, z)) return
        taken.add(idx(x, z))
        items.push({ kind, x, z, rot, variant })
    }

    // Outer ring: a low skyline of shops/houses with palms between.
    for (let i = 0; i < N; i++)
    {
        for (const [x, z, rot] of [[i, 1, 0], [i, N - 2, Math.PI], [1, i, Math.PI / 2], [N - 2, i, -Math.PI / 2]] as const)
        {
            const r = rand()
            if (r < 0.45) put(rand() < 0.5 ? 'shop' : 'house', x, z, rot, Math.floor(rand() * 8))
            else if (r < 0.62) put('tall', x, z, rot, Math.floor(rand() * 4))
            else if (r < 0.85) put(rand() < 0.5 ? 'palmTall' : 'palm', x, z, rand() * 6.28)
        }
        for (const [x, z] of [[i, 0], [i, N - 1], [0, i], [N - 1, i], [i, 2], [i, N - 3], [2, i], [N - 3, i]] as const)
        {
            const r = rand()
            if (r < 0.35) put(['palm', 'palmBend', 'bush'][Math.floor(rand() * 3)] as DecorItem['kind'], x, z, rand() * 6.28)
            else if (r < 0.45) put('flower', x, z, rand() * 6.28, Math.floor(rand() * 2))
        }
    }

    // Street lights + palms along the inner roads.
    for (const line of ROAD_LINES) for (let i = 4; i < N - 4; i += 3)
    {
        put('light', i, line - 1, 0)
        put(rand() < 0.5 ? 'palmTall' : 'palm', i + 1, line + 1, rand() * 6.28)
    }
    return items
}

// ─── The walkable grid (shared by the 3D scene, the server and the mobile API) ─

/** Key used for the daily drop in door / walk-to handling. */
export const DROP_KEY = '__drop__'

/** Where the player appears: the Arrival Plaza, just west of the roundabout. */
export const SPAWN = { x: CENTER - 3, z: CENTER }

export interface WorldGrid
{
    /** 1 = can't walk there (building, decor, map edge). Index with idx(x, z). */
    blocked: Uint8Array
    /** Walk onto a door to enter that zone. */
    doors: { key: string; x: number; z: number }[]
    decor: DecorItem[]
}

/** Blocked tiles, doors and decor for a set of placed zones (pure, deterministic). */
export function buildWorldGrid<T extends { key: string }>(placed: { zone: T; slot: Slot }[]): WorldGrid
{
    const blocked = new Uint8Array(N * N)
    const occupiedBy = (x: number, z: number) => placed.some(({ slot }) => slot.style !== 'trophy' && x >= slot.x0 && x < slot.x1 && z >= Math.min(slot.z0, slot.door.z) && z <= Math.max(slot.z1 - 1, slot.door.z))
    for (const { slot } of placed)
    {
        if (slot.style === 'trophy') continue
        // Building rows (everything except the walkway row with the door).
        for (let z = slot.z0; z < slot.z1; z++) for (let x = slot.x0; x < slot.x1; x++)
            if (z !== slot.door.z) blocked[idx(x, z)] = 1
    }
    const decor = buildDecor(occupiedBy)
    for (const d of decor) if (d.kind !== 'flower') blocked[idx(d.x, d.z)] = 1
    // Map edges are scenery.
    for (let i = 0; i < N; i++) { blocked[idx(i, 0)] = blocked[idx(i, N - 1)] = blocked[idx(0, i)] = blocked[idx(N - 1, i)] = 1 }
    const doors = placed.map(({ zone, slot }) => ({ key: zone.key, x: slot.door.x, z: slot.door.z }))
    return { blocked, doors, decor }
}

/** Tiles a daily drop may appear on: walkable, off the roads, not a door or the spawn point, away from the map edge. */
export function dropSpots(grid: WorldGrid): { x: number; z: number }[]
{
    const spots: { x: number; z: number }[] = []
    for (let z = 2; z <= N - 3; z++) for (let x = 2; x <= N - 3; x++)
    {
        if (grid.blocked[idx(x, z)] || isRoad(x, z)) continue
        if (grid.doors.some((d) => d.x === x && d.z === z)) continue
        if (Math.abs(x - SPAWN.x) <= 1 && Math.abs(z - SPAWN.z) <= 1) continue
        spots.push({ x, z })
    }
    return spots
}

// ─── Pathfinding (A*, 8-dir, no corner cutting) ─────────────────────────────

export function findPath(blocked: Uint8Array, sx: number, sz: number, tx: number, tz: number): { x: number; z: number }[] | null
{
    if (!inside(tx, tz) || blocked[idx(tx, tz)]) return null
    const size = N * N
    const g = new Float32Array(size).fill(Infinity)
    const f = new Float32Array(size).fill(Infinity)
    const came = new Int32Array(size).fill(-1)
    const closed = new Uint8Array(size)
    const open: number[] = []
    const h = (x: number, z: number) => { const dx = Math.abs(x - tx), dz = Math.abs(z - tz); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz) }
    const start = idx(sx, sz)
    g[start] = 0; f[start] = h(sx, sz); open.push(start)
    while (open.length)
    {
        let bi = 0
        for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i
        const cur = open.splice(bi, 1)[0]
        const cx = cur % N, cz = (cur / N) | 0
        if (cx === tx && cz === tz)
        {
            const path: { x: number; z: number }[] = []
            for (let c = cur; c !== -1; c = came[c]) path.push({ x: c % N, z: (c / N) | 0 })
            return path.reverse()
        }
        closed[cur] = 1
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++)
        {
            if (!dx && !dz) continue
            const nx = cx + dx, nz = cz + dz
            if (!inside(nx, nz)) continue
            const n = idx(nx, nz)
            if (blocked[n] || closed[n]) continue
            if (dx && dz && (blocked[idx(cx + dx, cz)] || blocked[idx(cx, cz + dz)])) continue
            const ng = g[cur] + (dx && dz ? 1.414 : 1)
            if (ng < g[n])
            {
                came[n] = cur; g[n] = ng; f[n] = ng + h(nx, nz)
                if (!open.includes(n)) open.push(n)
            }
        }
    }
    return null
}

/** Nearest walkable tile to (x, z), searching outward. */
export function nearestFree(blocked: Uint8Array, x: number, z: number)
{
    for (let r = 0; r < N; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++)
    {
        const nx = x + dx, nz = z + dz
        if (inside(nx, nz) && !blocked[idx(nx, nz)]) return { x: nx, z: nz }
    }
    return { x, z }
}

/** Cars loop around the outer ring road (lane offset keeps them on the right). */
export const CAR_LOOP = [
    { x: 3, z: 3 }, { x: 17, z: 3 }, { x: 17, z: 17 }, { x: 3, z: 17 },
].map((p) => ({ x: tileToWorld(p.x), z: tileToWorld(p.z) }))
