import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizeRole } from '@/lib/modushive/config'
import { getObjectSize, isR2Configured, presignDownload, presignUpload } from '@/lib/modushive/r2'
import { NIGERIAN_STATES } from '@/lib/competitions/config'
import type { User } from '@/lib/types'
import { aiReview } from './ai-review'
import { autoGrade, formToText, isFormKind, validateForm } from './grading'
import { stageScores } from './progress'
import { semesterClock, stageOfWeek, unlockAt } from './schedule'
import { WORLD_CONTENT } from './content'
import {
    DEFAULT_PASS_MARK, MAX_ATTEMPTS, worldLevel,
    type AttemptPayload, type AttemptStatus, type AttemptView, type CompetitionDetail, type CompetitionSummary,
    type FormConfig, type InstitutionLeagueEntry, type InstitutionView, type MissionConfig, type MissionKind, type MissionStatus,
    type MissionView, type Pathway, type PathwayView, type ProgressView, type ReviewMode, type RubricView, type ScoreBucket,
    type WorldLeaderboardEntry, type WorldParticipantView,
} from './types'

/*
 * Hubnovo World — server-side service (NOT a 'use server' module, so none
 * of these are callable from the browser directly). Every function takes
 * the caller's profile explicitly; web server actions (lib/actions/world.ts)
 * and the mobile REST API (app/api/competitions) both call these.
 *
 * Results use the same { ok: true, ... } | { ok: false, error } shape as
 * the rest of the app's actions, so routes can pass them to fromAction().
 */

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
const NOT_FOUND = 'Competition not found.'

interface CompetitionRow
{
    id: string; slug: string; name: string; tagline: string | null; description: string | null; icon: string; theme_color: string
    status: CompetitionSummary['status']; format: 'classic' | 'world'; weeks: number; season_name: string | null
    season_start: string | null; season_end: string | null
}
interface MissionRow
{
    id: string; key: string; pathway: Pathway; stage: number; week: number; day: number; title: string; story: string | null
    kind: MissionKind; config: MissionConfig; est_minutes: number; xp: number; tokens: number; bucket: ScoreBucket
    review_mode: ReviewMode; rubric_key: string | null; max_attempts: number; badge: { key: string; label: string } | null
    competition_id: string
}
interface AttemptRow
{
    id: string; mission_id: string; user_id: string; attempt_no: number; status: AttemptStatus; score: number | null
    feedback: string | null; rubric_scores: Record<string, number> | null; created_at: string; reviewed_at: string | null
    ai_score: number | null; ai_feedback: unknown; payload: unknown; flags: string[]; appeal_status: string | null
}

const MISSION_COLUMNS = 'id, key, pathway, stage, week, day, title, story, kind, config, est_minutes, xp, tokens, bucket, review_mode, rubric_key, max_attempts, badge, competition_id'

// ─── Access ──────────────────────────────────────────────────────────────────

export const isAdmin = (p: User | null) => normalizeRole(p?.role) === 'admin'

async function loadCompetition(slug: string): Promise<CompetitionRow | null>
{
    const { data } = await createServiceClient()
        .from('competitions')
        .select('id, slug, name, tagline, description, icon, theme_color, status, format, weeks, season_name, season_start, season_end')
        .eq('slug', slug)
        .maybeSingle()
    return (data as CompetitionRow | null) ?? null
}

async function isTester(competitionId: string, userId: string)
{
    const { data } = await createServiceClient().from('competition_testers').select('user_id').eq('competition_id', competitionId).eq('user_id', userId).maybeSingle()
    return Boolean(data)
}

/** Live → everyone; preview → admins + testers only. */
async function canPlay(c: CompetitionRow, profile: User | null)
{
    if (!profile) return false
    if (c.status === 'live') return true
    if (c.status === 'preview') return isAdmin(profile) || isTester(c.id, profile.id)
    return false
}

