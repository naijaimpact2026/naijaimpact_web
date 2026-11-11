'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Loader2, Settings, Subtitles, Zap } from 'lucide-react'
import { toast } from '@/components/toast'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { updateWorldMeAction } from '@/lib/actions/world'
import { CHARACTERS, NIGERIAN_STATES, characterPreviewUrl } from '@/lib/competitions/config'
import type { WorldParticipantView } from '@/lib/world/types'

/*
 * Player settings after onboarding (Dev 2): character, state and
 * accessibility (Lite mode, captions, reduce motion). Saves through
 * PATCH /me (updateWorldMe), the same call the mobile app uses.
 */
export default function WorldSettings({ slug, me, color }: { slug: string; me: WorldParticipantView; color: string })
{
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [character, setCharacter] = useState(me.avatar.character)
    const [state, setState] = useState(me.state ?? '')
    const [lite, setLite] = useState(Boolean(me.accessibility.lite))
    const [captions, setCaptions] = useState(Boolean(me.accessibility.captions))
    const [reducedMotion, setReducedMotion] = useState(Boolean(me.accessibility.reducedMotion))
    const [pending, start] = useTransition()

    function reset()
    {
        setCharacter(me.avatar.character)
        setState(me.state ?? '')
        setLite(Boolean(me.accessibility.lite))
        setCaptions(Boolean(me.accessibility.captions))
        setReducedMotion(Boolean(me.accessibility.reducedMotion))
    }

    function save()
    {
        start(async () =>
        {
            const r = await updateWorldMeAction(slug, { character, state: state || null, accessibility: { lite, captions, reducedMotion } })
            if (!r.ok) { toast.error(r.error); return }
            toast.success('Settings saved.')
            setOpen(false)
            router.refresh()
        })
    }

    return (
        <>
            <button
                type="button"
                onClick={() => { reset(); setOpen(true) }}
                className="hw-press inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
                <Settings className="h-4 w-4" /> Settings
            </button>
            <Dialog open={open} onOpenChange={(v) => { if (!pending) setOpen(v) }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogTitle>Your settings</DialogTitle>
                    <DialogDescription>Change your character, state and accessibility options.</DialogDescription>

                    <div className="space-y-5">
                        <fieldset>
                            <legend className="mb-2 text-xs font-semibold text-muted-foreground">Character</legend>
                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                                {CHARACTERS.map((c, i) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCharacter(i)}
                                        aria-label={`Character ${i + 1}`}
                                        aria-pressed={character === i}
                                        className={`aspect-square rounded-2xl p-1.5 transition-all ${character === i ? 'ring-2' : 'bg-muted/60 ring-1 ring-border hover:bg-muted'}`}
                                        style={character === i ? { backgroundColor: `${color}1f`, ['--tw-ring-color' as string]: color } : undefined}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                                        <img src={characterPreviewUrl(i)} alt="" className="h-full w-full object-contain" draggable={false} />
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Your state (for the state leaderboard)</span>
                            <select value={state} onChange={(e) => setState(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground">
                                <option value="">Prefer not to say</option>
                                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>

                        <fieldset className="space-y-2">
                            <legend className="mb-1.5 text-xs font-semibold text-muted-foreground">Accessibility</legend>
                            <Toggle icon={Zap} label="Lite mode" hint="Saves data: no animations, simple list view" checked={lite} onChange={setLite} color={color} />
                            <Toggle icon={Subtitles} label="Captions" hint="Show captions on videos" checked={captions} onChange={setCaptions} color={color} />
                            <Toggle icon={Eye} label="Reduce motion" hint="Fewer animations" checked={reducedMotion} onChange={setReducedMotion} color={color} />
                        </fieldset>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setOpen(false)} disabled={pending} className="h-11 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
                        <button
                            type="button"
                            onClick={save}
                            disabled={pending}
                            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: color }}
                        >
                            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
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
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3 text-left hover:bg-muted/50"
        >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
            </span>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? '' : 'bg-muted-foreground/30'}`} style={checked ? { backgroundColor: color } : undefined}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
        </button>
    )
}
