'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Briefcase, Check, Eye, GraduationCap, Lightbulb, Loader2, Rocket, Search, Subtitles, Zap } from 'lucide-react'
import { toast } from '@/components/toast'
import { joinWorldAction, searchInstitutionsAction } from '@/lib/actions/world'
import { CHARACTERS, NIGERIAN_STATES, characterPreviewUrl } from '@/lib/competitions/config'
import type { InstitutionView, Pathway, PathwayView } from '@/lib/world/types'

/*
 * Arrival Plaza — first-session onboarding (blueprint §9):
 * pathway → campus → you (avatar, state, accessibility) → review & join.
 * The baseline diagnostic is the first mission (Week 1 · Monday).
 */

const PATHWAY_COPY: Record<Pathway, { icon: typeof Briefcase; points: string[] }> = {
    career: { icon: Briefcase, points: ['Discover careers that fit you', 'Build your CV, brand & portfolio', 'Practise interviews and pitch your path'] },
    enterprise: { icon: Lightbulb, points: ['Find real problems around you', 'Research customers and test ideas', 'Build a prototype and pitch it'] },
}

const STEPS = ['Pathway', 'Campus', 'You', 'Ready'] as const

export default function WorldOnboarding({ slug, pathways, competitionName }: { slug: string; pathways: PathwayView[]; competitionName: string })
{
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [pathway, setPathway] = useState<Pathway | null>(null)
    const [institution, setInstitution] = useState<InstitutionView | null>(null)
    const [otherName, setOtherName] = useState('')
    const [noCampus, setNoCampus] = useState(false)
    const [state, setState] = useState('')
    const [character, setCharacter] = useState(0)
    const [lite, setLite] = useState(false)
    const [captions, setCaptions] = useState(true)
    const [reducedMotion, setReducedMotion] = useState(false)
    const [pending, start] = useTransition()

    const chosen = pathways.find((p) => p.key === pathway)
    const color = chosen?.color ?? '#4B2BB8'
    const campusDone = Boolean(institution) || noCampus || otherName.trim().length >= 4
    const canNext = step === 0 ? Boolean(pathway) : step === 1 ? campusDone : true

    function join()
    {
        if (!pathway) return
        start(async () =>
        {
            const r = await joinWorldAction(slug, {
                pathway,
                institutionId: institution?.id ?? null,
                institutionName: !institution && !noCampus && otherName.trim() ? otherName.trim() : null,
                state: state || null,
                character,
                accessibility: { lite, captions, reducedMotion },
            })
            if (!r.ok) { toast.error(r.error); return }
            toast.success('Welcome to Hubnovo World! Your first quest is ready.')
            router.refresh()
        })
    }

    return (
        <section className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Progress */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
                {STEPS.map((label, i) => (
                    <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i <= step ? 'text-white' : 'bg-muted text-muted-foreground'}`}
                            style={i <= step ? { backgroundColor: color } : undefined}
                        >
                            {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                        </span>
                        <span className={`hidden truncate text-xs font-semibold sm:inline ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                        {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
                    </div>
                ))}
            </div>

            <div className="space-y-5 p-4 sm:p-6">
                {step === 0 && (
                    <>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Arrival Plaza</p>
                            <h2 className="mt-1 text-xl font-bold text-foreground">Choose your pathway</h2>
                            <p className="mt-1 text-sm text-muted-foreground">You’ll play {competitionName} on one pathway this semester. Each has its own missions and leaderboard.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {pathways.map((p) =>
                            {
                                const meta = PATHWAY_COPY[p.key]
                                const Icon = meta.icon
                                const active = pathway === p.key
                                return (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => setPathway(p.key)}
                                        aria-pressed={active}
                                        className={`rounded-2xl border-2 p-4 text-left transition-all ${active ? 'shadow-md' : 'border-border hover:border-foreground/20'}`}
                                        style={active ? { borderColor: p.color, backgroundColor: `${p.color}0f` } : undefined}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${p.color}1f`, color: p.color }}><Icon className="h-5 w-5" /></span>
                                            {active && <span className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: p.color }}><Check className="h-3.5 w-3.5" /></span>}
                                        </div>
                                        <h3 className="mt-3 text-base font-bold text-foreground">{p.name}</h3>
                                        {p.tagline && <p className="mt-0.5 text-xs text-muted-foreground">{p.tagline}</p>}
                                        <ul className="mt-3 space-y-1.5">
                                            {meta.points.map((t) => (
                                                <li key={t} className="flex items-start gap-2 text-sm text-foreground"><Zap className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: p.color }} />{t}</li>
                                            ))}
                                        </ul>
                                    </button>
                                )
                            })}
                        </div>
                    </>
                )}

                {step === 1 && (
                    <CampusStep
                        color={color}
                        institution={institution}
                        onPick={(i) => { setInstitution(i); setNoCampus(false); setOtherName('') }}
                        otherName={otherName}
                        onOther={(v) => { setOtherName(v); setInstitution(null); setNoCampus(false) }}
                        noCampus={noCampus}
                        onNoCampus={() => { setNoCampus(true); setInstitution(null); setOtherName('') }}
                    />
                )}

                {step === 2 && (
                    <div className="space-y-5">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Create your character</h2>
                            <p className="mt-1 text-sm text-muted-foreground">This is how you’ll walk around Hubnovo World.</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                            {CHARACTERS.map((c, i) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCharacter(i)}
                                    aria-label={`Character ${i + 1}`}
                                    aria-pressed={character === i}
                                    className={`aspect-square rounded-2xl p-1.5 transition-all ${character === i ? 'ring-2 scale-105' : 'bg-muted/60 ring-1 ring-border hover:bg-muted'}`}
                                    style={character === i ? { backgroundColor: `${color}1f`, ['--tw-ring-color' as string]: color } : undefined}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                                    <img src={characterPreviewUrl(i)} alt="" className="h-full w-full object-contain" draggable={false} />
                                </button>
                            ))}
                        </div>
                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Your state (for the state leaderboard)</span>
                            <select id="world-state" value={state} onChange={(e) => setState(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground">
                                <option value="">Prefer not to say</option>
                                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                        <fieldset className="space-y-2">
                            <legend className="mb-1.5 text-xs font-semibold text-muted-foreground">Accessibility</legend>
                            <Toggle icon={Zap} label="Lite mode" hint="Low-data list view instead of the 3D world" checked={lite} onChange={setLite} color={color} />
                            <Toggle icon={Subtitles} label="Captions" hint="Show captions on videos" checked={captions} onChange={setCaptions} color={color} />
                            <Toggle icon={Eye} label="Reduce motion" hint="Fewer animations" checked={reducedMotion} onChange={setReducedMotion} color={color} />
                        </fieldset>
                    </div>
                )}

                {step === 3 && chosen && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 shrink-0 rounded-3xl p-2" style={{ backgroundColor: `${color}1f` }}>
                                {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                                <img src={characterPreviewUrl(character)} alt="" className="h-full w-full object-contain" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-foreground">You’re all set</h2>
                                <p className="text-sm text-muted-foreground">Here’s how you’ll compete this semester.</p>
                            </div>
                        </div>
                        <dl className="divide-y divide-border rounded-2xl border border-border">
                            <Row label="Pathway" value={chosen.name} />
                            <Row label="Campus" value={institution ? institution.name : noCampus ? 'Not a student' : otherName ? `${otherName} (awaiting approval)` : '—'} />
                            <Row label="State" value={state || 'Not shared'} />
                        </dl>
                        <ul className="space-y-2 rounded-2xl bg-muted/50 p-4 text-sm text-foreground">
                            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> A new quest opens every day (15–30 minutes). Missed days stay open — no streak pressure.</li>
                            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Sunday is the boss challenge, scored by judges.</li>
                            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Earn XP and HubTokens. They’re rewards, not money, and can’t buy a better score.</li>
                            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Never upload other people’s names, numbers or addresses in your evidence.</li>
                        </ul>
                    </div>
                )}

                {/* Nav */}
                <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                        type="button"
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
                        disabled={step === 0 || pending}
                        className="inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:invisible"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    {step < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep((s) => s + 1)}
                            disabled={!canNext}
                            className="inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-40"
                            style={{ backgroundColor: color }}
                        >
                            Continue <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={join}
                            disabled={pending}
                            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: color }}
                        >
                            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Enter Hubnovo World
                        </button>
                    )}
                </div>
            </div>
        </section>
    )
}

function Row({ label, value }: { label: string; value: string })
{
    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
            <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
            <dd className="text-right text-sm font-semibold text-foreground">{value}</dd>
        </div>
    )
}

function Toggle({ icon: Icon, label, hint, checked, onChange, color }: { icon: typeof Eye; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; color: string })
{
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left hover:bg-muted/50"
        >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
            </span>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? '' : 'bg-muted'}`} style={checked ? { backgroundColor: color } : undefined}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
        </button>
    )
}

function CampusStep(props: {
    color: string
    institution: InstitutionView | null
    onPick: (i: InstitutionView) => void
    otherName: string
    onOther: (v: string) => void
    noCampus: boolean
    onNoCampus: () => void
})
{
    const [q, setQ] = useState('')
    const [results, setResults] = useState<InstitutionView[]>([])
    const [loading, setLoading] = useState(false)
    const [showOther, setShowOther] = useState(Boolean(props.otherName))
    const seq = useRef(0)

    useEffect(() =>
    {
        const id = ++seq.current
        setLoading(true)
        const t = setTimeout(async () =>
        {
            const r = await searchInstitutionsAction(q)
            if (id !== seq.current) return
            setResults(r.ok ? r.institutions : [])
            setLoading(false)
        }, 250)
        return () => clearTimeout(t)
    }, [q])

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-bold text-foreground">Which campus do you represent?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your XP counts toward your campus in the campus vs campus league.</p>
            </div>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    id="world-campus-search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search e.g. UNILAG, Covenant, Yaba Tech"
                    className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm"
                />
                {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            <ul className="max-h-72 space-y-1 overflow-y-auto overscroll-contain rounded-2xl border border-border p-1.5">
                {results.length === 0 && !loading && <li className="px-3 py-4 text-center text-sm text-muted-foreground">No matches. Add your institution below.</li>}
                {results.map((r) =>
                {
                    const active = props.institution?.id === r.id
                    return (
                        <li key={r.id}>
                            <button
                                type="button"
                                onClick={() => props.onPick(r)}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${active ? '' : 'hover:bg-muted'}`}
                                style={active ? { backgroundColor: `${props.color}14` } : undefined}
                            >
                                <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-foreground">{r.name}</span>
                                    <span className="block text-xs text-muted-foreground">{[r.shortName, r.state].filter(Boolean).join(' · ')}</span>
                                </span>
                                {active && <Check className="h-4 w-4 shrink-0" style={{ color: props.color }} />}
                            </button>
                        </li>
                    )
                })}
            </ul>
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowOther(true)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">My institution isn’t listed</button>
                <button
                    type="button"
                    onClick={props.onNoCampus}
                    aria-pressed={props.noCampus}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${props.noCampus ? 'text-white' : 'border-border text-foreground hover:bg-muted'}`}
                    style={props.noCampus ? { backgroundColor: props.color, borderColor: props.color } : undefined}
                >
                    I’m not a student
                </button>
            </div>
            {showOther && (
                <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Full name of your institution (we’ll add it after a quick check)</span>
                    <input id="world-campus-other" value={props.otherName} onChange={(e) => props.onOther(e.target.value)} placeholder="e.g. Federal Polytechnic Ilaro" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                </label>
            )}
        </div>
    )
}