/** World competition the caller is allowed to see, or null (reported as "not found"). */
async function playableWorld(slug: string, profile: User): Promise<CompetitionRow | null>
{
    const c = await loadCompetition(slug)
    if (!c || c.format !== 'world') return null
    return (await canPlay(c, profile)) ? c : null
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

async function loadPathways(competitionId: string): Promise<PathwayView[]>
{
    const { data } = await createServiceClient().from('competition_pathways').select('key, name, tagline, color').eq('competition_id', competitionId).order('sort_order')
    return (data ?? []) as PathwayView[]
}

async function loadRubrics(keys: string[]): Promise<Map<string, RubricView>>
{
    if (keys.length === 0) return new Map()
    const { data } = await createServiceClient().from('competition_rubrics').select('key, title, criteria, pass_mark').in('key', [...new Set(keys)])
    return new Map((data ?? []).map((r: { key: string; title: string; criteria: RubricView['criteria']; pass_mark: number }) =>
        [r.key, { key: r.key, title: r.title, criteria: r.criteria, passMark: r.pass_mark }]))
}

function toAttemptView(a: AttemptRow): AttemptView
{
    return {
        id: a.id, attemptNo: a.attempt_no, status: a.status, score: a.score === null ? null : Number(a.score),
        feedback: a.feedback, rubricScores: a.rubric_scores, createdAt: a.created_at, reviewedAt: a.reviewed_at,
    }
}

function institutionView(r: { id: string; name: string; short_name: string | null; state: string | null; kind: string } | null): InstitutionView | null
{
    return r ? { id: r.id, name: r.name, shortName: r.short_name, state: r.state, kind: r.kind } : null
}

// ─── Competitions ────────────────────────────────────────────────────────────

export async function listCompetitionSummaries(profile: User): Promise<CompetitionSummary[]>
{
    const db = createServiceClient()
    const [{ data: comps }, { data: parts }, { data: mine }, { data: pathways }, testerRes] = await Promise.all([
        db.from('competitions').select('id, slug, name, tagline, icon, theme_color, status, format, season_name, season_start, season_end').order('sort_order'),
        db.from('competition_participants').select('competition_id').limit(50000),
        db.from('competition_participants').select('competition_id').eq('user_id', profile.id),
        db.from('competition_pathways').select('competition_id, key, name, tagline, color, sort_order').order('sort_order'),
        db.from('competition_testers').select('competition_id').eq('user_id', profile.id),
    ])
    const counts: Record<string, number> = {}
    for (const p of (parts ?? []) as { competition_id: string }[]) counts[p.competition_id] = (counts[p.competition_id] ?? 0) + 1
    const joined = new Set(((mine ?? []) as { competition_id: string }[]).map((m) => m.competition_id))
    const testerOf = new Set(((testerRes.data ?? []) as { competition_id: string }[]).map((t) => t.competition_id))
    const admin = isAdmin(profile)

    return ((comps ?? []) as CompetitionRow[]).map((c) => ({
        id: c.id, slug: c.slug, name: c.name, tagline: c.tagline, format: c.format ?? 'classic',
        // Preview competitions look "coming soon" to everyone who can't play them yet.
        status: c.status === 'preview' && !(admin || testerOf.has(c.id)) ? 'coming_soon' : c.status,
        themeColor: c.theme_color, icon: c.icon, seasonName: c.season_name, startsAt: c.season_start, endsAt: c.season_end,
        pathways: ((pathways ?? []) as (PathwayView & { competition_id: string })[]).filter((p) => p.competition_id === c.id)
            .map(({ key, name, tagline, color }) => ({ key, name, tagline, color })),
        participants: counts[c.id] ?? 0,
        joined: joined.has(c.id),
        canPlay: c.status === 'live' || (c.status === 'preview' && (admin || testerOf.has(c.id))),
    }))
}

async function loadParticipant(competitionId: string, userId: string): Promise<(WorldParticipantView & { institutionId: string | null }) | null>
{
    const { data } = await createServiceClient()
        .from('competition_participants')
        .select('pathway, state, bracket, avatar, accessibility, joined_at, institution_id, institution:institutions(id, name, short_name, state, kind)')
        .eq('competition_id', competitionId).eq('user_id', userId).maybeSingle()
    if (!data || !data.pathway) return null
    const row = data as unknown as {
        pathway: Pathway; state: string | null; bracket: 'newcomer' | 'advanced'; avatar: { character?: number }; accessibility: WorldParticipantView['accessibility']
        joined_at: string; institution_id: string | null; institution: Parameters<typeof institutionView>[0]
    }
    return {
        pathway: row.pathway, state: row.state, bracket: row.bracket, avatar: { character: Number(row.avatar?.character ?? 0) },
        accessibility: row.accessibility ?? {}, joinedAt: row.joined_at, institution: institutionView(row.institution), institutionId: row.institution_id,
    }
}

export async function getCompetitionDetail(slug: string, profile: User): Promise<Result<{ competition: CompetitionDetail }>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const db = createServiceClient()
    const [pathways, me, { count }] = await Promise.all([
        loadPathways(c.id),
        loadParticipant(c.id, profile.id),
        db.from('competition_participants').select('id', { count: 'exact', head: true }).eq('competition_id', c.id),
    ])
    const { institutionId: _omit, ...meView } = me ?? ({} as NonNullable<typeof me>)
    void _omit
    return {
        ok: true,
        competition: {
            id: c.id, slug: c.slug, name: c.name, tagline: c.tagline, description: c.description, format: 'world', status: c.status,
            themeColor: c.theme_color, icon: c.icon, seasonName: c.season_name, startsAt: c.season_start, endsAt: c.season_end,
            weeks: c.weeks, pathways, participants: count ?? 0, joined: Boolean(me), canPlay: true,
            clock: semesterClock(c.season_start, c.season_end, c.weeks),
            me: me ? (meView as WorldParticipantView) : null,
        },
    }
}

// ─── Institutions ────────────────────────────────────────────────────────────

export async function searchInstitutions(q: string): Promise<InstitutionView[]>
{
    let query = createServiceClient().from('institutions').select('id, name, short_name, state, kind').eq('status', 'approved').order('name').limit(30)
    const term = q.trim().replace(/[%,()]/g, '').slice(0, 60)
    if (term) query = query.or(`name.ilike.%${term}%,short_name.ilike.%${term}%`)
    const { data } = await query
    return ((data ?? []) as Parameters<typeof institutionView>[0][]).map((r) => institutionView(r)!)
}

/** Existing approved institution id, or a new 'pending' one created from a typed name. */
async function resolveInstitution(input: { institutionId?: string | null; institutionName?: string | null }, profile: User): Promise<Result<{ id: string | null }>>
{
    const db = createServiceClient()
    if (input.institutionId)
    {
        const { data } = await db.from('institutions').select('id').eq('id', input.institutionId).in('status', ['approved', 'pending']).maybeSingle()
        return data ? { ok: true, id: data.id } : fail('Choose your institution from the list.')
    }
    const name = input.institutionName?.trim().replace(/\s+/g, ' ').slice(0, 120)
    if (!name) return { ok: true, id: null }
    if (name.length < 4) return fail('Enter your institution’s full name.')
    const { data: existing } = await db.from('institutions').select('id').ilike('name', name).maybeSingle()
    if (existing) return { ok: true, id: existing.id }
    const { data, error } = await db.from('institutions').insert({ name, kind: 'other', status: 'pending', created_by: profile.id }).select('id').single()
    return error || !data ? fail('Could not save your institution. Please try again.') : { ok: true, id: data.id }
}

