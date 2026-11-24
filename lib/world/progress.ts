import { DEFAULT_PASS_MARK, type AttemptStatus, type MissionKind, type ScoreBucket, type StageScore } from './types'

/*
 * Stage scoring (separate from XP). Per mission:
 *  - auto-graded kinds (quiz/sort/scenario): the FIRST attempt counts, so
 *    retries help you learn and earn XP but can't farm the score;
 *  - reviewed kinds: the best reviewed score (revising after feedback is
 *    part of the "reflection & improvement" the rubric rewards).
 * Each quest earns 0–3 STARS from that score (see starsFor). A stage's
 * total is its stars as a share of the maximum (quests × 3), 0–100.
 *
 * A stage is PASSED (certificate) when total >= pass mark (60% of the stars)
 * AND the stage finale (its last boss challenge, e.g. the Week 4 showcase)
 * is passed. Missed quests just earn no stars. Stars replaced the 5-part
 * weighted score on 24 Nov 2026; buckets are still reported (deprecated).
 */

const AUTO_KINDS: MissionKind[] = ['quiz', 'sort', 'scenario']

export interface ScoredMission { id: string; stage: number; kind: MissionKind; bucket: ScoreBucket; week: number }
export interface ScoredAttempt { mission_id: string; attempt_no: number; status: AttemptStatus; score: number | null }

/** Stars for one quest score: 85+ = 3, 70+ = 2, 50+ = 1, otherwise 0. */
export function starsFor(score: number | null): number
{
    if (score === null || !Number.isFinite(score)) return 0
    return score >= 85 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0
}

export function missionScore(m: ScoredMission, attempts: ScoredAttempt[]): number | null
{
    const mine = attempts.filter((a) => a.mission_id === m.id && a.score !== null)
    if (mine.length === 0) return null
    if (AUTO_KINDS.includes(m.kind)) return Number(mine.sort((a, b) => a.attempt_no - b.attempt_no)[0].score)
    return Math.max(...mine.filter((a) => a.status !== 'in_review').map((a) => Number(a.score)), 0)
}

export function stageScores(missions: ScoredMission[], attempts: ScoredAttempt[], passMark = DEFAULT_PASS_MARK): StageScore[]
{
    const stages = [...new Set(missions.map((m) => m.stage))].sort((a, b) => a - b)
    return stages.map((stage) =>
    {
        const list = missions.filter((m) => m.stage === stage)
        const buckets = { evidence: 0, quality: 0, reflection: 0, teamwork: 0, showcase: 0 } as Record<ScoreBucket, number>
        let done = 0, stars = 0
        const scores = new Map(list.map((m) => [m.id, missionScore(m, attempts)]))
        // Deprecated: per-bucket averages, kept so older clients still render.
        for (const b of Object.keys(buckets) as ScoreBucket[])
        {
            const inBucket = list.filter((m) => m.bucket === b)
            if (inBucket.length) buckets[b] = Math.round(inBucket.reduce((s, m) => s + (scores.get(m.id) ?? 0), 0) / inBucket.length)
        }
        const isPassed = (id: string) => attempts.some((a) => a.mission_id === id && a.status === 'passed')
        for (const m of list)
        {
            if (isPassed(m.id)) done++
            stars += starsFor(scores.get(m.id) ?? null)
        }
        const maxStars = list.length * 3
        const total = maxStars ? Math.round((stars / maxStars) * 100) : 0
        const finale = stageFinale(list)
        const finalePassed = finale ? isPassed(finale.id) : false
        return {
            stage, buckets, total, stars, maxStars, starsToPass: Math.ceil((maxStars * passMark) / 100),
            passMark, passed: total >= passMark && finalePassed, finalePassed, missionsDone: done, missionsTotal: list.length,
        }
    })
}

/** The stage's closing challenge: its last boss mission (Week 4 showcase for Stage 1). */
export function stageFinale<M extends ScoredMission>(stageMissions: M[]): M | null
{
    const bosses = stageMissions.filter((m) => m.kind === 'boss').sort((a, b) => b.week - a.week)
    return bosses[0] ?? null
}
