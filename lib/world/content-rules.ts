import { isFormKind } from './grading'
import {
    STAGE_WEEKS,
    type FieldDef, type FieldType, type FormConfig, type MissionConfig, type MissionKind, type Pathway, type QuizConfig,
    type ReviewMode, type ScenarioConfig, type ScoreBucket, type SortConfig,
} from './types'

/*
 * Content rules for the admin mission editor — pure and client-safe, so the
 * editor checks a mission as it is typed and the server (admin-content.ts)
 * runs the very same checks before saving.
 *
 *  - graded quizzes, sorts and scenarios need an answer key
 *  - day 7 is the Sunday boss (kind 'boss', judged by humans); the day-7
 *    boss of weeks 4, 8, 12 and 16 is the stage finale (rubric 'showcase')
 *  - a week is ready when each pathway has 7 active missions, one per day
 */

export const MISSION_KINDS: MissionKind[] = ['quiz', 'sort', 'scenario', 'board', 'canvas', 'evidence', 'video', 'reflection', 'team', 'live_event', 'boss']
export const SCORE_BUCKETS: ScoreBucket[] = ['evidence', 'quality', 'reflection', 'teamwork', 'showcase']
export const REVIEW_MODES: ReviewMode[] = ['auto', 'ai', 'human']
export const PATHWAYS: Pathway[] = ['career', 'enterprise']
const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'number', 'select', 'checkbox', 'file', 'link', 'video']
/** Rubric the stage finale (last Sunday of a stage) must use. */
export const FINALE_RUBRIC = 'showcase'

export const isFinaleWeek = (week: number) => week % STAGE_WEEKS === 0

// ─── Shapes ──────────────────────────────────────────────────────────────────

/** A mission as the editor sees it (includes the answer key — admins only). */
export interface AdminMission
{
    id: string
    key: string
    pathway: Pathway
    stage: number
    week: number
    day: number
    title: string
    story: string | null
    kind: MissionKind
    config: MissionConfig
    answerKey: Record<string, unknown> | null
    xp: number
    tokens: number
    bucket: ScoreBucket
    reviewMode: ReviewMode
    rubricKey: string | null
    estMinutes: number
    maxAttempts: number
    badge: { key: string; label: string } | null
    isActive: boolean
    /** Attempts by students (missions with attempts can only be switched off). */
    attempts: number
}

/** What the editor / API sends to create or update a mission (same shape as SeedMission; key optional). */
export interface MissionInput
{
    key?: string
    pathway: Pathway
    week: number
    day: number
    title: string
    story?: string | null
    kind: MissionKind
    config: MissionConfig
    answerKey?: Record<string, unknown> | null
    xp: number
    tokens: number
    bucket: ScoreBucket
    reviewMode: ReviewMode
    rubricKey?: string | null
    estMinutes: number
    badge?: { key: string; label: string } | null
    isActive?: boolean
}

export interface WeekCheck
{
    pathway: Pathway
    week: number
    /** Active missions per day (index 0 = Monday). */
    days: number[]
    problems: string[]
    ready: boolean
}

// ─── Validation ──────────────────────────────────────────────────────────────

export const isStr = (v: unknown, max = 5000): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max
export const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
const ID = /^[A-Za-z0-9_-]{1,40}$/

function uniqueIds(list: { id: string }[], what: string): string | null
{
    const seen = new Set<string>()
    for (const x of list)
    {
        if (!x || typeof x.id !== 'string' || !ID.test(x.id)) return `Each ${what} needs a short id (letters, numbers, - or _).`
        if (seen.has(x.id)) return `Two ${what}s share the id “${x.id}”.`
        seen.add(x.id)
    }
    return null
}

export function labelled(list: { id: string; label: string }[], what: string): string | null
{
    return uniqueIds(list, what) ?? (list.some((x) => !isStr(x.label, 500)) ? `Every ${what} needs a label.` : null)
}

function checkQuiz(c: QuizConfig, key: Record<string, unknown> | null): string | null
{
    if (typeof c.graded !== 'boolean') return 'Say whether the quiz is graded.'
    if (!Array.isArray(c.questions) || c.questions.length === 0) return 'Add at least one question.'
    if (c.questions.length > 50) return 'A quiz can have at most 50 questions.'
    const bad = uniqueIds(c.questions, 'question'); if (bad) return bad
    for (const [i, q] of c.questions.entries())
    {
        if (!isStr(q.prompt, 1000)) return `Question ${i + 1} needs a prompt.`
        if (!Array.isArray(q.options) || q.options.length < 2) return `Question ${i + 1} needs at least two options.`
        const o = labelled(q.options, 'option'); if (o) return `Question ${i + 1}: ${o}`
    }
    if (!c.graded) return null
    const correct = (key?.correct ?? null) as Record<string, string | string[]> | null
    if (!correct || typeof correct !== 'object') return 'A graded quiz needs an answer key: mark the right option for every question.'
    for (const [i, q] of c.questions.entries())
    {
        const want = [correct[q.id] ?? []].flat()
        if (want.length === 0) return `Mark the right answer for question ${i + 1}.`
        if (!q.multi && want.length > 1) return `Question ${i + 1} allows one answer; mark only one, or allow several answers.`
        if (want.some((w) => !q.options.some((o) => o.id === w))) return `Question ${i + 1}’s answer isn’t one of its options.`
    }
    return null
}

