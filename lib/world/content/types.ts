import type { FieldDef, FormConfig, MissionKind, Pathway, QuizConfig, ReviewMode, ScenarioConfig, ScoreBucket, SortConfig } from '../types'

/** One mission as authored. `answerKey` is stored server-only (competition_mission_keys). */
export interface SeedMission
{
    key: string
    pathway: Pathway
    week: number
    day: number
    title: string
    story: string
    kind: MissionKind
    config: QuizConfig | SortConfig | ScenarioConfig | FormConfig
    answerKey?: Record<string, unknown>
    xp: number
    tokens: number
    bucket: ScoreBucket
    reviewMode: ReviewMode
    rubricKey?: 'practice' | 'evidence' | 'boss' | 'showcase'
    estMinutes: number
    /** Awarded when this mission passes (weekly boss / stage showcase). */
    badge?: { key: string; label: string }
}

// ─── Small authoring helpers ─────────────────────────────────────────────────

export const text = (id: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ id, label, type: 'text', required: true, ...o })
export const area = (id: string, label: string, minWords = 20, o: Partial<FieldDef> = {}): FieldDef => ({ id, label, type: 'textarea', required: true, minWords, maxWords: 600, ...o })
export const num = (id: string, label: string, min = 0, max = 100000000, o: Partial<FieldDef> = {}): FieldDef => ({ id, label, type: 'number', required: true, min, max, ...o })
export const pick = (id: string, label: string, options: string[], o: Partial<FieldDef> = {}): FieldDef =>
    ({ id, label, type: 'select', required: true, options: options.map((l, i) => ({ id: `o${i + 1}`, label: l })), ...o })
export const file = (id: string, label: string, accept: FieldDef['accept'] = ['image', 'pdf'], o: Partial<FieldDef> = {}): FieldDef => ({ id, label, type: 'file', accept, ...o })
export const link = (id: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ id, label, type: 'link', ...o })
export const video = (id: string, label: string, maxSeconds: number, o: Partial<FieldDef> = {}): FieldDef => ({ id, label, type: 'video', accept: ['video'], maxSeconds, required: true, ...o })

export const CONSENT = { id: 'consent', label: 'Everyone I spoke to agreed to take part, and I asked their permission first.' }
export const NO_PII = { id: 'no_pii', label: 'I removed names, phone numbers, addresses and anything that identifies a real person.' }
export const HONEST = { id: 'honest', label: 'This is my own work and it is truthful — no made-up results or inflated claims.' }

export const form = (fields: FieldDef[], o: Omit<FormConfig, 'fields'> = {}): FormConfig => ({ fields, ...o })