// ─── Join / me ───────────────────────────────────────────────────────────────

export interface JoinInput
{
    pathway: string
    institutionId?: string | null
    institutionName?: string | null
    state?: string | null
    character?: number
    accessibility?: { lite?: boolean; captions?: boolean; reducedMotion?: boolean }
}

function cleanAccessibility(a: JoinInput['accessibility']) { return { lite: Boolean(a?.lite), captions: Boolean(a?.captions), reducedMotion: Boolean(a?.reducedMotion) } }
function cleanState(s?: string | null) { return s && (NIGERIAN_STATES as readonly string[]).includes(s) ? s : null }
function cleanCharacter(n?: number) { return Number.isInteger(n) && (n as number) >= 0 && (n as number) < 12 ? (n as number) : 0 }

export async function joinWorld(slug: string, profile: User, input: JoinInput): Promise<Result>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    if (c.season_end && Date.now() > new Date(c.season_end).getTime()) return fail('This semester has ended.')
    const pathways = await loadPathways(c.id)
    if (!pathways.some((p) => p.key === input.pathway)) return fail('Choose the Career or Enterprise pathway.')
    const inst = await resolveInstitution(input, profile)
    if (!inst.ok) return inst

    const db = createServiceClient()
    const { data: existing } = await db.from('competition_participants').select('id, pathway').eq('competition_id', c.id).eq('user_id', profile.id).maybeSingle()
    if (existing?.pathway) return fail('You’ve already joined this competition.')

    const row = {
        competition_id: c.id, user_id: profile.id, pathway: input.pathway, institution_id: inst.id, state: cleanState(input.state),
        avatar: { character: cleanCharacter(input.character) }, accessibility: cleanAccessibility(input.accessibility),
    }
    const { error } = existing
        ? await db.from('competition_participants').update(row).eq('id', existing.id)
        : await db.from('competition_participants').insert(row)
    return error ? fail('Could not join. Please try again.') : { ok: true }
}

export async function updateWorldMe(slug: string, profile: User, input: Partial<JoinInput>): Promise<Result>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const db = createServiceClient()
    const me = await loadParticipant(c.id, profile.id)
    if (!me) return fail('Join the competition first.')

    const patch: Record<string, unknown> = {}
    if (input.state !== undefined) patch.state = cleanState(input.state)
    if (input.character !== undefined) patch.avatar = { character: cleanCharacter(input.character) }
    if (input.accessibility !== undefined) patch.accessibility = cleanAccessibility(input.accessibility)
    if (input.institutionId !== undefined || input.institutionName !== undefined)
    {
        const inst = await resolveInstitution(input, profile)
        if (!inst.ok) return inst
        patch.institution_id = inst.id
    }
    if (input.pathway !== undefined && input.pathway !== me.pathway)
    {
        // Switching pathway is only allowed before any attempt (scoreboards stay fair).
        const { count } = await db.from('competition_attempts').select('id', { count: 'exact', head: true }).eq('competition_id', c.id).eq('user_id', profile.id)
        if ((count ?? 0) > 0) return fail('You can’t switch pathway after starting missions.')
        if (!(await loadPathways(c.id)).some((p) => p.key === input.pathway)) return fail('Choose the Career or Enterprise pathway.')
        patch.pathway = input.pathway
    }
    if (Object.keys(patch).length === 0) return { ok: true }
    const { error } = await db.from('competition_participants').update(patch).eq('competition_id', c.id).eq('user_id', profile.id)
    return error ? fail('Could not save. Please try again.') : { ok: true }
}

// ─── Quests ──────────────────────────────────────────────────────────────────

function statusOf(missionAttempts: AttemptRow[]): AttemptStatus | null
{
    if (missionAttempts.some((a) => a.status === 'passed')) return 'passed'
    const last = missionAttempts.sort((a, b) => b.attempt_no - a.attempt_no)[0]
    return last ? last.status : null
}

async function buildMissionViews(c: CompetitionRow, pathway: Pathway, userId: string, filter: { week?: number; ids?: string[] } = {}): Promise<{ views: MissionView[]; missions: MissionRow[]; attempts: AttemptRow[] }>
{
    const db = createServiceClient()
    let mq = db.from('competition_missions').select(MISSION_COLUMNS)
        .eq('competition_id', c.id).eq('pathway', pathway).eq('verification', 'activity').eq('is_active', true)
        .order('week').order('day')
    if (filter.ids) mq = mq.in('id', filter.ids)
    const [{ data: mrows }, { data: arows }] = await Promise.all([
        mq,
        db.from('competition_attempts')
            .select('id, mission_id, user_id, attempt_no, status, score, feedback, rubric_scores, created_at, reviewed_at, ai_score, ai_feedback, payload, flags, appeal_status')
            .eq('competition_id', c.id).eq('user_id', userId),
    ])
    const allMissions = (mrows ?? []) as MissionRow[]
    const attempts = (arows ?? []) as AttemptRow[]
    const rubrics = await loadRubrics(allMissions.map((m) => m.rubric_key).filter(Boolean) as string[])

    // Stage gate: stage N (> 1) opens once stage N-1 is passed.
    const scores = stageScores(allMissions, attempts)
    const passedStages = new Set(scores.filter((s) => s.passed).map((s) => s.stage))
    const now = Date.now()

    const shown = filter.week ? allMissions.filter((m) => m.week === filter.week) : allMissions
    const views = shown.map((m): MissionView =>
    {
        const mine = attempts.filter((a) => a.mission_id === m.id)
        const opensAt = c.season_start ? unlockAt(c.season_start, m.week, m.day) : null
        const timeLocked = !opensAt || now < opensAt.getTime()
        const stageLocked = m.stage > 1 && !passedStages.has(m.stage - 1)
        const st = statusOf([...mine])
        const status: MissionStatus = st ?? (timeLocked || stageLocked ? 'locked' : 'available')
        const last = [...mine].sort((a, b) => b.attempt_no - a.attempt_no)[0]
        return {
            id: m.id, key: m.key, pathway: m.pathway, stage: m.stage, week: m.week, day: m.day, title: m.title, story: m.story,
            kind: m.kind, config: m.config, estMinutes: m.est_minutes, xp: m.xp, tokens: m.tokens, bucket: m.bucket,
            reviewMode: m.review_mode, rubric: m.rubric_key ? rubrics.get(m.rubric_key) ?? null : null, status,
            unlocksAt: (opensAt ?? new Date(0)).toISOString(), attemptsUsed: mine.length, maxAttempts: m.max_attempts || MAX_ATTEMPTS,
            lastAttempt: last ? toAttemptView(last) : null, badge: m.badge ?? null,
        }
    })
    return { views, missions: allMissions, attempts }
}

