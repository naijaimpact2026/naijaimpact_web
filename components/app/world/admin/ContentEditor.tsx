'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, Copy, Eye, FileJson, Loader2, Pencil, Plus, Power, PowerOff, Scale, Swords, Users } from 'lucide-react'
import { toast } from '@/components/toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { duplicateMissionsAction, listAdminMissionsAction, setMissionActiveAction } from '@/lib/actions/world'
import { checkWeek, isFinaleWeek, type AdminMission } from '@/lib/world/content-rules'
import type { Pathway, PathwayView, RubricView } from '@/lib/world/types'
import { DAY_NAMES, KIND_META } from '@/lib/world/ui'
import { inputCls, labelCls } from './ConfigEditors'
import ImportWeek from './ImportWeek'
import MissionForm, { PreviewDialog, draftFrom, newDraft, type Draft } from './MissionForm'
import RubricEditor from './RubricEditor'

type Tab = 'missions' | 'rubrics' | 'import'
type Rubric = RubricView & { missions: number }
type Dup = { kind: 'one'; mission: AdminMission; toWeek: number; toPathway: Pathway; toDay: number } | { kind: 'week'; pathway: Pathway; fromWeek: number; toWeek: number; toPathway: Pathway }

export default function ContentEditor({ slug, name, weeks, currentWeek, pathways, missions: initial, rubrics }: {
    slug: string; name: string; weeks: number; currentWeek: number | null; pathways: PathwayView[]; missions: AdminMission[]; rubrics: Rubric[]
})
{
    const router = useRouter()
    const [tab, setTab] = useState<Tab>('missions')
    const [missions, setMissions] = useState(initial)
    const [pathway, setPathway] = useState<'all' | Pathway>('all')
    const [week, setWeek] = useState<number | 'all'>(currentWeek ?? 1)
    const [day, setDay] = useState<number | 'all'>('all')
    const [showOff, setShowOff] = useState(true)
    const [form, setForm] = useState<{ editing: AdminMission | null; initial: Draft } | null>(null)
    const [preview, setPreview] = useState<Draft | null>(null)
    const [dup, setDup] = useState<Dup | null>(null)
    const [busy, start] = useTransition()

    const shown = useMemo(() => missions.filter((m) =>
        (pathway === 'all' || m.pathway === pathway) && (week === 'all' || m.week === week) && (day === 'all' || m.day === day) && (showOff || m.isActive))
        .sort((a, b) => a.week - b.week || a.pathway.localeCompare(b.pathway) || a.day - b.day || Number(b.isActive) - Number(a.isActive)), [missions, pathway, week, day, showOff])

    const visiblePathways = pathways.filter((p) => pathway === 'all' || p.key === pathway)
    const pathName = (k: Pathway) => pathways.find((p) => p.key === k)?.name ?? k
    const pathColor = (k: Pathway) => pathways.find((p) => p.key === k)?.color ?? '#4B2BB8'
    const weekStatus = useMemo(() => Array.from({ length: weeks }, (_, i) => i + 1).map((w) => ({
        week: w, checks: pathways.map((p) => checkWeek(p.key, w, missions)),
    })), [weeks, pathways, missions])

    function upsert(list: AdminMission[])
    {
        setMissions((xs) =>
        {
            const map = new Map(xs.map((x) => [x.id, x]))
            for (const m of list) map.set(m.id, m)
            return [...map.values()]
        })
        router.refresh()
    }

    async function reload()
    {
        const r = await listAdminMissionsAction(slug)
        if (r.ok) setMissions(r.missions)
        setTab('missions')
        router.refresh()
    }

    function toggle(m: AdminMission)
    {
        start(async () =>
        {
            const r = await setMissionActiveAction(slug, m.id, !m.isActive)
            if (!r.ok) { toast.error(r.error); return }
            upsert([r.mission])
            toast.success(r.mission.isActive ? 'Switched on — students will see it on its day.' : 'Switched off — students no longer see it.')
        })
    }

    function runDup()
    {
        if (!dup) return
        start(async () =>
        {
            const r = dup.kind === 'one'
                ? await duplicateMissionsAction(slug, { missionId: dup.mission.id, toWeek: dup.toWeek, toPathway: dup.toPathway, toDay: dup.toDay })
                : await duplicateMissionsAction(slug, { pathway: dup.pathway, fromWeek: dup.fromWeek, toWeek: dup.toWeek, toPathway: dup.toPathway })
            if (!r.ok) { toast.error(r.error); return }
            upsert(r.created)
            toast.success(`Copied ${r.created.length} mission${r.created.length === 1 ? '' : 's'} (switched off — edit, then switch on).`)
            setWeek(dup.toWeek); setPathway('all'); setDay('all'); setShowOff(true)
            setDup(null)
        })
    }

    const tabs: { id: Tab; label: string; icon: typeof Pencil }[] = [
        { id: 'missions', label: 'Missions', icon: Pencil },
        { id: 'rubrics', label: 'Rubrics', icon: Scale },
        { id: 'import', label: 'Import a week', icon: FileJson },
    ]

    return (
        <div className="space-y-5">
            <Link href={`/app/competitions/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {name}
            </Link>
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-extrabold text-foreground sm:text-2xl">Mission content</h1>
                    <p className="text-sm text-muted-foreground">Write and schedule missions for every week. Students only see active missions, from 00:00 Lagos time on their day.</p>
                </div>
                <div className="flex gap-1 rounded-2xl bg-muted p-1" role="tablist">
                    {tabs.map((t) => (
                        <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                            className={`hw-press inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold ${tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                            <t.icon className="h-4 w-4" />{t.label}
                        </button>
                    ))}
                </div>
            </header>

            {tab === 'rubrics' && <RubricEditor slug={slug} rubrics={rubrics} />}
            {tab === 'import' && <ImportWeek slug={slug} weeks={weeks} rubricKeys={rubrics.map((r) => r.key)} onImported={reload} />}

            {tab === 'missions' && <>
                {/* Weeks overview: green = both pathways complete. */}
                <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Weeks">
                    {weekStatus.map(({ week: w, checks }) =>
                    {
                        const ready = checks.every((c) => c.ready)
                        const empty = checks.every((c) => c.days.every((n) => n === 0))
                        return (
                            <button key={w} onClick={() => setWeek(w)} title={ready ? 'Complete' : empty ? 'No missions yet' : checks.flatMap((c) => c.problems.map((p) => `${pathName(c.pathway)}: ${p}`)).join('\n')}
                                className={`hw-press relative shrink-0 rounded-xl border px-2.5 py-1.5 text-xs font-bold ${week === w ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'}`}>
                                W{w}
                                <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${ready ? 'bg-emerald-500' : empty ? 'bg-muted-foreground/40' : 'bg-amber-500'}`} />
                            </button>
                        )
                    })}
                    <button onClick={() => setWeek('all')} className={`hw-press shrink-0 rounded-xl border px-2.5 py-1.5 text-xs font-bold ${week === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'}`}>All</button>
                </nav>

                <div className="flex flex-wrap items-end gap-3">
                    <label className="space-y-1"><span className={labelCls}>Pathway</span>
                        <select className={`${inputCls} w-44`} value={pathway} onChange={(e) => setPathway(e.target.value as 'all' | Pathway)}>
                            <option value="all">Both pathways</option>
                            {pathways.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
                        </select></label>
                    <label className="space-y-1"><span className={labelCls}>Day</span>
                        <select className={`${inputCls} w-32`} value={day} onChange={(e) => setDay(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                            <option value="all">Every day</option>
                            {DAY_NAMES.map((n, i) => <option key={n} value={i + 1}>{n}{i === 6 ? ' (boss)' : ''}</option>)}
                        </select></label>
                    <label className="flex items-center gap-2 pb-2 text-sm text-foreground"><input type="checkbox" checked={showOff} onChange={(e) => setShowOff(e.target.checked)} /> Show switched-off</label>
                    <div className="ml-auto flex flex-wrap gap-2">
                        <button onClick={() => setDup({ kind: 'week', pathway: pathway === 'all' ? 'career' : pathway, fromWeek: week === 'all' ? 1 : week, toWeek: Math.min(weeks, (week === 'all' ? 1 : week) + 1), toPathway: pathway === 'all' ? 'career' : pathway })}
                            className="hw-press inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"><Copy className="h-4 w-4" /> Copy a week</button>
                        <button onClick={() => setForm({ editing: null, initial: newDraft(pathway === 'all' ? 'career' : pathway, week === 'all' ? 1 : week, day === 'all' ? 1 : day) })}
                            className="hw-press inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> New mission</button>
                    </div>
                </div>

                {/* Week planner: one row per pathway, Mon–Sun. */}
                {week !== 'all' && (
                    <section className="space-y-3">
                        {visiblePathways.map((p) =>
                        {
                            const check = checkWeek(p.key, week, missions)
                            return (
                                <div key={p.key} className="rounded-3xl border border-border bg-card p-3 sm:p-4">
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <p className="flex items-center gap-2 text-sm font-bold text-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />{p.name} · Week {week}{isFinaleWeek(week) ? ' · stage finale' : ''}</p>
                                        <p className={`flex items-center gap-1 text-xs font-semibold ${check.ready ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                            {check.ready ? <><CheckCircle2 className="h-3.5 w-3.5" /> Week complete</> : <><AlertTriangle className="h-3.5 w-3.5" />{check.problems.join(' ')}</>}
                                        </p>
                                    </div>
                                    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                                        {DAY_NAMES.map((dn, i) =>
                                        {
                                            const inSlot = missions.filter((m) => m.pathway === p.key && m.week === week && m.day === i + 1).sort((a, b) => Number(b.isActive) - Number(a.isActive))
                                            const live = inSlot.find((m) => m.isActive)
                                            return (
                                                <li key={dn} className={`flex min-h-[86px] flex-col rounded-2xl border p-2 text-xs ${live ? 'border-border bg-background' : 'border-dashed border-border bg-muted/30'}`}>
                                                    <span className="font-bold text-muted-foreground">{dn}{i === 6 ? ' · boss' : ''}</span>
                                                    {live ? (
                                                        <button onClick={() => setForm({ editing: live, initial: draftFrom(live) })} className="mt-1 text-left font-semibold leading-snug text-foreground hover:underline">
                                                            {live.kind === 'boss' && <Swords className="mr-1 inline h-3.5 w-3.5 text-amber-600" />}{live.title}
                                                            <span className="mt-0.5 block font-normal text-muted-foreground">{KIND_META[live.kind].label}</span>
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => setForm({ editing: null, initial: newDraft(p.key, week, i + 1) })} className="mt-auto inline-flex items-center gap-1 font-semibold text-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Add</button>
                                                    )}
                                                    {inSlot.length > (live ? 1 : 0) && <span className="mt-auto pt-1 text-[11px] text-muted-foreground">+{inSlot.length - (live ? 1 : 0)} switched off</span>}
                                                </li>
                                            )
                                        })}
                                    </ol>
                                </div>
                            )
                        })}
                    </section>
                )}

                {/* Mission list */}
                <section className="overflow-hidden rounded-3xl border border-border bg-card">
                    {shown.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">No missions match. Use <strong>New mission</strong>, <strong>Copy a week</strong> or <strong>Import a week</strong>.</p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {shown.map((m) => (
                                <li key={m.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4 ${m.isActive ? '' : 'opacity-60'}`}>
                                    <span className="w-16 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">W{m.week} · {DAY_NAMES[m.day - 1]}</span>
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: pathColor(m.pathway) }} title={pathName(m.pathway)} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {KIND_META[m.kind].label} · {m.reviewMode === 'auto' ? 'auto' : m.reviewMode === 'ai' ? 'AI' : 'judges'}{m.rubricKey ? ` · ${m.rubricKey}` : ''} · {m.xp} XP · <span className="font-mono">{m.key}</span>
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Student attempts"><Users className="h-3.5 w-3.5" />{m.attempts}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${m.isActive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{m.isActive ? 'Active' : 'Off'}</span>
                                    <div className="flex items-center">
                                        <IconBtn label="Edit" onClick={() => setForm({ editing: m, initial: draftFrom(m) })}><Pencil className="h-4 w-4" /></IconBtn>
                                        <IconBtn label="Preview" onClick={() => setPreview(draftFrom(m))}><Eye className="h-4 w-4" /></IconBtn>
                                        <IconBtn label="Duplicate" onClick={() => setDup({ kind: 'one', mission: m, toWeek: Math.min(weeks, m.week + 1), toPathway: m.pathway, toDay: m.day })}><Copy className="h-4 w-4" /></IconBtn>
                                        <IconBtn label={m.isActive ? 'Switch off' : 'Switch on'} disabled={busy} onClick={() => toggle(m)}>{m.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}</IconBtn>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </>}

            {/* Create / edit */}
            <Dialog open={form !== null} onOpenChange={(o) => { if (!o) setForm(null) }}>
                <DialogContent className="max-h-[94vh] overflow-y-auto rounded-3xl sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{form?.editing ? `Edit: ${form.editing.title}` : 'New mission'}</DialogTitle>
                        <DialogDescription>{form?.editing ? <>Key <span className="font-mono">{form.editing.key}</span> · {form.editing.attempts} attempts</> : 'Fill in the brief and the activity. Rules are checked as you type.'}</DialogDescription>
                    </DialogHeader>
                    {form && (
                        <MissionForm key={form.editing?.id ?? 'new'} slug={slug} editing={form.editing} initial={form.initial} rubrics={rubrics} weeks={weeks} pathways={pathways}
                            onSaved={(m) => { upsert([m]); setForm(null) }} onClose={() => setForm(null)} />
                    )}
                </DialogContent>
            </Dialog>

            {preview && <PreviewDialog open onOpenChange={(o) => { if (!o) setPreview(null) }} slug={slug} draft={preview} rubrics={rubrics} pathways={pathways} />}

            {/* Duplicate */}
            <Dialog open={dup !== null} onOpenChange={(o) => { if (!o && !busy) setDup(null) }}>
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{dup?.kind === 'one' ? 'Duplicate mission' : 'Copy a week'}</DialogTitle>
                        <DialogDescription>Copies start switched off, so students don’t see them until you edit and switch them on. Answer keys are copied too.</DialogDescription>
                    </DialogHeader>
                    {dup && (
                        <div className="space-y-3">
                            {dup.kind === 'week' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="space-y-1"><span className={labelCls}>From pathway</span>
                                        <select className={inputCls} value={dup.pathway} onChange={(e) => setDup({ ...dup, pathway: e.target.value as Pathway })}>{pathways.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</select></label>
                                    <label className="space-y-1"><span className={labelCls}>From week</span>
                                        <WeekSelect weeks={weeks} value={dup.fromWeek} onChange={(w) => setDup({ ...dup, fromWeek: w })} /></label>
                                </div>
                            )}
                            {dup.kind === 'one' && <p className="text-sm font-semibold text-foreground">{dup.mission.title}</p>}
                            <div className="grid grid-cols-2 gap-3">
                                <label className="space-y-1"><span className={labelCls}>To pathway</span>
                                    <select className={inputCls} value={dup.toPathway} onChange={(e) => setDup({ ...dup, toPathway: e.target.value as Pathway })}>{pathways.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</select></label>
                                <label className="space-y-1"><span className={labelCls}>To week</span>
                                    <WeekSelect weeks={weeks} value={dup.toWeek} onChange={(w) => setDup({ ...dup, toWeek: w })} /></label>
                                {dup.kind === 'one' && (
                                    <label className="space-y-1"><span className={labelCls}>To day</span>
                                        <select className={inputCls} value={dup.toDay} onChange={(e) => setDup({ ...dup, toDay: Number(e.target.value) })}>{DAY_NAMES.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}</select></label>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <button onClick={() => setDup(null)} disabled={busy} className="hw-press rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
                                <button onClick={runDup} disabled={busy} className="hw-press inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />} Copy
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function WeekSelect({ weeks, value, onChange }: { weeks: number; value: number; onChange: (w: number) => void })
{
    return (
        <select className={inputCls} value={value} onChange={(e) => onChange(Number(e.target.value))}>
            {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => <option key={w} value={w}>Week {w}</option>)}
        </select>
    )
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode })
{
    return (
        <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
            className="hw-press rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">{children}</button>
    )
}
