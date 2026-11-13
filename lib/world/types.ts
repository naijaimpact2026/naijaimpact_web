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
    /** Self-assessments: what each answer option id means (results are returned as AttemptView.insights). */
    profile?: QuizProfile
}

export interface QuizProfile
{
    title: string
    intro: string
    outcomes: Record<string, { label: string; description: string; careers: string[] }>
}

/** Ranked self-assessment result (e.g. the Skill Compass). share = % of answers. */
export interface QuizInsights
{
    title: string
    intro: string
    ranking: { id: string; label: string; description: string; careers: string[]; share: number }[]
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
    /** Self-assessment results (e.g. Skill Compass); null for other missions. */
    insights: QuizInsights | null
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
    /** total >= passMark AND the stage finale (last boss challenge) passed. */
    passed: boolean
    /** The stage finale (e.g. Week 4 showcase) has been passed. */
    finalePassed: boolean
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
    /** 3D avatar (0–11) chosen at onboarding; use when avatarUrl is null. */
    character: number
    /** XP in the chosen period (all time, or this week). */
    xp: number
    missionsCompleted: number
    institution: string | null
    institutionId: string | null
    state: string | null
    isMe: boolean
}

export interface LeaderboardView
{
    pathway: Pathway
    scope: 'overall' | 'institution' | 'state'
    /** Institution id or state name the board is filtered to (null for overall). */
    scopeValue: string | null
    scopeLabel: string
    period: 'all' | 'week'
    /** Semester week when period = 'week'. */
    week: number | null
    entries: WorldLeaderboardEntry[]
    /** The caller's position in this board; rank null = no XP this week yet; null = not on this board. */
    me: { rank: number | null; xp: number; missionsCompleted: number } | null
    /** Players ranked on this board. */
    total: number
}

export interface InstitutionLeagueEntry
{
    rank: number
    institutionId: string
    name: string
    shortName: string | null
    state: string | null
    participants: number
    totalXp: number
    /** Average XP per participant (fairer between big and small campuses). */
    averageXp: number
    isMine: boolean
}

export interface LeagueView
{
    pathway: Pathway | null
    minPlayers: number
    entries: InstitutionLeagueEntry[]
    /** The caller's campus: its rank, or how many more players it needs to qualify. */
    me: { institutionId: string; name: string; participants: number; rank: number | null; averageXp: number; playersNeeded: number } | null
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

// ─── Squads ──────────────────────────────────────────────────────────────────

export const SQUAD_MIN = 3
export const SQUAD_MAX = 5

export interface SquadMemberView
{
    userId: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
    /** 3D avatar (0–11); show its preview when avatarUrl is null. */
    character: number
    isLeader: boolean
    isMe: boolean
    xp: number
    /** XP earned this semester week. */
    weekXp: number
    /** Their status on this week's team mission (null = not started). */
    teamMission: MissionStatus | null
    joinedAt: string
}

export interface SquadView
{
    id: string
    name: string
    /** 6-character invite code — share it with classmates. */
    code: string
    pathway: Pathway
    leaderId: string | null
    /** Stream channel (type "messaging"); open it with a /api/stream-token session. */
    chatChannelId: string | null
    members: SquadMemberView[]
    totalXp: number
    weekXp: number
    min: number
    max: number
    /** This week's Friday team mission for the squad's pathway. */
    teamMission: { id: string; title: string; week: number; day: number; unlocksAt: string } | null
    createdAt: string
}

export interface MySquadView
{
    /** False until squads are switched on (database not ready yet). */
    enabled: boolean
    squad: SquadView | null
}

// ─── Certificates ────────────────────────────────────────────────────────────

/** Stage names on certificates (falls back to "Stage N"). */
export const STAGE_NAMES: Record<Pathway, Record<number, string>> = {
    career: { 1: 'Discover & Define' },
    enterprise: { 1: 'Identify & Innovate' },
}

export interface CertificateView
{
    /** 12-character verification code; show as XXXX-XXXX-XXXX. */
    code: string
    /** Public verification page (always on hubnovo.com). */
    verifyUrl: string
    imageUrl: string
    pdfUrl: string
    competitionName: string
    stage: number
    stageName: string
    pathway: Pathway
    pathwayName: string
    holderName: string
    institution: string | null
    score: number
    issuedAt: string
    revoked: boolean
}

export interface MyCertificatesView
{
    /** False until certificates are switched on (database not ready yet). */
    enabled: boolean
    certificates: CertificateView[]
    /** The stage the player is working towards (null when every stage is certified). */
    next: { stage: number; stageName: string; total: number; passMark: number; finalePassed: boolean; finaleWeek: number } | null
}
