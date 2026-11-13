'use client'

import { useMemo, useState, useTransition } from 'react'
import { AlertTriangle, Braces, Eye, Loader2, Save } from 'lucide-react'
import { toast } from '@/components/toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { saveMissionAction } from '@/lib/actions/world'
import { FINALE_RUBRIC, MISSION_KINDS, REVIEW_MODES, SCORE_BUCKETS, checkMission, isFinaleWeek, type AdminMission, type MissionInput } from '@/lib/world/content-rules'
import { isFormKind } from '@/lib/world/grading'
import { stageOfWeek } from '@/lib/world/schedule'
import { MAX_ATTEMPTS, type FormConfig, type MissionKind, type MissionView, type PathwayView, type QuizConfig, type RubricView, type ScenarioConfig, type SortConfig } from '@/lib/world/types'
import { DAY_LONG, KIND_META, REVIEW_META } from '@/lib/world/ui'
import MissionPlayer from '../mission/MissionPlayer'
import { FormEditor, QuizEditor, ScenarioEditor, SortEditor, defaultConfig, inputCls, labelCls, type AnswerKey } from './ConfigEditors'

/** Editor draft: MissionInput plus the editor-only "save as" state. */
export type Draft = MissionInput & { key?: string }

const BUCKET_LABEL: Record<string, string> = { evidence: 'Evidence (40%)', quality: 'Quality (25%)', reflection: 'Reflection (15%)', teamwork: 'Teamwork (10%)', showcase: 'Showcase (10%)' }

export function draftFrom(m: AdminMission): Draft
{
    return {
        key: m.key, pathway: m.pathway, week: m.week, day: m.day, title: m.title, story: m.story, kind: m.kind, config: m.config,
        answerKey: m.answerKey, xp: m.xp, tokens: m.tokens, bucket: m.bucket, reviewMode: m.reviewMode, rubricKey: m.rubricKey,
        estMinutes: m.estMinutes, badge: m.badge, isActive: m.isActive,
    }
}

/** Sensible defaults for a new mission in a slot (Sunday → boss / finale). */
export function newDraft(pathway: MissionInput['pathway'], week: number, day: number): Draft
{
    const boss = day === 7
    const kind: MissionKind = boss ? 'boss' : 'reflection'
    const { config, answerKey } = defaultConfig(kind)
    const finale = boss && isFinaleWeek(week)
    return {
        pathway, week, day, title: '', story: '', kind, config, answerKey,
        xp: boss ? (finale ? 1500 : 750) : 70, tokens: boss ? (finale ? 60 : 30) : 7,
        bucket: boss ? 'showcase' : 'reflection', reviewMode: boss ? 'human' : 'ai',
        rubricKey: boss ? (finale ? FINALE_RUBRIC : 'boss') : 'practice', estMinutes: boss ? 30 : 20,
        badge: finale ? { key: `${pathway}-stage${stageOfWeek(week)}`, label: `${pathway === 'career' ? 'Career' : 'Enterprise'} Stage ${stageOfWeek(week)} Complete` } : null,
        isActive: true,
    }
}

/** Builds the exact MissionView a student would get, for the preview. */
function previewView(d: Draft, rubrics: RubricView[]): MissionView
{
    return {
        id: `preview-${d.key ?? 'new'}`, key: d.key ?? 'preview', pathway: d.pathway, stage: stageOfWeek(d.week), week: d.week, day: d.day, title: d.title || 'Untitled mission',
        story: d.story || null, kind: d.kind, config: d.config, estMinutes: d.estMinutes, xp: d.xp, tokens: d.tokens, bucket: d.bucket,
        reviewMode: d.reviewMode, rubric: rubrics.find((r) => r.key === d.rubricKey) ?? null, status: 'available',
        unlocksAt: new Date().toISOString(), attemptsUsed: 0, maxAttempts: MAX_ATTEMPTS, lastAttempt: null, badge: d.badge ?? null, tips: [],
    }
}