export async function listQuests(slug: string, profile: User, week?: number): Promise<Result<{ week: number | null; missions: MissionView[] }>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const me = await loadParticipant(c.id, profile.id)
    if (!me) return fail('Join the competition first.')
    const clock = semesterClock(c.season_start, c.season_end, c.weeks)
    const w = week && week >= 1 && week <= c.weeks ? week : clock.week ?? 1
    const { views } = await buildMissionViews(c, me.pathway, profile.id, { week: w })
    return { ok: true, week: w, missions: views }
}

/** Today's quest plus anything still open from earlier days (catch-up, no streak pressure). */
export async function todayQuests(slug: string, profile: User): Promise<Result<{ today: MissionView | null; catchUp: MissionView[]; clock: ReturnType<typeof semesterClock> }>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const me = await loadParticipant(c.id, profile.id)
    if (!me) return fail('Join the competition first.')
    const clock = semesterClock(c.season_start, c.season_end, c.weeks)
    const { views } = await buildMissionViews(c, me.pathway, profile.id)
    const today = clock.week ? views.find((m) => m.week === clock.week && m.day === clock.day) ?? null : null
    const catchUp = views.filter((m) => m !== today && ['available', 'needs_revision'].includes(m.status))
    return { ok: true, today, catchUp, clock }
}

export async function getMission(slug: string, missionId: string, profile: User): Promise<Result<{ mission: MissionView; attempts: AttemptView[] }>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const me = await loadParticipant(c.id, profile.id)
    if (!me) return fail('Join the competition first.')
    const { views, attempts } = await buildMissionViews(c, me.pathway, profile.id)
    const mission = views.find((m) => m.id === missionId)
    if (!mission) return fail('Mission not found.')
    return {
        ok: true, mission,
        attempts: attempts.filter((a) => a.mission_id === missionId).sort((a, b) => a.attempt_no - b.attempt_no).map(toAttemptView),
    }
}

// ─── Uploads ─────────────────────────────────────────────────────────────────

const UPLOAD_TYPES: Record<string, { ext: string; group: 'image' | 'pdf' | 'video'; max: number }> = {
    'image/jpeg': { ext: 'jpg', group: 'image', max: 10 * 1024 * 1024 },
    'image/png': { ext: 'png', group: 'image', max: 10 * 1024 * 1024 },
    'image/webp': { ext: 'webp', group: 'image', max: 10 * 1024 * 1024 },
    'application/pdf': { ext: 'pdf', group: 'pdf', max: 10 * 1024 * 1024 },
    'video/mp4': { ext: 'mp4', group: 'video', max: 150 * 1024 * 1024 },
    'video/quicktime': { ext: 'mov', group: 'video', max: 150 * 1024 * 1024 },
    'video/webm': { ext: 'webm', group: 'video', max: 150 * 1024 * 1024 },
}

const uploadPrefix = (competitionId: string, userId: string, missionId: string) => `world/${competitionId}/${userId}/${missionId}/`

export async function createUploadUrl(slug: string, missionId: string, profile: User, input: { fieldId: string; contentType: string; sizeBytes: number }): Promise<Result<{ uploadUrl: string; key: string; expiresInS: number }>>
{
    if (!isR2Configured()) return fail('File uploads are not switched on yet.')
    const got = await getMission(slug, missionId, profile)
    if (!got.ok) return got
    const m = got.mission
    if (m.status === 'locked') return fail('This mission isn’t open yet.')
    if (!isFormKind(m.kind)) return fail('This mission doesn’t take uploads.')
    const field = (m.config as FormConfig).fields.find((f) => f.id === input.fieldId)
    if (!field || (field.type !== 'file' && field.type !== 'video')) return fail('That field doesn’t take uploads.')
    const t = UPLOAD_TYPES[input.contentType]
    const accept = field.accept ?? (field.type === 'video' ? ['video'] : ['image', 'pdf'])
    if (!t || !accept.includes(t.group)) return fail(`Upload a ${accept.join(' or ')} file.`)
    if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > t.max) return fail(`Files must be ${Math.round(t.max / 1024 / 1024)} MB or smaller.`)

    const c = (await loadCompetition(slug))!
    const key = `${uploadPrefix(c.id, profile.id, missionId)}${randomUUID()}.${t.ext}`
    return { ok: true, uploadUrl: await presignUpload(key, input.contentType, input.sizeBytes), key, expiresInS: 3600 }
}

// ─── Attempts ────────────────────────────────────────────────────────────────

