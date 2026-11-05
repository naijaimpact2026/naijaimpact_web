/*
 * Competitions engine — shared types, levels and display config.
 * Safe to import from client and server code (no secrets, no DB access).
 */

export type CompetitionStatus = 'coming_soon' | 'live' | 'ended'
export type MissionVerification = 'auto' | 'proof' | 'checkin'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected'
export type LeaderboardGroup = 'overall' | 'state' | 'category' | 'campus'

export interface Competition
{
    id: string
    slug: string
    name: string
    tagline: string | null
    description: string | null
    icon: string
    theme_color: string
    status: CompetitionStatus
    season_name: string | null
    season_start: string | null
    season_end: string | null
    leaderboard_groups: LeaderboardGroup[]
    prize_note: string | null
    sort_order: number
}

export interface CompetitionZone
{
    id: string
    competition_id: string
    key: string
    label: string
    description: string | null
    icon: string
    sort_order: number
}

export interface CompetitionMission
{
    id: string
    competition_id: string
    key: string
    zone_key: string | null
    title: string
    description: string | null
    xp: number
    verification: MissionVerification
    auto_metric: string | null
    target: number
    proof_hint: string | null
    sort_order: number
}

export interface CompetitionParticipant
{
    id: string
    competition_id: string
    user_id: string
    state: string | null
    category: string | null
    avatar: AvatarConfig
    joined_at: string
}

export interface CompetitionSubmission
{
    id: string
    mission_id: string
    status: SubmissionStatus
    review_note: string | null
    created_at: string
}

/** A mission as the signed-in participant sees it. */
export interface MissionView extends CompetitionMission
{
    completed: boolean
    /** Live progress for auto missions (null when not measurable / not joined). */
    progress: number | null
    submission: CompetitionSubmission | null
}

export interface LeaderboardEntry
{
    rank: number
    user_id: string
    xp: number
    missions_completed: number
    state: string | null
    category: string | null
    username: string | null
    display_name: string | null
    avatar_url: string | null
    verified: boolean
}

// ─── Avatars (3D characters — Kenney Mini Characters, CC0) ──────────────────

export interface AvatarConfig
{
    character?: number
}

export const CHARACTERS = [
    'male-a', 'female-a', 'male-b', 'female-b', 'male-c', 'female-c',
    'male-d', 'female-d', 'male-e', 'female-e', 'male-f', 'female-f',
] as const

const CITY_ASSETS = '/competitions/city'
export const characterModelUrl = (i: number) => `${CITY_ASSETS}/characters/character-${CHARACTERS[i] ?? CHARACTERS[0]}.glb`
export const characterPreviewUrl = (i: number) => `${CITY_ASSETS}/characters/previews/character-${CHARACTERS[i] ?? CHARACTERS[0]}.png`

export function normalizeAvatar(raw: unknown): Required<AvatarConfig>
{
    const a = (raw && typeof raw === 'object' ? raw : {}) as AvatarConfig
    const c = a.character
    return { character: Number.isInteger(c) && (c as number) >= 0 && (c as number) < CHARACTERS.length ? (c as number) : 0 }
}

// ─── Levels ──────────────────────────────────────────────────────────────────

export const LEVELS = [
    { level: 1, name: 'Rookie', minXp: 0 },
    { level: 2, name: 'Rising Star', minXp: 100 },
    { level: 3, name: 'Pro', minXp: 300 },
    { level: 4, name: 'Elite', minXp: 600 },
    { level: 5, name: 'Champion', minXp: 1000 },
    { level: 6, name: 'Legend', minXp: 1500 },
] as const

export function getLevel(xp: number)
{
    let current: (typeof LEVELS)[number] = LEVELS[0]
    for (const l of LEVELS) if (xp >= l.minXp) current = l
    const next = LEVELS.find((l) => l.minXp > xp) ?? null
    const span = next ? next.minXp - current.minXp : 1
    const progress = next ? Math.min(1, (xp - current.minXp) / span) : 1
    return { ...current, next, progress, xpToNext: next ? next.minXp - xp : 0 }
}

export function levelBadgeKey(slug: string, level: number)
{
    return `competition:${slug}:level-${level}`
}

// ─── Season helpers ──────────────────────────────────────────────────────────

export function isSeasonOpen(c: Pick<Competition, 'status' | 'season_start' | 'season_end'>, now = Date.now())
{
    if (c.status !== 'live') return false
    if (c.season_start && now < new Date(c.season_start).getTime()) return false
    if (c.season_end && now > new Date(c.season_end).getTime()) return false
    return true
}

/** Display name for "H-Points" (stored in users.impact_points). */
export const POINTS_LABEL = 'H-Points'

export const PROOF_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
export const PROOF_MAX_BYTES = 10 * 1024 * 1024

export const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
    'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
    'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
    'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const
