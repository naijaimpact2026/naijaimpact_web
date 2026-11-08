'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Rocket } from 'lucide-react'
import { toast } from '@/components/toast'
import { joinCompetition, updateParticipant } from '@/lib/actions/competitions'
import { CHARACTERS, NIGERIAN_STATES, characterPreviewUrl, normalizeAvatar, type AvatarConfig } from '@/lib/competitions/config'

interface Props
{
    competitionId: string
    themeColor: string
    mode: 'join' | 'edit'
    initialState?: string | null
    initialAvatar?: AvatarConfig | null
    onDone?: () => void
}

/** Join form: pick a character + your state (for state leaderboards). Also used to edit. */
export default function JoinCompetitionCard({ competitionId, themeColor, mode, initialState, initialAvatar, onDone }: Props)
{
    const router = useRouter()
    const [character, setCharacter] = useState(normalizeAvatar(initialAvatar).character)
    const [state, setState] = useState(initialState ?? '')
    const [pending, startTransition] = useTransition()

    function submit()
    {
        startTransition(async () =>
        {
            const input = { competitionId, state: state || null, avatar: { character } }
            const res = mode === 'join' ? await joinCompetition(input) : await updateParticipant(input)
            if (!res.ok) { toast.error(res.error); return }
            toast.success(mode === 'join' ? 'You’re in! Start your first mission.' : 'Saved.')
            onDone?.()
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Choose your character</p>
                <div className="grid grid-cols-6 gap-2">
                    {CHARACTERS.map((c, i) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCharacter(i)}
                            aria-label={`Character ${i + 1}`}
                            aria-pressed={character === i}
                            className={`aspect-square rounded-2xl p-1 transition-all ${character === i ? 'ring-2 scale-105' : 'bg-muted/60 ring-1 ring-border hover:bg-muted'}`}
                            style={character === i ? { backgroundColor: `${themeColor}22`, ['--tw-ring-color' as string]: themeColor } : undefined}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                            <img src={characterPreviewUrl(i)} alt="" className="h-full w-full object-contain" draggable={false} />
                        </button>
                    ))}
                </div>
            </div>
            <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Your state (for the state leaderboard)</span>
                <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                >
                    <option value="">Prefer not to say</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </label>
            <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: themeColor }}
            >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {mode === 'join' ? 'Join the competition' : 'Save'}
            </button>
        </div>
    )
}
