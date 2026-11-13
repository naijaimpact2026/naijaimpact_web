import { createServiceClient } from '@/lib/supabase/service'
import type { User } from '@/lib/types'
import { invalidateWorldCache } from './cache'
import { stageOfWeek } from './schedule'
import { isAdmin, type Result } from './service'
import { MAX_ATTEMPTS, type MissionConfig, type MissionKind, type Pathway, type ReviewMode, type RubricView, type ScoreBucket } from './types'
import {
    FINALE_RUBRIC, checkMission, checkWeek, isFinaleWeek, isInt, isStr, labelled,
    type AdminMission, type MissionInput, type WeekCheck,
} from './content-rules'

/*
 * Admin content editor for Hubnovo World. Weeks 1–4 live in code
 * (lib/world/content → syncContent); later weeks are written by the
 * curriculum lead from /app/competitions/[slug]/admin/content, which calls
 * these functions (web via server actions in lib/actions/world.ts, REST via
 * /api/competitions/[slug]/admin/*).
 *
 * Rules:
 *  - answer keys go to competition_mission_keys and never reach students;
 *    graded quizzes, sorts and scenarios can't be saved without one
 *  - a mission that has attempts is never deleted — it is switched off
 *  - day 7 is the Sunday boss (kind 'boss', judged by humans); the day-7
 *    boss of weeks 4, 8, 12 and 16 is the stage finale (rubric 'showcase')
 *  - one active mission per pathway / week / day
 */

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
const UNAUTHORIZED = 'Unauthorized'
const NOT_FOUND = 'Competition not found.'

interface MissionDbRow
{
    id: string; key: string; pathway: Pathway; stage: number; week: number; day: number; title: string; story: string | null
    kind: MissionKind; config: MissionConfig; xp: number; tokens: number; bucket: ScoreBucket; review_mode: ReviewMode
    rubric_key: string | null; est_minutes: number; max_attempts: number; badge: { key: string; label: string } | null; is_active: boolean
}

const COLUMNS = 'id, key, pathway, stage, week, day, title, story, kind, config, xp, tokens, bucket, review_mode, rubric_key, est_minutes, max_attempts, badge, is_active'

// ─── Access ──────────────────────────────────────────────────────────────────

async function adminWorld(slug: string, profile: User): Promise<Result<{ comp: { id: string; slug: string; weeks: number } }>>
{
    if (!isAdmin(profile)) return fail(UNAUTHORIZED)
    const { data } = await createServiceClient().from('competitions').select('id, slug, weeks, format').eq('slug', slug).maybeSingle()
    if (!data || data.format !== 'world') return fail(NOT_FOUND)
    return { ok: true, comp: { id: data.id, slug: data.slug, weeks: data.weeks ?? 16 } }
}

export type { AdminMission, MissionInput, WeekCheck }

// ─── Reads ───────────────────────────────────────────────────────────────────

function toAdmin(r: MissionDbRow, answerKey: Record<string, unknown> | null, attempts: number): AdminMission
{
    return {
        id: r.id, key: r.key, pathway: r.pathway, stage: r.stage, week: r.week, day: r.day, title: r.title, story: r.story, kind: r.kind,
        config: r.config, answerKey, xp: r.xp, tokens: r.tokens, bucket: r.bucket, reviewMode: r.review_mode, rubricKey: r.rubric_key,
        estMinutes: r.est_minutes, maxAttempts: r.max_attempts, badge: r.badge, isActive: r.is_active, attempts,
    }
}

/** Attempts per mission (counted in small parallel batches). */
async function attemptCounts(ids: string[]): Promise<Map<string, number>>
{
    const db = createServiceClient()
    const out = new Map<string, number>()
    for (let i = 0; i < ids.length; i += 25)
    {
        const batch = ids.slice(i, i + 25)
        const counts = await Promise.all(batch.map((id) =>
            db.from('competition_attempts').select('id', { count: 'exact', head: true }).eq('mission_id', id).then((r) => r.count ?? 0)))
        batch.forEach((id, j) => out.set(id, counts[j]))
    }
    return out
}