export default function MissionForm({ slug, editing, initial, rubrics, weeks, pathways, onSaved, onClose }: {
    slug: string
    /** The mission being edited, or null when creating. */
    editing: AdminMission | null
    initial: Draft
    rubrics: RubricView[]
    weeks: number
    pathways: PathwayView[]
    onSaved: (m: AdminMission) => void
    onClose: () => void
})
{
    const [d, setD] = useState<Draft>(initial)
    const [json, setJson] = useState<string | null>(null)
    const [preview, setPreview] = useState(false)
    const [saving, start] = useTransition()
    const locked = (editing?.attempts ?? 0) > 0
    const rubricSet = useMemo(() => new Set(rubrics.map((r) => r.key)), [rubrics])
    const problem = checkMission(d, { weeks, rubrics: rubricSet })

    const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }))
    const setConfig = (config: Draft['config'], answerKey: AnswerKey = d.answerKey ?? null) => set({ config, answerKey })

    function changeKind(kind: MissionKind)
    {
        // Form kinds share one config shape; other switches start from that kind's template.
        if (isFormKind(kind) && isFormKind(d.kind)) { set({ kind, ...(kind === 'boss' ? { reviewMode: 'human', bucket: 'showcase' } : {}) }); return }
        const { config, answerKey } = defaultConfig(kind)
        set({ kind, config, answerKey, ...(['quiz', 'sort', 'scenario'].includes(kind) ? { reviewMode: 'auto', rubricKey: null } : {}), ...(kind === 'boss' ? { reviewMode: 'human', bucket: 'showcase' } : {}) })
    }

    function openJson()
    {
        setJson(JSON.stringify({ config: d.config, answerKey: d.answerKey ?? null }, null, 2))
    }
    function applyJson()
    {
        try
        {
            const v = JSON.parse(json ?? '{}') as { config?: Draft['config']; answerKey?: AnswerKey }
            if (!v.config || typeof v.config !== 'object') { toast.error('The JSON needs a "config" object.'); return }
            setConfig(v.config, v.answerKey ?? null)
            setJson(null)
        } catch { toast.error('That isn’t valid JSON.') }
    }

    function save()
    {
        if (problem) { toast.error(problem); return }
        start(async () =>
        {
            const { key: _key, ...input } = d
            void _key
            const r = await saveMissionAction(slug, editing?.id ?? null, input)
            if (!r.ok) { toast.error(r.error); return }
            toast.success(editing ? 'Mission saved.' : 'Mission created.')
            onSaved(r.mission)
        })
    }

    const num = (v: string) => (v === '' ? 0 : Math.round(Number(v)))
    const autoKind = ['quiz', 'sort', 'scenario'].includes(d.kind)

    return (
        <div className="space-y-5">
            {locked && (
                <p className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {editing!.attempts} student attempt{editing!.attempts === 1 ? '' : 's'} already. You can fix wording, but kind and pathway are locked. Changing answers changes how future attempts are marked.
                </p>
            )}

            <section className="grid gap-3 sm:grid-cols-4">
                <label className="space-y-1"><span className={labelCls}>Pathway</span>
                    <select className={inputCls} disabled={locked} value={d.pathway} onChange={(e) => set({ pathway: e.target.value as Draft['pathway'] })}>
                        {pathways.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
                    </select></label>
                <label className="space-y-1"><span className={labelCls}>Week</span>
                    <select className={inputCls} value={d.week} onChange={(e) => set({ week: Number(e.target.value) })}>
                        {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => <option key={w} value={w}>Week {w}{isFinaleWeek(w) ? ' (finale)' : ''}</option>)}
                    </select></label>
                <label className="space-y-1"><span className={labelCls}>Day</span>
                    <select className={inputCls} value={d.day} onChange={(e) => set({ day: Number(e.target.value) })}>
                        {DAY_LONG.map((n, i) => <option key={n} value={i + 1}>{i + 1} · {n}{i === 6 ? ' (boss)' : ''}</option>)}
                    </select></label>
                <label className="space-y-1"><span className={labelCls}>Kind</span>
                    <select className={inputCls} disabled={locked} value={d.kind} onChange={(e) => changeKind(e.target.value as MissionKind)}>
                        {MISSION_KINDS.map((k) => <option key={k} value={k}>{KIND_META[k].label}</option>)}
                    </select></label>
            </section>

            <section className="space-y-3">
                <label className="block space-y-1"><span className={labelCls}>Title</span>
                    <input className={inputCls} maxLength={140} value={d.title} onChange={(e) => set({ title: e.target.value })} /></label>
                <label className="block space-y-1"><span className={labelCls}>Story (the brief students read first)</span>
                    <textarea className={`${inputCls} min-h-[90px]`} maxLength={4000} value={d.story ?? ''} onChange={(e) => set({ story: e.target.value })} /></label>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1"><span className={labelCls}>XP</span>
                    <input type="number" min={1} max={10000} className={inputCls} value={d.xp} onChange={(e) => set({ xp: num(e.target.value) })} /></label>
                <label className="space-y-1"><span className={labelCls}>HubTokens</span>
                    <input type="number" min={0} max={1000} className={inputCls} value={d.tokens} onChange={(e) => set({ tokens: num(e.target.value) })} /></label>
                <label className="space-y-1"><span className={labelCls}>Estimated minutes</span>
                    <input type="number" min={1} max={480} className={inputCls} value={d.estMinutes} onChange={(e) => set({ estMinutes: num(e.target.value) })} /></label>
                <label className="space-y-1"><span className={labelCls}>Score bucket</span>
                    <select className={inputCls} value={d.bucket} onChange={(e) => set({ bucket: e.target.value as Draft['bucket'] })}>
                        {SCORE_BUCKETS.map((b) => <option key={b} value={b}>{BUCKET_LABEL[b]}</option>)}
                    </select></label>
                <label className="space-y-1"><span className={labelCls}>Review</span>
                    <select className={inputCls} value={d.reviewMode} onChange={(e) => set({ reviewMode: e.target.value as Draft['reviewMode'] })}>
                        {REVIEW_MODES.map((r) => <option key={r} value={r}>{r === 'auto' ? 'Auto' : r === 'ai' ? 'AI' : 'Human (judges)'} · {REVIEW_META[r].label}</option>)}
                    </select></label>
                <label className="space-y-1"><span className={labelCls}>Rubric</span>
                    <select className={inputCls} value={d.rubricKey ?? ''} onChange={(e) => set({ rubricKey: e.target.value || null })}>
                        <option value="">None{autoKind ? ' (auto-marked)' : ''}</option>
                        {rubrics.map((r) => <option key={r.key} value={r.key}>{r.title} ({r.key})</option>)}
                    </select></label>
            </section>

            <section className="grid gap-3 sm:grid-cols-[auto_1fr_1fr] sm:items-end">
                <label className="flex items-center gap-2 pb-2 text-sm font-medium text-foreground">
                    <input type="checkbox" checked={Boolean(d.badge)} onChange={(e) => set({ badge: e.target.checked ? { key: '', label: '' } : null })} /> Awards a badge
                </label>
                {d.badge && <>
                    <label className="space-y-1"><span className={labelCls}>Badge label</span>
                        <input className={inputCls} value={d.badge.label} onChange={(e) => set({ badge: { ...d.badge!, label: e.target.value, key: d.badge!.key || '' } })} /></label>
                    <label className="space-y-1"><span className={labelCls}>Badge key</span>
                        <input className={`${inputCls} font-mono`} placeholder="e.g. market-mapper" value={d.badge.key} onChange={(e) => set({ badge: { ...d.badge!, key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') } })} /></label>
                </>}
            </section>

            <section className="space-y-3 rounded-3xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground">Activity · {KIND_META[d.kind].label}{autoKind ? ' + answer key (never shown to students)' : ''}</h3>
                    <button type="button" onClick={() => (json === null ? openJson() : setJson(null))} className="hw-press inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Braces className="h-3.5 w-3.5" /> {json === null ? 'Edit as JSON' : 'Back to form'}
                    </button>
                </div>
                {json !== null ? (
                    <div className="space-y-2">
                        <textarea className={`${inputCls} min-h-[320px] font-mono text-xs`} spellCheck={false} value={json} onChange={(e) => setJson(e.target.value)} />
                        <button type="button" onClick={applyJson} className="hw-press rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Apply JSON</button>
                    </div>
                ) : d.kind === 'quiz' ? <QuizEditor config={d.config as QuizConfig} answerKey={d.answerKey ?? null} onChange={setConfig} />
                    : d.kind === 'sort' ? <SortEditor config={d.config as SortConfig} answerKey={d.answerKey ?? null} onChange={setConfig} />
                    : d.kind === 'scenario' ? <ScenarioEditor config={d.config as ScenarioConfig} answerKey={d.answerKey ?? null} onChange={setConfig} />
                    : <FormEditor config={d.config as FormConfig} onChange={(c) => setConfig(c, null)} />}
            </section>

            <footer className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap items-center gap-2 border-t border-border bg-background/95 px-6 py-3 backdrop-blur">
                <p className={`mr-auto flex min-w-0 items-center gap-1.5 text-xs ${problem ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    {problem ? <><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{problem}</> : 'Ready to save.'}
                </p>
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <input type="checkbox" checked={d.isActive !== false} onChange={(e) => set({ isActive: e.target.checked })} /> Active
                </label>
                <button type="button" onClick={() => setPreview(true)} className="hw-press inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"><Eye className="h-4 w-4" /> Preview</button>
                <button type="button" onClick={onClose} className="hw-press rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
                <button type="button" onClick={save} disabled={saving || Boolean(problem)} className="hw-press inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                </button>
            </footer>

            <PreviewDialog open={preview} onOpenChange={setPreview} slug={slug} draft={d} rubrics={rubrics} pathways={pathways} />
        </div>
    )
}

/** "Student preview": the real MissionPlayer in preview mode (nothing is submitted). */
export function PreviewDialog({ open, onOpenChange, slug, draft: d, rubrics, pathways }: { open: boolean; onOpenChange: (o: boolean) => void; slug: string; draft: Draft; rubrics: RubricView[]; pathways: PathwayView[] })
{
    const color = pathways.find((p) => p.key === d.pathway)?.color ?? '#4B2BB8'
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Student preview</DialogTitle>
                    <DialogDescription>Exactly what students see. Nothing is saved; quizzes, sorts and scenarios are marked with your answer key.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Week {d.week} · {DAY_LONG[d.day - 1]} · {KIND_META[d.kind].label}</p>
                        <h2 className="text-xl font-extrabold text-foreground">{d.title || 'Untitled mission'}</h2>
                    </div>
                    {d.story && <p className="rounded-3xl px-4 py-4 text-sm leading-relaxed text-foreground" style={{ backgroundColor: `${color}12`, borderLeft: `4px solid ${d.kind === 'boss' ? '#D97706' : color}` }}>{d.story}</p>}
                    {open && <MissionPlayer slug={slug} mission={previewView(d, rubrics)} attempts={[]} color={color} homeHref={`/app/competitions/${slug}/admin/content`} preview={{ answerKey: d.answerKey ?? null }} />}
                </div>
            </DialogContent>
        </Dialog>
    )
}
