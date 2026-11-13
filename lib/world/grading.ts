import type { AttemptPayload, FieldDef, FieldValue, FormConfig, MissionConfig, MissionKind, QuizConfig, QuizInsights, ScenarioConfig, SortConfig } from './types'

/*
 * Validation + automatic grading. Server-only (answer keys come from
 * competition_mission_keys, which clients can't read).
 *
 * Answer key shapes:
 *   quiz:     { correct: { [questionId]: optionId | optionId[] } }   (omit for self-assessments)
 *   sort:     { correct: { [itemId]: binId } }                       (omit for opinion sorts)
 *   scenario: { scores: { [choiceId]: 0–100 } }
 */

export type GradeResult = { ok: true; score: number } | { ok: false; error: string }

const FORM_KINDS: MissionKind[] = ['board', 'canvas', 'evidence', 'video', 'reflection', 'team', 'live_event', 'boss']
export const isFormKind = (k: MissionKind) => FORM_KINDS.includes(k)

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

function gradeQuiz(config: QuizConfig, key: { correct?: Record<string, string | string[]> } | null, answers: Record<string, string | string[]>): GradeResult
{
    for (const q of config.questions)
    {
        const a = answers[q.id]
        const picked = Array.isArray(a) ? a : a ? [a] : []
        if (picked.length === 0) return { ok: false, error: 'Answer every question.' }
        if (!q.multi && picked.length > 1) return { ok: false, error: 'Pick one answer per question.' }
        if (picked.some((p) => !q.options.some((o) => o.id === p))) return { ok: false, error: 'That answer isn’t one of the options.' }
    }
    if (!config.graded || !key?.correct) return { ok: true, score: 100 }
    let right = 0
    for (const q of config.questions)
    {
        const want = [key.correct[q.id] ?? []].flat().sort().join('|')
        const got = [answers[q.id] ?? []].flat().sort().join('|')
        if (want && want === got) right++
    }
    return { ok: true, score: Math.round((right / config.questions.length) * 100) }
}

function gradeSort(config: SortConfig, key: { correct?: Record<string, string> } | null, placement: Record<string, string>): GradeResult
{
    for (const item of config.items)
    {
        const bin = placement[item.id]
        if (!bin) return { ok: false, error: 'Place every item.' }
        if (!config.bins.some((b) => b.id === bin)) return { ok: false, error: 'Unknown group.' }
    }
    if (!key?.correct) return { ok: true, score: 100 }
    const right = config.items.filter((i) => key.correct![i.id] === placement[i.id]).length
    return { ok: true, score: Math.round((right / config.items.length) * 100) }
}

function gradeScenario(config: ScenarioConfig, key: { scores?: Record<string, number> } | null, path: { node: string; choice: string }[]): GradeResult
{
    if (path.length === 0 || path.length > 50) return { ok: false, error: 'Play the scenario to the end.' }
    let expected: string | undefined = config.start
    const picked: string[] = []
    for (const step of path)
    {
        if (step.node !== expected) return { ok: false, error: 'That path isn’t possible in this scenario.' }
        const node = config.nodes.find((n) => n.id === step.node)
        const choice = node?.choices.find((c) => c.id === step.choice)
        if (!choice) return { ok: false, error: 'That path isn’t possible in this scenario.' }
        picked.push(choice.id)
        expected = choice.next
    }
    if (expected) return { ok: false, error: 'Play the scenario to the end.' }
    const scores = key?.scores ?? {}
    const avg = picked.reduce((s, c) => s + (scores[c] ?? 50), 0) / picked.length
    return { ok: true, score: Math.round(avg) }
}