function checkSort(c: SortConfig, key: Record<string, unknown> | null): string | null
{
    if (!isStr(c.prompt, 1000)) return 'Add the sort instructions.'
    if (!Array.isArray(c.items) || c.items.length < 2) return 'Add at least two items to sort.'
    if (!Array.isArray(c.bins) || c.bins.length < 2) return 'Add at least two groups.'
    const bad = labelled(c.items, 'item') ?? labelled(c.bins, 'group'); if (bad) return bad
    const correct = (key?.correct ?? null) as Record<string, string> | null
    if (!correct || typeof correct !== 'object') return 'A sort game needs an answer key: choose the right group for every item.'
    for (const item of c.items)
    {
        if (!c.bins.some((b) => b.id === correct[item.id])) return `Choose the right group for “${item.label}”.`
    }
    return null
}

function checkScenario(c: ScenarioConfig, key: Record<string, unknown> | null): string | null
{
    if (!isStr(c.intro, 2000)) return 'Add the scenario introduction.'
    if (!Array.isArray(c.nodes) || c.nodes.length === 0) return 'Add at least one step.'
    if (c.nodes.length > 40) return 'A scenario can have at most 40 steps.'
    const bad = uniqueIds(c.nodes, 'step'); if (bad) return bad
    const ids = new Set(c.nodes.map((n) => n.id))
    if (!ids.has(c.start)) return 'Choose which step the scenario starts on.'
    const choiceIds = new Set<string>()
    for (const n of c.nodes)
    {
        if (!isStr(n.text, 2000)) return `Step “${n.id}” needs text.`
        if (!Array.isArray(n.choices) || n.choices.length === 0) return `Step “${n.id}” needs at least one choice.`
        const cb = labelled(n.choices, 'choice'); if (cb) return `Step “${n.id}”: ${cb}`
        for (const ch of n.choices)
        {
            if (choiceIds.has(ch.id)) return `Two choices share the id “${ch.id}” — choice ids must be unique across the scenario.`
            choiceIds.add(ch.id)
            if (ch.next && !ids.has(ch.next)) return `Choice “${ch.label}” leads to a step that doesn’t exist.`
        }
    }
    // Every path must end: no loops back to an earlier step.
    const visiting = new Set<string>(), done = new Set<string>()
    const loops = (id: string): boolean =>
    {
        if (done.has(id)) return false
        if (visiting.has(id)) return true
        visiting.add(id)
        const n = c.nodes.find((x) => x.id === id)!
        for (const ch of n.choices) if (ch.next && loops(ch.next)) return true
        visiting.delete(id); done.add(id)
        return false
    }
    if (loops(c.start)) return 'The scenario loops back on itself. Every path must reach an ending (a choice with no next step).'
    const scores = (key?.scores ?? null) as Record<string, number> | null
    if (!scores || typeof scores !== 'object') return 'A scenario needs an answer key: score every choice from 0 to 100.'
    for (const id of choiceIds)
        if (!isInt(scores[id], 0, 100)) return `Score choice “${id}” from 0 to 100.`
    return null
}

function checkForm(c: FormConfig): string | null
{
    if (!Array.isArray(c.fields) || c.fields.length === 0) return 'Add at least one field.'
    if (c.fields.length > 40) return 'A mission can have at most 40 fields.'
    const bad = uniqueIds(c.fields, 'field'); if (bad) return bad
    for (const f of c.fields as FieldDef[])
    {
        if (!isStr(f.label, 500)) return `Field “${f.id}” needs a label.`
        if (!FIELD_TYPES.includes(f.type)) return `Field “${f.label}” has an unknown type.`
        if (f.type === 'select')
        {
            if (!Array.isArray(f.options) || f.options.length < 2) return `“${f.label}” needs at least two options.`
            const o = labelled(f.options, 'option'); if (o) return `“${f.label}”: ${o}`
        }
        if (f.repeat !== undefined && !isInt(f.repeat, 1, 10)) return `“${f.label}” can repeat 1–10 times.`
        if (f.minWords !== undefined && f.maxWords !== undefined && f.minWords > f.maxWords) return `“${f.label}”: minimum words is above the maximum.`
        if (f.type === 'video' && f.maxSeconds !== undefined && !isInt(f.maxSeconds, 5, 600)) return `“${f.label}”: video length must be 5–600 seconds.`
    }
    if (c.checklist !== undefined)
    {
        if (!Array.isArray(c.checklist)) return 'The checklist must be a list.'
        const cl = labelled(c.checklist, 'checklist item'); if (cl) return cl
    }
    return null
}