async function loadAnswerKey(missionId: string): Promise<unknown>
{
    const { data } = await createServiceClient().from('competition_mission_keys').select('answer_key').eq('mission_id', missionId).maybeSingle()
    return data?.answer_key ?? null
}

async function grantBadge(userId: string, slug: string, badge: { key: string; label: string })
{
    const db = createServiceClient()
    const key = `world:${slug}:${badge.key}`
    const { data } = await db.from('user_badges').select('id').eq('user_id', userId).eq('badge_key', key).maybeSingle()
    if (!data) await db.from('user_badges').insert({ user_id: userId, badge_key: key, label: badge.label, icon: 'award' })
}

async function awardMission(userId: string, missionId: string): Promise<{ xp: number; tokens: number }>
{
    const { data, error } = await createServiceClient().rpc('_unsafe_award_world_mission', { p_user_id: userId, p_mission_id: missionId })
    if (error) throw new Error(error.message)
    const r = (data ?? {}) as { xp?: number; tokens?: number }
    return { xp: Number(r.xp ?? 0), tokens: Number(r.tokens ?? 0) }
}

export interface SubmitResult
{
    attempt: AttemptView
    awarded: { xp: number; tokens: number }
    badge: { key: string; label: string } | null
}

export async function submitAttempt(slug: string, missionId: string, profile: User, payload: AttemptPayload): Promise<Result<SubmitResult>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const clock = semesterClock(c.season_start, c.season_end, c.weeks)
    if (clock.phase !== 'running') return fail(clock.phase === 'ended' ? 'This semester has ended.' : 'The semester hasn’t started yet.')

    const got = await getMission(slug, missionId, profile)
    if (!got.ok) return got
    const m = got.mission
    if (m.status === 'locked') return fail('This mission isn’t open yet.')
    if (m.status === 'passed') return fail('You’ve already completed this mission.')
    if (m.status === 'in_review') return fail('Your last submission is still being reviewed.')
    if (m.attemptsUsed >= m.maxAttempts) return fail(`You’ve used all ${m.maxAttempts} attempts for this mission.`)

    // ── Grade or review ──
    let status: AttemptStatus
    let score: number | null = null
    let autoScore: number | null = null
    let feedback: string | null = null
    let aiScore: number | null = null
    let aiFeedback: unknown = null
    let rubricScores: Record<string, number> | null = null
    let flags: string[] = []
    const passMark = m.rubric?.passMark ?? DEFAULT_PASS_MARK

    if (!isFormKind(m.kind))
    {
        const graded = autoGrade(m.kind, m.config, await loadAnswerKey(m.id), payload)
        if (!graded.ok) return graded
        score = autoScore = graded.score
        status = graded.score >= passMark ? 'passed' : 'needs_revision'
        feedback = status === 'passed' ? 'Nice work — mission complete.' : `You scored ${graded.score}. Review the brief and try again.`
    } else
    {
        if (payload.kind !== 'form') return fail('This submission doesn’t match the mission type.')
        const prefix = uploadPrefix(c.id, profile.id, m.id)
        const v = validateForm(m.config as FormConfig, payload.fields ?? {}, payload.checklist, prefix)
        if (!v.ok) return v
        for (const key of v.fileKeys)
            if (!(await getObjectSize(key).catch(() => null))) return fail('One of your uploads didn’t finish. Please upload it again.')

        if (m.reviewMode === 'auto')
        {
            // Completion-scored real-world evidence (the "40% completed evidence" bucket).
            status = 'passed'; score = 100; feedback = 'Submitted — mission complete.'
        } else
        {
            const review = await aiReview({
                userId: profile.id, missionTitle: m.title, missionStory: m.story,
                rubric: m.rubric ?? { key: 'practice', title: 'Practice', passMark, criteria: [{ id: 'overall', label: 'Overall quality', weight: 1 }] },
                submissionText: formToText(m.config as FormConfig, payload.fields ?? {}),
            })
            if (review)
            {
                aiScore = review.score; aiFeedback = review; flags = review.flags; rubricScores = review.criteria
            }
            if (m.reviewMode === 'human' || !review)
            {
                // Judges (or a reviewer, when AI is unavailable) decide; AI score is only a suggestion.
                status = 'in_review'; rubricScores = null
                feedback = m.reviewMode === 'human' ? 'Submitted! Judges will score this soon.' : 'Submitted! A reviewer will check this soon.'
            } else if (flags.includes('unsafe'))
            {
                status = 'in_review'; feedback = 'Submitted. A moderator will review this before it counts.'
            } else if (flags.includes('personal_data'))
            {
                status = 'needs_revision'; score = null
                feedback = 'Please remove personal details about other people (names, phone numbers, addresses) and submit again.'
            } else
            {
                score = review!.score
                status = review!.score >= passMark ? 'passed' : 'needs_revision'
                feedback = review!.feedback
            }
        }
    }

    // ── Store ──
    const db = createServiceClient()
    const { data: row, error } = await db.from('competition_attempts').insert({
        competition_id: c.id, mission_id: m.id, user_id: profile.id, attempt_no: m.attemptsUsed + 1,
        payload, status, score, auto_score: autoScore, ai_score: aiScore, ai_feedback: aiFeedback,
        feedback, rubric_scores: rubricScores, flags,
        reviewed_at: status === 'in_review' ? null : new Date().toISOString(),
    }).select('id, mission_id, user_id, attempt_no, status, score, feedback, rubric_scores, created_at, reviewed_at, ai_score, ai_feedback, payload, flags, appeal_status').single()
    if (error || !row)
        return fail(error?.code === '23505' ? 'That attempt was already submitted.' : 'Could not save your submission. Please try again.')

    let awarded = { xp: 0, tokens: 0 }
    let badge: SubmitResult['badge'] = null
    if (status === 'passed')
    {
        awarded = await awardMission(profile.id, m.id).catch(() => ({ xp: 0, tokens: 0 }))
        if (m.badge) { await grantBadge(profile.id, c.slug, m.badge); badge = m.badge }
    }
    return { ok: true, attempt: toAttemptView(row as AttemptRow), awarded, badge }
}