/** Checks required fields, word counts, numbers, checklist and upload keys. */
export function validateForm(config: FormConfig, fields: Record<string, FieldValue | FieldValue[]>, checklist: string[] | undefined, uploadPrefix: string): { ok: true; fileKeys: string[] } | { ok: false; error: string }
{
    const fileKeys: string[] = []
    const one = (f: FieldDef, v: FieldValue): string | null =>
    {
        if (v === null || v === undefined || v === '') return f.required ? `“${f.label}” is required.` : null
        switch (f.type)
        {
            case 'text':
            case 'textarea':
            {
                if (typeof v !== 'string') return `“${f.label}” must be text.`
                if (v.length > 8000) return `“${f.label}” is too long.`
                const n = words(v)
                if (f.minWords && n < f.minWords) return `“${f.label}” needs at least ${f.minWords} words.`
                if (f.maxWords && n > f.maxWords) return `“${f.label}” must be ${f.maxWords} words or fewer.`
                return null
            }
            case 'number':
                if (typeof v !== 'number' || !Number.isFinite(v)) return `“${f.label}” must be a number.`
                if (f.min !== undefined && v < f.min) return `“${f.label}” must be at least ${f.min}.`
                if (f.max !== undefined && v > f.max) return `“${f.label}” must be at most ${f.max}.`
                return null
            case 'select':
                return typeof v === 'string' && f.options?.some((o) => o.id === v) ? null : `Choose an option for “${f.label}”.`
            case 'checkbox':
                return typeof v === 'boolean' ? null : `“${f.label}” must be yes or no.`
            case 'link':
            {
                const url = typeof v === 'object' && v && 'url' in v ? v.url : typeof v === 'string' ? v : ''
                try { const u = new URL(url); return u.protocol === 'https:' || u.protocol === 'http:' ? null : 'Links must start with http(s)://' }
                catch { return `“${f.label}” isn’t a valid link.` }
            }
            case 'file':
            case 'video':
            {
                const key = typeof v === 'object' && v && 'key' in v ? v.key : null
                if (!key || !key.startsWith(uploadPrefix) || key.includes('..')) return `Upload “${f.label}” again.`
                fileKeys.push(key)
                return null
            }
        }
    }

    for (const f of config.fields)
    {
        const raw = fields[f.id]
        const values = f.repeat ? (Array.isArray(raw) ? raw : []) : [raw as FieldValue]
        if (f.repeat)
        {
            if (values.length > f.repeat) return { ok: false, error: `“${f.label}” has too many entries.` }
            if (f.required && values.filter((v) => v !== null && v !== '').length < f.repeat)
                return { ok: false, error: `Fill in all ${f.repeat} “${f.label}” entries.` }
        }
        for (const v of values)
        {
            const err = one(f, (v ?? null) as FieldValue)
            if (err) return { ok: false, error: err }
        }
    }
    const unknown = Object.keys(fields).filter((k) => !config.fields.some((f) => f.id === k))
    if (unknown.length) return { ok: false, error: 'Unexpected fields in the submission.' }
    for (const c of config.checklist ?? [])
        if (!checklist?.includes(c.id)) return { ok: false, error: `Please confirm: “${c.label}”.` }
    return { ok: true, fileKeys }
}

/** Auto-grade quiz / sort / scenario. Form kinds are scored by review. */
export function autoGrade(kind: MissionKind, config: MissionConfig, answerKey: unknown, payload: AttemptPayload): GradeResult
{
    const key = (answerKey ?? null) as Record<string, never> | null
    if (kind === 'quiz' && payload.kind === 'quiz') return gradeQuiz(config as QuizConfig, key, payload.answers ?? {})
    if (kind === 'sort' && payload.kind === 'sort') return gradeSort(config as SortConfig, key, payload.placement ?? {})
    if (kind === 'scenario' && payload.kind === 'scenario') return gradeScenario(config as ScenarioConfig, key, payload.path ?? [])
    return { ok: false, error: 'This submission doesn’t match the mission type.' }
}

/** Text the AI reviewer sees (form fields only; files are listed, not read). */
export function formToText(config: FormConfig, fields: Record<string, FieldValue | FieldValue[]>): string
{
    return config.fields.map((f) =>
    {
        const raw = fields[f.id]
        const vals = (Array.isArray(raw) ? raw : [raw]).filter((v) => v !== null && v !== undefined && v !== '')
        const shown = vals.map((v) => typeof v === 'object' && v ? ('key' in v ? `[uploaded ${f.type}]` : 'url' in v ? v.url : '') : String(v))
        return `## ${f.label}\n${shown.length ? shown.join('\n') : '(empty)'}`
    }).join('\n\n')
}

/** Tallies a self-assessment quiz into a ranked profile (e.g. the Skill Compass). */
export function quizInsights(config: MissionConfig, payload: unknown): QuizInsights | null
{
    const quiz = config as QuizConfig
    const p = payload as { kind?: string; answers?: Record<string, string | string[]> } | null
    if (!quiz?.profile || quiz.graded || p?.kind !== 'quiz' || !p.answers) return null
    const counts: Record<string, number> = {}
    let total = 0
    for (const v of Object.values(p.answers)) for (const id of [v].flat()) if (quiz.profile.outcomes[id]) { counts[id] = (counts[id] ?? 0) + 1; total++ }
    if (total === 0) return null
    const ranking = Object.entries(quiz.profile.outcomes)
        .map(([id, o]) => ({ id, ...o, share: Math.round(((counts[id] ?? 0) / total) * 100) }))
        .sort((a, b) => b.share - a.share)
    return { title: quiz.profile.title, intro: quiz.profile.intro, ranking }
}