export interface MissionFilters { pathway?: string; week?: number; day?: number; active?: boolean }

export async function listAdminMissions(slug: string, profile: User, filters: MissionFilters = {}): Promise<Result<{ missions: AdminMission[]; weeks: number; checks: WeekCheck[] }>>
{
    const a = await adminWorld(slug, profile)
    if (!a.ok) return a
    const db = createServiceClient()
    let q = db.from('competition_missions').select(COLUMNS).eq('competition_id', a.comp.id).eq('verification', 'activity')
    if (filters.pathway === 'career' || filters.pathway === 'enterprise') q = q.eq('pathway', filters.pathway)
    if (filters.week) q = q.eq('week', filters.week)
    if (filters.day) q = q.eq('day', filters.day)
    if (filters.active !== undefined) q = q.eq('is_active', filters.active)
    const { data, error } = await q.order('week').order('day').order('pathway').limit(2000)
    if (error) return fail('Could not load missions.')
    const rows = (data ?? []) as MissionDbRow[]
    const ids = rows.map((r) => r.id)
    const [keys, counts] = await Promise.all([
        ids.length ? db.from('competition_mission_keys').select('mission_id, answer_key').in('mission_id', ids) : Promise.resolve({ data: [] }),
        attemptCounts(ids),
    ])
    const keyMap = new Map(((keys.data ?? []) as { mission_id: string; answer_key: Record<string, unknown> }[]).map((k) => [k.mission_id, k.answer_key]))
    const missions = rows.map((r) => toAdmin(r, keyMap.get(r.id) ?? null, counts.get(r.id) ?? 0))

    // Week checks for every pathway/week present in the result.
    const pairs = new Set(missions.map((m) => `${m.pathway}:${m.week}`))
    const checks = [...pairs].map((p) =>
    {
        const [pathway, week] = p.split(':')
        return checkWeek(pathway as Pathway, Number(week), missions)
    }).sort((x, y) => x.week - y.week || x.pathway.localeCompare(y.pathway))
    return { ok: true, missions, weeks: a.comp.weeks, checks }
}

async function rubricKeys(): Promise<Set<string>>
{
    const { data } = await createServiceClient().from('competition_rubrics').select('key')
    return new Set(((data ?? []) as { key: string }[]).map((r) => r.key))
}

/** Another active mission already sits in this pathway/week/day slot? */
async function slotTaken(competitionId: string, m: { pathway: Pathway; week: number; day: number }, exceptId?: string): Promise<string | null>
{
    let q = createServiceClient().from('competition_missions').select('id, title').eq('competition_id', competitionId).eq('verification', 'activity')
        .eq('is_active', true).eq('pathway', m.pathway).eq('week', m.week).eq('day', m.day)
    if (exceptId) q = q.neq('id', exceptId)
    const { data } = await q.limit(1).maybeSingle()
    return data ? (data as { title: string }).title : null
}