export async function appealAttempt(slug: string, attemptId: string, profile: User, reason: string): Promise<Result>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const text = reason.trim().slice(0, 1000)
    if (text.length < 10) return fail('Explain why you’re appealing (at least a sentence).')
    const { data, error } = await createServiceClient().from('competition_attempts')
        .update({ appeal_reason: text, appeal_status: 'open' })
        .eq('id', attemptId).eq('user_id', profile.id).eq('competition_id', c.id)
        .in('status', ['needs_revision', 'rejected', 'passed']).is('appeal_status', null)
        .select('id').maybeSingle()
    if (error || !data) return fail('This attempt can’t be appealed.')
    return { ok: true }
}

// ─── Progress / passport ─────────────────────────────────────────────────────

export async function getProgress(slug: string, profile: User): Promise<Result<{ progress: ProgressView }>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const me = await loadParticipant(c.id, profile.id)
    if (!me) return fail('Join the competition first.')
    const db = createServiceClient()
    const [{ missions, attempts }, { data: xpRows }, { data: tokRows }, { data: badges }] = await Promise.all([
        buildMissionViews(c, me.pathway, profile.id),
        db.from('competition_xp_events').select('amount').eq('competition_id', c.id).eq('user_id', profile.id),
        db.from('hub_token_events').select('amount').eq('user_id', profile.id),
        db.from('user_badges').select('badge_key, label, icon, awarded_at').eq('user_id', profile.id).like('badge_key', `world:${c.slug}:%`).order('awarded_at'),
    ])
    const xp = ((xpRows ?? []) as { amount: number }[]).reduce((s, r) => s + r.amount, 0)
    const tokens = ((tokRows ?? []) as { amount: number }[]).reduce((s, r) => s + r.amount, 0)
    const { count } = await db.from('competition_scores').select('user_id', { count: 'exact', head: true })
        .eq('competition_id', c.id).eq('pathway', me.pathway).gt('xp', xp)
    return {
        ok: true,
        progress: {
            level: worldLevel(xp), xp, tokens, rank: (count ?? 0) + 1,
            stages: stageScores(missions, attempts),
            badges: ((badges ?? []) as { badge_key: string; label: string; icon: string | null; awarded_at: string }[])
                .map((b) => ({ key: b.badge_key.replace(`world:${c.slug}:`, ''), label: b.label, icon: b.icon, awardedAt: b.awarded_at })),
        },
    }
}

// ─── Leaderboards ────────────────────────────────────────────────────────────

export async function worldLeaderboard(slug: string, profile: User, opts: { pathway?: string; scope?: string; value?: string; limit?: number }): Promise<Result<{ entries: WorldLeaderboardEntry[] }>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const pathway = opts.pathway === 'enterprise' ? 'enterprise' : 'career'
    const db = createServiceClient()
    let q = db.from('competition_scores').select('user_id, xp, missions_completed, state, institution_id, last_xp_at')
        .eq('competition_id', c.id).eq('pathway', pathway)
        .order('xp', { ascending: false }).order('last_xp_at', { ascending: true, nullsFirst: false })
        .limit(Math.min(Math.max(opts.limit ?? 50, 1), 100))
    if (opts.scope === 'institution' && opts.value) q = q.eq('institution_id', opts.value)
    if (opts.scope === 'state' && opts.value) q = q.eq('state', opts.value)
    const { data } = await q
    const rows = (data ?? []) as { user_id: string; xp: number; missions_completed: number; state: string | null; institution_id: string | null }[]
    if (rows.length === 0) return { ok: true, entries: [] }
    const [{ data: users }, { data: insts }] = await Promise.all([
        db.from('users').select('id, username, display_name, avatar_url').in('id', rows.map((r) => r.user_id)),
        db.from('institutions').select('id, name, short_name').in('id', [...new Set(rows.map((r) => r.institution_id).filter(Boolean))] as string[]),
    ])
    const u = new Map(((users ?? []) as { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]).map((x) => [x.id, x]))
    const i = new Map(((insts ?? []) as { id: string; name: string; short_name: string | null }[]).map((x) => [x.id, x]))
    return {
        ok: true,
        entries: rows.map((r, idx) => ({
            rank: idx + 1, userId: r.user_id, username: u.get(r.user_id)?.username ?? null, displayName: u.get(r.user_id)?.display_name ?? null,
            avatarUrl: u.get(r.user_id)?.avatar_url ?? null, xp: r.xp, missionsCompleted: r.missions_completed,
            institution: r.institution_id ? (i.get(r.institution_id)?.short_name ?? i.get(r.institution_id)?.name ?? null) : null, state: r.state,
        })),
    }
}

