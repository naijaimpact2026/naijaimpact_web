import type { MissionKind, MissionStatus, Pathway } from './types'

/*
 * Hubnovo World districts (the 3D Campus map). Client-safe data: which
 * district each mission lives in, plus labels/blurbs. Used by the Campus
 * home preview card and the 3D world page.
 */

export type DistrictKey = 'learning_academy' | 'career_district' | 'enterprise_hub' | 'competition_arena' | 'rewards_exchange'

export interface DistrictDef { key: DistrictKey; label: string; blurb: string; emoji: string }

export const DISTRICTS: DistrictDef[] = [
    { key: 'learning_academy', label: 'Learning Academy', blurb: 'Quizzes, sort games and workplace scenarios. Learn it, then prove it.', emoji: '🎓' },
    { key: 'career_district', label: 'Career District', blurb: 'Career & Employability: real-world tasks, CV, interviews and reflections.', emoji: '💼' },
    { key: 'enterprise_hub', label: 'Enterprise Hub', blurb: 'Enterprise Development: find real problems, test ideas and pitch.', emoji: '🚀' },
    { key: 'competition_arena', label: 'Competition Arena', blurb: 'Friday squad missions and the Sunday boss challenge. Judges score it here.', emoji: '🏟️' },
    { key: 'rewards_exchange', label: 'Rewards Exchange', blurb: 'Spend HubTokens on rewards, and see your badges and certificates.', emoji: '🏆' },
]

const LEARN: MissionKind[] = ['quiz', 'sort', 'scenario']
const ARENA: MissionKind[] = ['boss', 'team', 'live_event']

/** Which district a mission belongs to. */
export function districtOf(m: { kind: MissionKind; pathway: Pathway }): DistrictKey
{
    if (LEARN.includes(m.kind)) return 'learning_academy'
    if (ARENA.includes(m.kind)) return 'competition_arena'
    return m.pathway === 'enterprise' ? 'enterprise_hub' : 'career_district'
}

/** Light mission data for the world (no configs or answer data). */
export interface WorldMissionLite
{
    id: string; title: string; kind: MissionKind; pathway: Pathway; week: number; day: number
    xp: number; tokens: number; status: MissionStatus; unlocksAt: string; estMinutes: number
}

export function districtProgress(missions: WorldMissionLite[])
{
    const out = new Map<DistrictKey, { done: number; total: number; open: number }>()
    for (const d of DISTRICTS) out.set(d.key, { done: 0, total: 0, open: 0 })
    for (const m of missions)
    {
        const p = out.get(districtOf(m))!
        p.total++
        if (m.status === 'passed') p.done++
        else if (m.status === 'available' || m.status === 'needs_revision') p.open++
    }
    return out
}