async function freeKey(competitionId: string, base: string): Promise<string>
{
    const { data } = await createServiceClient().from('competition_missions').select('key').eq('competition_id', competitionId).like('key', `${base}%`)
    const taken = new Set(((data ?? []) as { key: string }[]).map((r) => r.key))
    if (!taken.has(base)) return base
    for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`
}

const baseKey = (m: { pathway: Pathway; week: number; day: number }) => `${m.pathway === 'career' ? 'c' : 'e'}-w${m.week}-d${m.day}`

function toRow(competitionId: string, m: MissionInput)
{
    return {
        competition_id: competitionId, zone_key: m.pathway === 'career' ? 'career_district' : 'enterprise_hub',
        title: m.title.trim(), description: null, xp: m.xp, verification: 'activity', auto_metric: null, target: 1, proof_hint: null,
        sort_order: m.week * 10 + m.day, pathway: m.pathway, stage: stageOfWeek(m.week), week: m.week, day: m.day,
        kind: m.kind, config: m.config, story: m.story?.trim() || null, est_minutes: m.estMinutes, tokens: m.tokens, bucket: m.bucket,
        review_mode: m.reviewMode, rubric_key: m.rubricKey || null, badge: m.badge ?? null,
    }
}

/** Answer keys are only kept for auto-graded kinds (a stale key on a form mission is removed). */
async function saveKey(missionId: string, m: MissionInput): Promise<string | null>
{
    const db = createServiceClient()
    const keep = ['quiz', 'sort', 'scenario'].includes(m.kind) && m.answerKey && Object.keys(m.answerKey).length > 0
    const { error } = keep
        ? await db.from('competition_mission_keys').upsert({ mission_id: missionId, answer_key: m.answerKey })
        : await db.from('competition_mission_keys').delete().eq('mission_id', missionId)
    return error ? 'The mission was saved but its answer key was not. Save again.' : null
}

async function loadOne(competitionId: string, id: string): Promise<AdminMission | null>
{
    const db = createServiceClient()
    const { data } = await db.from('competition_missions').select(COLUMNS).eq('id', id).eq('competition_id', competitionId).eq('verification', 'activity').maybeSingle()
    if (!data) return null
    const [{ data: k }, counts] = await Promise.all([
        db.from('competition_mission_keys').select('answer_key').eq('mission_id', id).maybeSingle(),
        attemptCounts([id]),
    ])
    return toAdmin(data as MissionDbRow, (k?.answer_key as Record<string, unknown>) ?? null, counts.get(id) ?? 0)
}

export async function getAdminMission(slug: string, profile: User, id: string): Promise<Result<{ mission: AdminMission }>>
{
    const a = await adminWorld(slug, profile)
    if (!a.ok) return a
    const mission = await loadOne(a.comp.id, id)
    return mission ? { ok: true, mission } : fail('Mission not found.')
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createMission(slug: string, profile: User, input: MissionInput): Promise<Result<{ mission: AdminMission }>>
{
    const a = await adminWorld(slug, profile)
    if (!a.ok) return a
    const bad = checkMission(input, { weeks: a.comp.weeks, rubrics: await rubricKeys() })
    if (bad) return fail(bad)
    const active = input.isActive !== false
    if (active)
    {
        const taken = await slotTaken(a.comp.id, input)
        if (taken) return fail(`Week ${input.week} day ${input.day} already has “${taken}”. Switch it off first, or save this one switched off.`)
    }
    const key = input.key ?? await freeKey(a.comp.id, baseKey(input))
    const db = createServiceClient()
    const { data, error } = await db.from('competition_missions')
        .insert({ ...toRow(a.comp.id, input), key, is_active: active, max_attempts: MAX_ATTEMPTS }).select('id').single()
    if (error || !data) return fail(error?.code === '23505' ? `The key “${key}” is already used.` : 'Could not save the mission.')
    const keyErr = await saveKey(data.id, input)
    invalidateWorldCache()
    if (keyErr) return fail(keyErr)
    return { ok: true, mission: (await loadOne(a.comp.id, data.id))! }
}

/** Full update (same body as create) or a partial one — e.g. { isActive: false } to switch off. */
export async function updateMission(slug: string, profile: User, id: string, patch: Partial<MissionInput>): Promise<Result<{ mission: AdminMission }>>
{
    const a = await adminWorld(slug, profile)
    if (!a.ok) return a
    const current = await loadOne(a.comp.id, id)
    if (!current) return fail('Mission not found.')
    const next: MissionInput = {
        pathway: current.pathway, week: current.week, day: current.day, title: current.title, story: current.story, kind: current.kind,
        config: current.config, answerKey: current.answerKey, xp: current.xp, tokens: current.tokens, bucket: current.bucket,
        reviewMode: current.reviewMode, rubricKey: current.rubricKey, estMinutes: current.estMinutes, badge: current.badge, isActive: current.isActive,
        ...patch,
    }
    if (current.attempts > 0)
    {
        if (next.kind !== current.kind || next.pathway !== current.pathway)
            return fail('Students have already tried this mission, so its kind and pathway can’t change. Switch it off and create a new one.')
    }
    // Switching off never needs the content checks (old missions stay switch-off-able).
    const onlyDeactivate = Object.keys(patch).length === 1 && patch.isActive === false
    if (!onlyDeactivate)
    {
        const bad = checkMission(next, { weeks: a.comp.weeks, rubrics: await rubricKeys() })
        if (bad) return fail(bad)
    }
    if (next.isActive !== false)
    {
        const taken = await slotTaken(a.comp.id, next, id)
        if (taken) return fail(`Week ${next.week} day ${next.day} already has “${taken}”. Switch it off first.`)
    }
    const db = createServiceClient()
    const row = onlyDeactivate ? { is_active: false } : { ...toRow(a.comp.id, next), is_active: next.isActive !== false }
    const { error } = await db.from('competition_missions').update(row).eq('id', id).eq('competition_id', a.comp.id)
    if (error) return fail('Could not save the mission.')
    const keyErr = onlyDeactivate ? null : await saveKey(id, next)
    invalidateWorldCache()
    if (keyErr) return fail(keyErr)
    return { ok: true, mission: (await loadOne(a.comp.id, id))! }
}

/**
 * Copy one mission, or a whole pathway-week, to another week (and/or
 * pathway). Copies are created switched OFF so the lead can edit them
 * before students see them; answer keys are copied too.
 */
export async function duplicateMissions(slug: string, profile: User, input: { missionId?: string; pathway?: Pathway; fromWeek?: number; toWeek: number; toPathway?: Pathway; toDay?: number }): Promise<Result<{ created: AdminMission[] }>>
{
    const a = await adminWorld(slug, profile)
    if (!a.ok) return a
    if (!isInt(input.toWeek, 1, a.comp.weeks)) return fail(`Week must be 1–${a.comp.weeks}.`)
    const db = createServiceClient()
    let q = db.from('competition_missions').select(COLUMNS).eq('competition_id', a.comp.id).eq('verification', 'activity')
    if (input.missionId) q = q.eq('id', input.missionId)
    else if (input.pathway && input.fromWeek) q = q.eq('pathway', input.pathway).eq('week', input.fromWeek).eq('is_active', true)
    else return fail('Choose a mission, or a pathway and week to copy.')
    const { data } = await q.order('day')
    const rows = (data ?? []) as MissionDbRow[]
    if (rows.length === 0) return fail('Nothing to copy.')
    const { data: keys } = await db.from('competition_mission_keys').select('mission_id, answer_key').in('mission_id', rows.map((r) => r.id))
    const keyMap = new Map(((keys ?? []) as { mission_id: string; answer_key: Record<string, unknown> }[]).map((k) => [k.mission_id, k.answer_key]))

    const created: AdminMission[] = []
    for (const r of rows)
    {
        const src = toAdmin(r, keyMap.get(r.id) ?? null, 0)
        const pathway = input.toPathway ?? src.pathway
        const day = input.missionId && input.toDay ? input.toDay : src.day
        if (!isInt(day, 1, 7)) return fail('Day must be 1–7.')
        // A copied finale/boss keeps the schedule rules valid: weekly boss ⇄ stage finale swap rubric.
        let rubricKey = src.rubricKey
        if (src.kind === 'boss') rubricKey = isFinaleWeek(input.toWeek) ? FINALE_RUBRIC : rubricKey === FINALE_RUBRIC ? 'boss' : rubricKey
        const m: MissionInput = {
            pathway, week: input.toWeek, day, title: src.title, story: src.story, kind: src.kind, config: src.config, answerKey: src.answerKey,
            xp: src.xp, tokens: src.tokens, bucket: src.bucket, reviewMode: src.reviewMode, rubricKey, estMinutes: src.estMinutes,
            badge: src.badge ? { key: `${src.badge.key}-w${input.toWeek}`.slice(0, 60), label: src.badge.label } : null,
        }
        const key = await freeKey(a.comp.id, baseKey(m))
        const { data: ins, error } = await db.from('competition_missions')
            .insert({ ...toRow(a.comp.id, m), key, is_active: false, max_attempts: MAX_ATTEMPTS }).select('id').single()
        if (error || !ins) { invalidateWorldCache(); return fail(`Could not copy “${src.title}”.`) }
        await saveKey(ins.id, m)
        created.push((await loadOne(a.comp.id, ins.id))!)
    }
    invalidateWorldCache()
    return { ok: true, created }
}

/**
 * Bulk import a whole week (same shape as SeedMission). Every mission is
 * checked first; nothing is written if any check fails. For each pathway in
 * the file the week must have exactly 7 missions, one per day. Missions
 * whose key already exists are updated; existing active missions in the
 * same slots are switched off when `replace` is true.
 */
export async function importWeek(slug: string, profile: User, input: { missions: MissionInput[]; replace?: boolean; activate?: boolean }): Promise<Result<{ inserted: number; updated: number; switchedOff: number }>>
{
    const a = await adminWorld(slug, profile)
    if (!a.ok) return a
    const list = input.missions
    if (!Array.isArray(list) || list.length === 0) return fail('Paste a list of missions.')
    if (list.length > 28) return fail('Import one week at a time (up to 14 missions: 7 per pathway).')
    const rubrics = await rubricKeys()
    for (const [i, m] of list.entries())
    {
        const bad = checkMission(m, { weeks: a.comp.weeks, rubrics })
        if (bad) return fail(`Mission ${i + 1}${m?.title ? ` (“${m.title}”)` : ''}: ${bad}`)
    }
    const weeks = new Set(list.map((m) => m.week))
    if (weeks.size !== 1) return fail('All missions in one import must be for the same week.')
    const week = list[0].week
    const keys = list.map((m) => m.key).filter(Boolean)
    if (new Set(keys).size !== keys.length) return fail('Two missions in the file share the same key.')
    const activate = input.activate !== false
    if (activate)
    {
        for (const p of new Set(list.map((m) => m.pathway)))
        {
            const check = checkWeek(p, week, list.map((m) => ({ ...m, rubricKey: m.rubricKey ?? null, isActive: true })))
            if (!check.ready) return fail(`${p === 'career' ? 'Career' : 'Enterprise'} week ${week}: ${check.problems.join(' ')}`)
        }
    }

    const db = createServiceClient()
    const { data: existing } = await db.from('competition_missions').select('id, key, pathway, day, is_active').eq('competition_id', a.comp.id).eq('verification', 'activity').eq('week', week)
    const ex = (existing ?? []) as { id: string; key: string; pathway: Pathway; day: number; is_active: boolean }[]
    const byKey = new Map(ex.map((r) => [r.key, r]))
    const importedKeys = new Set(keys)
    const blocking = activate ? ex.filter((r) => r.is_active && !importedKeys.has(r.key) && list.some((m) => m.pathway === r.pathway && m.day === r.day)) : []
    if (blocking.length && !input.replace)
        return fail(`Week ${week} already has ${blocking.length} active mission(s) on those days. Tick “Replace existing” to switch them off.`)

    let switchedOff = 0
    if (blocking.length)
    {
        const { error } = await db.from('competition_missions').update({ is_active: false }).in('id', blocking.map((r) => r.id))
        if (error) return fail('Could not switch off the existing missions.')
        switchedOff = blocking.length
    }
    let inserted = 0, updated = 0
    for (const m of list)
    {
        const found = m.key ? byKey.get(m.key) : undefined
        let id: string
        if (found)
        {
            const { error } = await db.from('competition_missions').update({ ...toRow(a.comp.id, m), is_active: activate }).eq('id', found.id)
            if (error) { invalidateWorldCache(); return fail(`Could not update “${m.title}”. ${inserted + updated} saved before this.`) }
            id = found.id; updated++
        } else
        {
            const key = m.key ?? await freeKey(a.comp.id, baseKey(m))
            const { data, error } = await db.from('competition_missions')
                .insert({ ...toRow(a.comp.id, m), key, is_active: activate, max_attempts: MAX_ATTEMPTS }).select('id').single()
            if (error || !data) { invalidateWorldCache(); return fail(error?.code === '23505' ? `The key “${key}” is used by another week.` : `Could not save “${m.title}”. ${inserted + updated} saved before this.`) }
            id = data.id; inserted++
        }
        await saveKey(id, m)
    }
    invalidateWorldCache()
    return { ok: true, inserted, updated, switchedOff }
}

// ─── Rubrics ─────────────────────────────────────────────────────────────────

export async function listRubrics(slug: string, profile: User): Promise<Result<{ rubrics: (RubricView & { missions: number })[] }>>
{
    const a = await adminWorld(slug, profile)
    if (!a.ok) return a
    const db = createServiceClient()
    const [{ data, error }, { data: used }] = await Promise.all([
        db.from('competition_rubrics').select('key, title, criteria, pass_mark').order('key'),
        db.from('competition_missions').select('rubric_key').eq('competition_id', a.comp.id).not('rubric_key', 'is', null).limit(5000),
    ])
    if (error) return fail('Could not load rubrics.')
    const uses: Record<string, number> = {}
    for (const r of (used ?? []) as { rubric_key: string }[]) uses[r.rubric_key] = (uses[r.rubric_key] ?? 0) + 1
    return {
        ok: true,
        rubrics: ((data ?? []) as { key: string; title: string; criteria: RubricView['criteria']; pass_mark: number }[])
            .map((r) => ({ key: r.key, title: r.title, criteria: r.criteria, passMark: r.pass_mark, missions: uses[r.key] ?? 0 })),
    }
}

/** Create or update a rubric (by key). Criterion weights must add up to 100. */
export async function saveRubric(slug: string, profile: User, input: RubricView): Promise<Result<{ rubric: RubricView }>>
{
    const a = await adminWorld(slug, profile)
    if (!a.ok) return a
    if (!input || typeof input !== 'object') return fail('Send a rubric.')
    if (!/^[a-z0-9_-]{2,40}$/.test(input.key ?? '')) return fail('The key uses 2–40 lowercase letters, numbers, - or _.')
    if (!isStr(input.title, 120)) return fail('Add a title.')
    if (!isInt(input.passMark, 0, 100)) return fail('Pass mark must be 0–100.')
    const criteria = Array.isArray(input.criteria) ? input.criteria : []
    if (criteria.length === 0 || criteria.length > 12) return fail('Add 1–12 criteria.')
    const bad = labelled(criteria, 'criterion'); if (bad) return fail(bad)
    if (criteria.some((c) => !isInt(c.weight, 1, 100))) return fail('Each weight must be a whole number from 1 to 100.')
    const total = criteria.reduce((s, c) => s + c.weight, 0)
    if (total !== 100) return fail(`Weights must add up to 100 (now ${total}).`)
    const clean = criteria.map((c) => ({ id: c.id, label: c.label.trim(), weight: c.weight, ...(c.description?.trim() ? { description: c.description.trim().slice(0, 500) } : {}) }))
    const { error } = await createServiceClient().from('competition_rubrics')
        .upsert({ key: input.key, title: input.title.trim(), criteria: clean, pass_mark: input.passMark })
    if (error) return fail('Could not save the rubric.')
    invalidateWorldCache()
    return { ok: true, rubric: { key: input.key, title: input.title.trim(), criteria: clean, passMark: input.passMark } }
}