/** Campus league: institutions ranked by average XP per participant (min 3 participants). */
export async function institutionLeague(slug: string, profile: User, pathway?: string): Promise<Result<{ entries: InstitutionLeagueEntry[] }>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const db = createServiceClient()
    let q = db.from('competition_scores').select('institution_id, xp').eq('competition_id', c.id).not('institution_id', 'is', null).limit(50000)
    if (pathway === 'career' || pathway === 'enterprise') q = q.eq('pathway', pathway)
    const { data } = await q
    const agg = new Map<string, { n: number; xp: number }>()
    for (const r of (data ?? []) as { institution_id: string; xp: number }[])
    {
        const a = agg.get(r.institution_id) ?? { n: 0, xp: 0 }
        a.n++; a.xp += r.xp; agg.set(r.institution_id, a)
    }
    const ids = [...agg.entries()].filter(([, a]) => a.n >= 3).map(([id]) => id)
    if (ids.length === 0) return { ok: true, entries: [] }
    const { data: insts } = await db.from('institutions').select('id, name, short_name').in('id', ids)
    const entries = ((insts ?? []) as { id: string; name: string; short_name: string | null }[]).map((inst) =>
    {
        const a = agg.get(inst.id)!
        return { rank: 0, institutionId: inst.id, name: inst.name, shortName: inst.short_name, participants: a.n, totalXp: a.xp, averageXp: Math.round(a.xp / a.n) }
    }).sort((x, y) => y.averageXp - x.averageXp || y.participants - x.participants)
    entries.forEach((e, idx) => { e.rank = idx + 1 })
    return { ok: true, entries }
}

// ─── Admin: content + review ─────────────────────────────────────────────────

/** Loads authored content (lib/world/content) into the DB. overwrite=false only adds missing missions. */
export async function syncContent(slug: string, profile: User, overwrite = false): Promise<Result<{ inserted: number; updated: number }>>
{
    if (!isAdmin(profile)) return fail('Unauthorized')
    const c = await loadCompetition(slug)
    const content = WORLD_CONTENT[slug]
    if (!c || c.format !== 'world' || !content) return fail(NOT_FOUND)
    const db = createServiceClient()
    const { data: existing } = await db.from('competition_missions').select('id, key').eq('competition_id', c.id)
    const byKey = new Map(((existing ?? []) as { id: string; key: string }[]).map((m) => [m.key, m.id]))
    let inserted = 0, updated = 0

    for (const s of content)
    {
        const row = {
            competition_id: c.id, key: s.key, zone_key: s.pathway === 'career' ? 'career_district' : 'enterprise_hub',
            title: s.title, description: null, xp: s.xp, verification: 'activity', auto_metric: null, target: 1, proof_hint: null,
            is_active: true, sort_order: s.week * 10 + s.day, pathway: s.pathway, stage: stageOfWeek(s.week), week: s.week, day: s.day,
            kind: s.kind, config: s.config, story: s.story, est_minutes: s.estMinutes, tokens: s.tokens, bucket: s.bucket,
            review_mode: s.reviewMode, rubric_key: s.rubricKey ?? null, max_attempts: MAX_ATTEMPTS, badge: s.badge ?? null,
        }
        let id = byKey.get(s.key)
        if (id && !overwrite) continue
        if (id)
        {
            const { error } = await db.from('competition_missions').update(row).eq('id', id)
            if (error) return fail(`Could not update ${s.key}: ${error.message}`)
            updated++
        } else
        {
            const { data, error } = await db.from('competition_missions').insert(row).select('id').single()
            if (error || !data) return fail(`Could not insert ${s.key}: ${error?.message}`)
            id = data.id; inserted++
        }
        if (s.answerKey)
        {
            const { error } = await db.from('competition_mission_keys').upsert({ mission_id: id, answer_key: s.answerKey })
            if (error) return fail(`Could not save the answer key for ${s.key}.`)
        }
    }
    return { ok: true, inserted, updated }
}

export interface ReviewQueueItem
{
    attemptId: string
    createdAt: string
    competition: string
    mission: { id: string; title: string; kind: MissionKind; pathway: Pathway; week: number; day: number; config: MissionConfig }
    rubric: RubricView | null
    user: { id: string; username: string | null; displayName: string | null }
    payload: unknown
    files: { fieldId: string; url: string }[]
    aiSuggestion: { score: number | null; feedback: string | null; criteria: Record<string, number> | null }
    flags: string[]
    appeal: { reason: string | null; status: string | null }
}

export async function reviewQueue(profile: User, opts: { appeals?: boolean; limit?: number } = {}): Promise<Result<{ items: ReviewQueueItem[] }>>
{
    if (!isAdmin(profile)) return fail('Unauthorized')
    const db = createServiceClient()
    let q = db.from('competition_attempts')
        .select('id, created_at, payload, ai_score, ai_feedback, flags, appeal_reason, appeal_status, user_id, mission_id, competition:competitions(slug)')
        .order('created_at', { ascending: true }).limit(Math.min(opts.limit ?? 50, 100))
    q = opts.appeals ? q.eq('appeal_status', 'open') : q.eq('status', 'in_review')
    const { data } = await q
    const rows = (data ?? []) as unknown as { id: string; created_at: string; payload: AttemptPayload; ai_score: number | null; ai_feedback: { feedback?: string; criteria?: Record<string, number> } | null; flags: string[]; appeal_reason: string | null; appeal_status: string | null; user_id: string; mission_id: string; competition: { slug: string } | null }[]
    if (rows.length === 0) return { ok: true, items: [] }

    const [{ data: missions }, { data: users }] = await Promise.all([
        db.from('competition_missions').select(MISSION_COLUMNS).in('id', [...new Set(rows.map((r) => r.mission_id))]),
        db.from('users').select('id, username, display_name').in('id', [...new Set(rows.map((r) => r.user_id))]),
    ])
    const mm = new Map(((missions ?? []) as MissionRow[]).map((m) => [m.id, m]))
    const uu = new Map(((users ?? []) as { id: string; username: string | null; display_name: string | null }[]).map((u) => [u.id, u]))
    const rubrics = await loadRubrics(((missions ?? []) as MissionRow[]).map((m) => m.rubric_key).filter(Boolean) as string[])

    const items = await Promise.all(rows.map(async (r): Promise<ReviewQueueItem> =>
    {
        const m = mm.get(r.mission_id)!
        const files: ReviewQueueItem['files'] = []
        if (r.payload?.kind === 'form')
            for (const [fieldId, v] of Object.entries(r.payload.fields ?? {}))
                for (const one of [v].flat())
                    if (one && typeof one === 'object' && 'key' in one) files.push({ fieldId, url: await presignDownload(one.key, 30 * 60) })
        return {
            attemptId: r.id, createdAt: r.created_at, competition: r.competition?.slug ?? '',
            mission: { id: m.id, title: m.title, kind: m.kind, pathway: m.pathway, week: m.week, day: m.day, config: m.config },
            rubric: m.rubric_key ? rubrics.get(m.rubric_key) ?? null : null,
            user: { id: r.user_id, username: uu.get(r.user_id)?.username ?? null, displayName: uu.get(r.user_id)?.display_name ?? null },
            payload: r.payload, files,
            aiSuggestion: { score: r.ai_score === null ? null : Number(r.ai_score), feedback: r.ai_feedback?.feedback ?? null, criteria: r.ai_feedback?.criteria ?? null },
            flags: r.flags ?? [], appeal: { reason: r.appeal_reason, status: r.appeal_status },
        }
    }))
    return { ok: true, items }
}

