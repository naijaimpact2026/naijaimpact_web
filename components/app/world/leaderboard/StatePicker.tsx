'use client'

import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { NIGERIAN_STATES } from '@/lib/competitions/config'

/** State filter for the leaderboard. `base` is the board URL with scope=state already set. */
export default function StatePicker({ base, current, mine }: { base: string; current: string | null; mine: string | null })
{
    const router = useRouter()
    const go = (state: string) =>
    {
        const url = new URL(base, window.location.origin)
        url.searchParams.set('value', state)
        router.push(`${url.pathname}${url.search}`, { scroll: false })
    }
    return (
        <label className={`hw-press relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${current ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            <MapPin className="h-3.5 w-3.5" />
            <span>{current ?? 'State'}</span>
            <select
                aria-label="Filter by state"
                value={current ?? ''}
                onChange={(e) => e.target.value && go(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
            >
                <option value="" disabled>Choose a state</option>
                {mine && <option value={mine}>My state ({mine})</option>}
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
        </label>
    )
}
