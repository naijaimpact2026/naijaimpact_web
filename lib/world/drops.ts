import { createServiceClient } from '@/lib/supabase/service'
import type { User } from '@/lib/types'
import { DISTRICTS } from './districts'
import { dropPool, type DropCard } from './content/drops'
import { loadParticipant, playableWorld, type Result } from './service'
import type { Pathway } from './types'
import { assignSlots, buildWorldGrid, dropSpots } from '@/components/app/competitions/city3d/layout'

/*
 * Daily campus drops + streak.
 *
 * Every Lagos day each player gets one drop: a one-tap card (myth or fact,
 * pick one) standing on a tile somewhere in the 3D Campus. Answering it
 * claims it once: +10 XP for a right answer, +5 for trying. Drops never
 * count towards stars or the stage pass.
 *
 * The card and its tile are picked from the day and the pathway, so they are
 * the same on web and mobile all day, and different tomorrow. The streak is
 * the run of Lagos days with a drop claimed or a quest submitted.
 *
 * Until the migration (20261124100000_campus_drops.sql) is applied, drops
 * report enabled: false and claiming fails politely.
 */

export const DROP_XP = { correct: 10, tried: 5 } as const

const DAY_MS = 24 * 60 * 60 * 1000
const LAGOS_OFFSET_MS = 60 * 60 * 1000
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
const NOT_FOUND = 'Competition not found.'
const OFF = 'Campus drops are switching on soon.'
const missingTable = (e: { code?: string; message?: string } | null) =>
    Boolean(e && (e.code === '42P01' || e.code === 'PGRST205' || e.code === 'PGRST202' || e.code === '42883' || /does not exist|schema cache|could not find the function/i.test(e.message ?? '')))

/** Lagos calendar day (YYYY-MM-DD) for a moment. */
export function lagosDay(now = Date.now()): string
{
    return new Date(now + LAGOS_OFFSET_MS).toISOString().slice(0, 10)
}
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const dayNumber = (day: string) => Math.floor(Date.parse(`${day}T00:00:00Z`) / DAY_MS)
const shiftDay = (day: string, by: number) => new Date(Date.parse(`${day}T00:00:00Z`) + by * DAY_MS).toISOString().slice(0, 10)

// A fixed shuffle per pathway, so consecutive days don't follow the authoring order.
const order = new Map<Pathway, DropCard[]>()
function shuffledPool(pathway: Pathway): DropCard[]
{
    let pool = order.get(pathway)
    if (pool) return pool
    pool = [...dropPool(pathway)]
    let seed = pathway === 'career' ? 2026 : 4052
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
    for (let i = pool.length - 1; i > 0; i--)
    {
        const j = Math.floor(rand() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]]
    }
    order.set(pathway, pool)
    return pool
}

let spotsCache: { x: number; z: number }[] | null = null
/** Tiles a drop can stand on in the Campus layout (same grid the 3D scene walks on). */
export function campusDropSpots()
{
    if (!spotsCache) spotsCache = dropSpots(buildWorldGrid(assignSlots(DISTRICTS.map((d) => ({ key: d.key })))))
    return spotsCache
}

/** The card and tile for a pathway on a Lagos day (deterministic). */
export function dropOfDay(pathway: Pathway, day: string): { card: DropCard; tile: { x: number; z: number } }
{
    const n = dayNumber(day)
    const pool = shuffledPool(pathway)
    const spots = campusDropSpots()
    const card = pool[((n % pool.length) + pool.length) % pool.length]
    // Golden-ratio stride (coprime with the spot count) so each day lands somewhere visibly different.
    let stride = Math.max(1, Math.round(spots.length * 0.618))
    while (gcd(stride, spots.length) !== 1) stride++
    const at = ((n * stride + (pathway === 'career' ? 3 : 11)) % spots.length + spots.length) % spots.length
    return { card, tile: spots[at] }
}

export interface DropView
{
    enabled: boolean
    /** Lagos day this drop belongs to. */
    day: string
    key: string
    prompt: string
    options: { id: string; label: string }[]
    /** Grid tile (same coordinates as the world layout). */
    tile: { x: number; z: number }
    /** XP for a right answer / for trying. */
    xp: { correct: number; tried: number }
    /** Set once claimed today: the right answer and why. */
    claimed: { correct: boolean; xp: number; answer: string; explain: string } | null
    streak: number
}