export interface ReviewInput
{
    attemptId: string
    decision: 'pass' | 'revise' | 'reject'
    rubricScores?: Record<string, number>
    feedback: string
    /** For appeals: 'upheld' (re-scored) or 'dismissed'. */
    appeal?: 'upheld' | 'dismissed'
}

export async function reviewAttempt(profile: User, input: ReviewInput): Promise<Result<{ score: number | null; awarded: { xp: number; tokens: number } }>>
{
    if (!isAdmin(profile)) return fail('Unauthorized')
    const db = createServiceClient()
    const { data: a } = await db.from('competition_attempts').select('id, user_id, mission_id, status, appeal_status, competition:competitions(slug)').eq('id', input.attemptId).maybeSingle()
    if (!a) return fail('Submission not found.')
    const attempt = a as unknown as { id: string; user_id: string; mission_id: string; status: AttemptStatus; appeal_status: string | null; competition: { slug: string } | null }
    const isAppeal = attempt.appeal_status === 'open'
    if (attempt.status !== 'in_review' && !isAppeal) return fail('This submission was already reviewed.')
    if (isAppeal && input.appeal === 'dismissed')
    {
        await db.from('competition_attempts').update({ appeal_status: 'dismissed', reviewer_id: profile.id }).eq('id', attempt.id)
        return { ok: true, score: null, awarded: { xp: 0, tokens: 0 } }
    }

    const { data: mission } = await db.from('competition_missions').select(MISSION_COLUMNS).eq('id', attempt.mission_id).single()
    const m = mission as MissionRow
    const rubric = m.rubric_key ? (await loadRubrics([m.rubric_key])).get(m.rubric_key) ?? null : null
    let score: number | null = null
    let rubricScores: Record<string, number> | null = null
    if (input.decision !== 'reject')
    {
        if (!rubric) return fail('This mission has no rubric.')
        rubricScores = {}
        for (const cr of rubric.criteria)
        {
            const v = Number(input.rubricScores?.[cr.id])
            if (!Number.isFinite(v) || v < 0 || v > 100) return fail(`Score “${cr.label}” from 0 to 100.`)
            rubricScores[cr.id] = Math.round(v)
        }
        const w = rubric.criteria.reduce((s, cr) => s + cr.weight, 0) || 1
        score = Math.round(rubric.criteria.reduce((s, cr) => s + rubricScores![cr.id] * cr.weight, 0) / w)
        if (input.decision === 'pass' && score < rubric.passMark) return fail(`A pass needs at least ${rubric.passMark}; this scores ${score}. Choose “revise” instead.`)
    }
    const status: AttemptStatus = input.decision === 'pass' ? 'passed' : input.decision === 'revise' ? 'needs_revision' : 'rejected'
    const feedback = input.feedback.trim().slice(0, 2000)
    if (feedback.length < 5) return fail('Add feedback for the participant.')

    // Only the reviewer who flips it from in_review (or the open appeal) wins.
    let upd = db.from('competition_attempts').update({
        status, score, rubric_scores: rubricScores, feedback, reviewer_id: profile.id, reviewed_at: new Date().toISOString(),
        ...(isAppeal ? { appeal_status: 'upheld' } : {}),
    }).eq('id', attempt.id)
    upd = isAppeal ? upd.eq('appeal_status', 'open') : upd.eq('status', 'in_review')
    const { data: done } = await upd.select('id').maybeSingle()
    if (!done) return fail('This submission was already reviewed.')

    let awarded = { xp: 0, tokens: 0 }
    if (status === 'passed')
    {
        awarded = await awardMission(attempt.user_id, m.id).catch(() => ({ xp: 0, tokens: 0 }))
        if (m.badge && attempt.competition?.slug) await grantBadge(attempt.user_id, attempt.competition.slug, m.badge)
    }
    return { ok: true, score, awarded }
}

export async function addTester(slug: string, profile: User, username: string): Promise<Result>
{
    if (!isAdmin(profile)) return fail('Unauthorized')
    const c = await loadCompetition(slug)
    if (!c) return fail(NOT_FOUND)
    const db = createServiceClient()
    const { data: u } = await db.from('users').select('id').eq('username', username.trim().replace(/^@/, '')).maybeSingle()
    if (!u) return fail('No user with that username.')
    const { error } = await db.from('competition_testers').upsert({ competition_id: c.id, user_id: u.id })
    return error ? fail('Could not add tester.') : { ok: true }
}
