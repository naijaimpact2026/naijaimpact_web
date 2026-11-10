import { BUCKET_WEIGHTS, DEFAULT_PASS_MARK, type AttemptStatus, type MissionKind, type ScoreBucket, type StageScore } from './types'

/*
 * Stage scoring (separate from XP). Per mission:
 *  - auto-graded kinds (quiz/sort/scenario): the FIRST attempt counts, so
 *    retries help you learn and earn XP but can't farm the score;
 *  - reviewed kinds: the best reviewed score (revising after feedback is
 *    part of the "reflection & improvement" the rubric rewards).
 * Bucket = average over the stage's missions in that bucket (missing = 0).
 * Total = weighted by BUCKET_WEIGHTS, renormalised over buckets present.
 */

const AUTO_KINDS: MissionKind[] = ['quiz', 'sort', 'scenario']

export interface ScoredMission { id: string; stage: number; kind: MissionKind; bucket: ScoreBucket }
export interface ScoredAttempt { mission_id: string; attempt_no: number; status: AttemptStatus; score: number | null }

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
        let weightSum = 0, weighted = 0, done = 0
        for (const b of Object.keys(buckets) as ScoreBucket[])
        {
            const inBucket = list.filter((m) => m.bucket === b)
            if (inBucket.length === 0) continue
            const scores = inBucket.map((m) => missionScore(m, attempts))
            buckets[b] = Math.round(scores.reduce<number>((s, v) => s + (v ?? 0), 0) / inBucket.length)
            weightSum += BUCKET_WEIGHTS[b]
            weighted += buckets[b] * BUCKET_WEIGHTS[b]
        }
        for (const m of list) if (attempts.some((a) => a.mission_id === m.id && a.status === 'passed')) done++
        const total = weightSum ? Math.round(weighted / weightSum) : 0
        return { stage, buckets, total, passMark, passed: total >= passMark && done === list.length, missionsDone: done, missionsTotal: list.length }
    })
}