async function claimedDays(competitionId: string, userId: string): Promise<{ days: Map<string, { correct: boolean; xp: number }>; enabled: boolean }>
{
    const { data, error } = await createServiceClient().from('competition_drop_claims').select('day, correct, xp')
        .eq('competition_id', competitionId).eq('user_id', userId).order('day', { ascending: false }).limit(200)
    if (error) return { days: new Map(), enabled: !missingTable(error) }
    return { days: new Map(((data ?? []) as { day: string; correct: boolean; xp: number }[]).map((r) => [r.day, { correct: r.correct, xp: r.xp }])), enabled: true }
}

/** Consecutive Lagos days (ending today, or yesterday if today isn't done yet) with a drop claimed or a quest submitted. */
export async function playerStreak(competitionId: string, userId: string, claimed?: Set<string>, now = Date.now()): Promise<number>
{
    const since = new Date(now - 200 * DAY_MS).toISOString()
    const [{ data: attempts }, claims] = await Promise.all([
        createServiceClient().from('competition_attempts').select('created_at').eq('competition_id', competitionId).eq('user_id', userId).gte('created_at', since).limit(1000),
        claimed ? Promise.resolve(claimed) : claimedDays(competitionId, userId).then((r) => new Set(r.days.keys())),
    ])
    const active = new Set<string>(claims)
    for (const a of (attempts ?? []) as { created_at: string }[]) active.add(lagosDay(Date.parse(a.created_at)))
    const today = lagosDay(now)
    let day = active.has(today) ? today : shiftDay(today, -1)
    let streak = 0
    while (active.has(day)) { streak++; day = shiftDay(day, -1) }
    return streak
}

/** Today's drop for the player (no answer until claimed). */
export async function getTodayDrop(slug: string, profile: User, now = Date.now()): Promise<Result<{ drop: DropView }>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const me = await loadParticipant(c.id, profile.id)
    if (!me) return fail('Join the competition first.')
    const day = lagosDay(now)
    const { card, tile } = dropOfDay(me.pathway, day)
    const { days, enabled } = await claimedDays(c.id, profile.id)
    const mine = days.get(day)
    const streak = await playerStreak(c.id, profile.id, new Set(days.keys()), now)
    return {
        ok: true,
        drop: {
            enabled, day, key: card.key, prompt: card.prompt, options: card.options, tile, xp: { ...DROP_XP },
            claimed: mine ? { correct: mine.correct, xp: mine.xp, answer: card.answer, explain: card.explain } : null,
            streak,
        },
    }
}

export interface DropClaimResult { correct: boolean; xp: number; answer: string; explain: string; streak: number; alreadyClaimed: boolean }

/** Answer today's drop. Claiming twice gives no extra XP (alreadyClaimed = true). */
export async function claimTodayDrop(slug: string, profile: User, answer: unknown, now = Date.now()): Promise<Result<DropClaimResult>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const me = await loadParticipant(c.id, profile.id)
    if (!me) return fail('Join the competition first.')
    const day = lagosDay(now)
    const { card } = dropOfDay(me.pathway, day)
    if (typeof answer !== 'string' || !card.options.some((o) => o.id === answer)) return fail('Choose one of the answers.')

    const correct = answer === card.answer
    const { data, error } = await createServiceClient().rpc('_unsafe_claim_world_drop', {
        p_user_id: profile.id, p_competition_id: c.id, p_day: day, p_drop_key: card.key, p_correct: correct,
        p_xp: correct ? DROP_XP.correct : DROP_XP.tried,
    })
    if (error)
    {
        if (missingTable(error)) return fail(OFF)
        if (/season_closed/.test(error.message)) return fail('The semester is not running right now.')
        if (/not_joined/.test(error.message)) return fail('Join the competition first.')
        return fail('Could not claim the drop. Try again.')
    }
    const xp = Number(data ?? 0)
    const streak = await playerStreak(c.id, profile.id, undefined, now)
    // Already claimed today: report what was recorded, not this tap.
    if (xp === 0)
    {
        const { days } = await claimedDays(c.id, profile.id)
        const mine = days.get(day)
        return { ok: true, correct: mine?.correct ?? correct, xp: 0, answer: card.answer, explain: card.explain, streak, alreadyClaimed: true }
    }
    return { ok: true, correct, xp, answer: card.answer, explain: card.explain, streak, alreadyClaimed: false }
}