/** Shape + content rules for one mission (independent of other missions). */
export function checkMission(m: MissionInput, opts: { weeks: number; rubrics: Set<string> }): string | null
{
    if (!m || typeof m !== 'object') return 'Send a mission.'
    if (!PATHWAYS.includes(m.pathway)) return 'Choose the Career or Enterprise pathway.'
    if (!isInt(m.week, 1, opts.weeks)) return `Week must be 1–${opts.weeks}.`
    if (!isInt(m.day, 1, 7)) return 'Day must be 1–7 (7 = Sunday boss).'
    if (!isStr(m.title, 140)) return 'Add a title (up to 140 characters).'
    if (m.story != null && (typeof m.story !== 'string' || m.story.length > 4000)) return 'The story is too long (4,000 characters max).'
    if (!MISSION_KINDS.includes(m.kind)) return 'Choose a mission kind.'
    if (!SCORE_BUCKETS.includes(m.bucket)) return 'Choose a score bucket.'
    if (!REVIEW_MODES.includes(m.reviewMode)) return 'Choose how it is reviewed (auto, AI or human).'
    if (!isInt(m.xp, 1, 10000)) return 'XP must be 1–10,000.'
    if (!isInt(m.tokens, 0, 1000)) return 'HubTokens must be 0–1,000.'
    if (!isInt(m.estMinutes, 1, 480)) return 'Estimated minutes must be 1–480.'
    if (m.key !== undefined && !/^[a-z0-9-]{2,60}$/.test(m.key)) return 'Keys use lowercase letters, numbers and dashes.'
    if (m.badge && (!/^[a-z0-9-]{2,60}$/.test(m.badge.key ?? '') || !isStr(m.badge.label, 80))) return 'A badge needs a key (lowercase, dashes) and a label.'
    if (m.rubricKey && !opts.rubrics.has(m.rubricKey)) return `There is no rubric “${m.rubricKey}”.`
    if (m.reviewMode !== 'auto' && !m.rubricKey) return 'AI- and human-reviewed missions need a rubric.'
    if (!m.config || typeof m.config !== 'object') return 'The mission has no activity set up.'

    // Schedule rules.
    if (m.day === 7 && m.kind !== 'boss') return 'Day 7 (Sunday) must be a boss mission.'
    if (m.kind === 'boss' && m.day !== 7) return 'Boss missions go on day 7 (Sunday).'
    if (m.kind === 'boss' && m.reviewMode !== 'human') return 'Boss missions are scored by judges: set review to “human”.'
    if (m.kind === 'boss' && isFinaleWeek(m.week))
    {
        if (m.rubricKey !== FINALE_RUBRIC) return `Week ${m.week} ends the stage: its boss is the stage finale and must use the “${FINALE_RUBRIC}” rubric.`
        if (!m.badge) return `Week ${m.week}’s finale should award a stage badge.`
    } else if (m.kind === 'boss' && m.rubricKey === FINALE_RUBRIC) return `The “${FINALE_RUBRIC}” rubric is only for stage finales (weeks ${[1, 2, 3, 4].map((s) => s * STAGE_WEEKS).join(', ')}).`

    const key = m.answerKey && typeof m.answerKey === 'object' ? m.answerKey : null
    if (m.kind === 'quiz') return checkQuiz(m.config as QuizConfig, key)
    if (m.kind === 'sort') return checkSort(m.config as SortConfig, key)
    if (m.kind === 'scenario') return checkScenario(m.config as ScenarioConfig, key)
    if (isFormKind(m.kind)) return checkForm(m.config as FormConfig)
    return null
}

/** Week-level rules for one pathway: 7 active missions, Sunday boss, finale on stage weeks. */
export function checkWeek(pathway: Pathway, week: number, missions: { pathway: Pathway; week: number; day: number; kind: MissionKind; rubricKey: string | null; isActive: boolean }[]): WeekCheck
{
    const list = missions.filter((m) => m.isActive && m.pathway === pathway && m.week === week)
    const days = [1, 2, 3, 4, 5, 6, 7].map((d) => list.filter((m) => m.day === d).length)
    const problems: string[] = []
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const missing = days.flatMap((n, i) => (n === 0 ? [names[i]] : []))
    const doubled = days.flatMap((n, i) => (n > 1 ? [names[i]] : []))
    if (missing.length) problems.push(`Missing ${missing.join(', ')} (${list.length}/7 missions).`)
    if (doubled.length) problems.push(`More than one mission on ${doubled.join(', ')}.`)
    const sunday = list.find((m) => m.day === 7)
    if (sunday && sunday.kind !== 'boss') problems.push('Sunday must be a boss mission.')
    if (sunday && isFinaleWeek(week) && sunday.rubricKey !== FINALE_RUBRIC) problems.push(`Sunday must be the stage finale (rubric “${FINALE_RUBRIC}”).`)
    return { pathway, week, days, problems, ready: problems.length === 0 }
}

