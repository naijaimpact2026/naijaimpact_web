/*
 * Hubnovo World (Campus Competition) — the shared contract.
 *
 * These are the shapes the REST API returns and accepts (see
 * docs/api/competitions.md). The web UI, the mobile app and the server all
 * use them. Client-safe only: answer keys never appear here.
 */

export type Pathway = 'career' | 'enterprise'

/** Visual/interaction style of a mission. Most kinds render a `FormConfig`. */
export type MissionKind =
    | 'quiz'        // multiple choice (graded) or self-assessment (ungraded)
    | 'sort'        // drag items into bins
    | 'scenario'    // branching choices
    | 'board'       // structured fields: 5 Whys, scorecard, Goal Forge, calculator
    | 'canvas'      // value proposition / lean canvas blocks
    | 'evidence'    // real-world task: upload file(s)/link + checklist
    | 'video'       // record/upload a short pitch or reflection video
    | 'reflection'  // written reflection prompts
    | 'team'        // squad deliverable
    | 'live_event'  // attend a moderated live event (check-in)
    | 'boss'        // Sunday boss challenge / stage showcase (human-judged)

export type ScoreBucket = 'evidence' | 'quality' | 'reflection' | 'teamwork' | 'showcase'
export type ReviewMode = 'auto' | 'ai' | 'human'
export type AttemptStatus = 'in_review' | 'passed' | 'needs_revision' | 'rejected'
export type MissionStatus = 'locked' | 'available' | AttemptStatus

// ─── Mission configs (client-safe) ───────────────────────────────────────────

export interface QuizConfig
{
    questions: { id: string; prompt: string; options: { id: string; label: string }[]; multi?: boolean }[]
    /** false = self-assessment (no right answers; completing it passes). */
    graded: boolean
}

export interface SortConfig
{
    prompt: string
    items: { id: string; label: string }[]
    bins: { id: string; label: string }[]
}

export interface ScenarioConfig
{
    intro: string
    start: string
    nodes: { id: string; text: string; choices: { id: string; label: string; next?: string }[] }[]
}

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'file' | 'link' | 'video'

export interface FieldDef
{
    id: string
    label: string
    type: FieldType
    required?: boolean
    hint?: string
    /** select options */
    options?: { id: string; label: string }[]
    /** textarea */
    minWords?: number
    maxWords?: number
    /** number */
    min?: number
    max?: number
    /** file: allowed MIME groups */
    accept?: ('image' | 'pdf' | 'video')[]
    /** video: max length in seconds */
    maxSeconds?: number
    /** Repeat this field N times (e.g. "Why? ×5"). */
    repeat?: number
}

/** Used by board, canvas, evidence, video, reflection, team, live_event and boss. */
export interface FormConfig
{
    /** UI hint for presentation, e.g. 'five_whys', 'scorecard', 'lean_canvas'. */
    variant?: string
    intro?: string
    fields: FieldDef[]
    /** Must all be ticked (consent, "no personal data", honesty). */
    checklist?: { id: string; label: string }[]
}

export type MissionConfig = QuizConfig | SortConfig | ScenarioConfig | FormConfig

// ─── Attempt payloads (what clients POST) ────────────────────────────────────

export type FieldValue = string | number | boolean | string[] | { key: string } | { url: string } | null

export type AttemptPayload =
    | { kind: 'quiz'; answers: Record<string, string | string[]> }
    | { kind: 'sort'; placement: Record<string, string> }
    | { kind: 'scenario'; path: { node: string; choice: string }[] }
    | { kind: 'form'; fields: Record<string, FieldValue | FieldValue[]>; checklist?: string[] }

// ─── Responses ───────────────────────────────────────────────────────────────

export interface RubricView
{
    key: string
    title: string
    passMark: number
    criteria: { id: string; label: string; weight: number; description?: string }[]
}

export interface AttemptView
{
    id: string
    attemptNo: number
    status: AttemptStatus
    /** 0–100, null while in review. */
    score: number | null
    feedback: string | null
    rubricScores: Record<string, number> | null
    createdAt: string
    reviewedAt: string | null
}

