import { slotOfDay, type MissionKind, type MissionStatus, type Pathway, type QuestSlot } from './types'

/*
 * Hubnovo World districts (the 3D Campus map). Client-safe data: which
 * district each quest lives in, its host, and labels/blurbs. Shared by the
 * web 3D Campus and the mobile /world API.
 *
 * Three quests a week: Play (Mon) in the Learning Academy, Do (Wed) at the
 * player's HQ (Career District or Enterprise Hub), Show (Sun) in the Arena.
 */

export type DistrictKey = 'learning_academy' | 'career_district' | 'enterprise_hub' | 'competition_arena' | 'rewards_exchange'

export interface DistrictDef { key: DistrictKey; label: string; blurb: string; emoji: string }

export const DISTRICTS: DistrictDef[] = [
    { key: 'learning_academy', label: 'Learning Academy', blurb: 'Play: Monday’s game. Quizzes, sort games and scenarios, marked instantly.', emoji: '🎓' },
    { key: 'career_district', label: 'Career District', blurb: 'Do: Wednesday’s real-world task for the Career pathway.', emoji: '💼' },
    { key: 'enterprise_hub', label: 'Enterprise Hub', blurb: 'Do: Wednesday’s real-world task for the Enterprise pathway.', emoji: '🚀' },
    { key: 'competition_arena', label: 'Competition Arena', blurb: 'Show: Sunday’s showcase, scored by judges. Your squad and the rankings live here too.', emoji: '🏟️' },
    { key: 'rewards_exchange', label: 'Rewards Exchange', blurb: 'Spend HubTokens on rewards. Your badges and certificates are here too.', emoji: '🏆' },
]

/** The character who greets players at each district (index into CHARACTERS). */
export interface QuestHost { name: string; character: number; line: string }
export const HOSTS: Record<DistrictKey, QuestHost> = {
    learning_academy: { name: 'Professor Ada', character: 3, line: 'Welcome to the Academy! Today’s game takes about ten minutes. Ready?' },
    career_district: { name: 'Coach Tunde', character: 2, line: 'This one happens out in the real world. Go and do it, then show me what you found.' },
    enterprise_hub: { name: 'Mama Nkechi', character: 5, line: 'Every good business starts on the street. Go and look, then report back.' },
    competition_arena: { name: 'Judge Bisi', character: 9, line: 'Sunday is showtime! The judges score this one, so bring your best.' },
    rewards_exchange: { name: 'Femi at the Exchange', character: 4, line: 'Earned some HubTokens? Spend them here.' },
}

/** The player's own HQ district. */
export const hqOf = (pathway: Pathway): DistrictKey => (pathway === 'enterprise' ? 'enterprise_hub' : 'career_district')

/** Where each weekly quest happens. */
export function districtOfSlot(slot: QuestSlot, pathway: Pathway): DistrictKey
{
    return slot === 'play' ? 'learning_academy' : slot === 'show' ? 'competition_arena' : hqOf(pathway)
}

const LEARN: MissionKind[] = ['quiz', 'sort', 'scenario']
const ARENA: MissionKind[] = ['boss', 'team', 'live_event']

/** Which district a mission belongs to: by its quest slot (day), else by kind (older missions). */
export function districtOf(m: { kind: MissionKind; pathway: Pathway; day?: number }): DistrictKey
{
    const slot = m.day !== undefined ? slotOfDay(m.day) : null
    if (slot) return districtOfSlot(slot, m.pathway)
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