export interface MissionView
{
    id: string
    key: string
    pathway: Pathway
    stage: number
    week: number
    /** 1 = Monday … 7 = Sunday (boss day) */
    day: number
    title: string
    story: string | null
    kind: MissionKind
    config: MissionConfig
    estMinutes: number
    xp: number
    tokens: number
    bucket: ScoreBucket
    reviewMode: ReviewMode
    rubric: RubricView | null
    status: MissionStatus
    /** ISO time the mission opens (Africa/Lagos midnight). */
    unlocksAt: string
    attemptsUsed: number
    maxAttempts: number
    lastAttempt: AttemptView | null
    /** Badge awarded when this mission passes (weekly boss / stage finale). */
    badge: { key: string; label: string } | null
    /** "How to do this" — 1–3 practical steps to show before the activity. */
    tips: string[]
}

export interface PathwayView
{
    key: Pathway
    name: string
    tagline: string | null
    color: string
}

export interface SemesterClock
{
    /** Current week (1–weeks) and day (1–7), or null before start / after end. */
    week: number | null
    day: number | null
    stage: number | null
    startsAt: string | null
    endsAt: string | null
    phase: 'upcoming' | 'running' | 'ended'
}

export interface WorldParticipantView
{
    pathway: Pathway
    institution: InstitutionView | null
    state: string | null
    bracket: 'newcomer' | 'advanced'
    avatar: { character: number }
    accessibility: { lite?: boolean; captions?: boolean; reducedMotion?: boolean }
    joinedAt: string
}

export interface InstitutionView
{
    id: string
    name: string
    shortName: string | null
    state: string | null
    kind: string
}

export interface StageScore
{
    stage: number
    /** Each bucket 0–100 (average of counted missions). */
    buckets: Record<ScoreBucket, number>
    /** Weighted total 0–100 (40/25/15/10/10). */
    total: number
    passMark: number
    passed: boolean
    missionsDone: number
    missionsTotal: number
}

export interface ProgressView
{
    level: { level: number; name: string; xpToNext: number; progress: number }
    xp: number
    tokens: number
    rank: number | null
    stages: StageScore[]
    badges: { key: string; label: string; icon: string | null; awardedAt: string }[]
}

export interface WorldLeaderboardEntry
{
    rank: number
    userId: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
    xp: number
    missionsCompleted: number
    institution: string | null
    state: string | null
}

export interface InstitutionLeagueEntry
{
    rank: number
    institutionId: string
    name: string
    shortName: string | null
    participants: number
    totalXp: number
    /** Average XP per participant (fairer between big and small campuses). */
    averageXp: number
}

export interface CompetitionSummary
{
    id: string
    slug: string
    name: string
    tagline: string | null
    format: 'classic' | 'world'
    status: 'coming_soon' | 'preview' | 'live' | 'ended'
    themeColor: string
    icon: string
    seasonName: string | null
    startsAt: string | null
    endsAt: string | null
    pathways: PathwayView[]
    participants: number
    joined: boolean
    /** True when the caller can play (live, or preview + admin/tester). */
    canPlay: boolean
}

export interface CompetitionDetail extends CompetitionSummary
{
    description: string | null
    weeks: number
    clock: SemesterClock
    me: WorldParticipantView | null
}

/** Points naming in one place (team lead may rename). */
export const XP_LABEL = 'XP'
export const TOKENS_LABEL = 'HubTokens'
export const MAX_ATTEMPTS = 3
export const STAGE_WEEKS = 4
export const BUCKET_WEIGHTS: Record<ScoreBucket, number> = { evidence: 40, quality: 25, reflection: 15, teamwork: 10, showcase: 10 }
export const DEFAULT_PASS_MARK = 60

/** World XP levels (a pathway earns ~5,500 XP per 4-week stage). */
export const WORLD_LEVELS = [
    { level: 1, name: 'Newcomer', minXp: 0 },
    { level: 2, name: 'Explorer', minXp: 500 },
    { level: 3, name: 'Builder', minXp: 1500 },
    { level: 4, name: 'Achiever', minXp: 3000 },
    { level: 5, name: 'Trailblazer', minXp: 5000 },
    { level: 6, name: 'Leader', minXp: 8000 },
    { level: 7, name: 'Champion', minXp: 12000 },
    { level: 8, name: 'Legend', minXp: 18000 },
] as const

export function worldLevel(xp: number): ProgressView['level']
{
    let current: (typeof WORLD_LEVELS)[number] = WORLD_LEVELS[0]
    for (const l of WORLD_LEVELS) if (xp >= l.minXp) current = l
    const next = WORLD_LEVELS.find((l) => l.minXp > xp)
    return {
        level: current.level,
        name: current.name,
        xpToNext: next ? next.minXp - xp : 0,
        progress: next ? Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp)) : 1,
    }
}
