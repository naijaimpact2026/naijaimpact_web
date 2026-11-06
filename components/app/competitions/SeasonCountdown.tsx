'use client'

import { useEffect, useState } from 'react'

function parts(ms: number)
{
    const s = Math.max(0, Math.floor(ms / 1000))
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}

/** Live countdown to season start (if upcoming) or season end. */
export default function SeasonCountdown({ start, end, compact = false }: { start: string | null; end: string | null; compact?: boolean })
{
    const [now, setNow] = useState<number | null>(null)
    useEffect(() =>
    {
        setNow(Date.now())
        const t = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(t)
    }, [])

    if (!end) return null
    const startMs = start ? new Date(start).getTime() : 0
    const endMs = new Date(end).getTime()
    // Until mounted, render a stable placeholder so server and client HTML match.
    const current = now ?? startMs
    const upcoming = current < startMs
    const ended = current > endMs
    const { d, h, m, s } = parts((upcoming ? startMs : endMs) - current)

    if (ended) return <p className="text-sm font-semibold">Season ended</p>

    const label = upcoming ? 'Starts in' : 'Ends in'
    const units = [
        { v: d, l: 'Days' },
        { v: h, l: 'Hrs' },
        { v: m, l: 'Min' },
        { v: s, l: 'Sec' },
    ]

    if (compact)
    {
        return (
            <span className="tabular-nums" suppressHydrationWarning>
                {label} {now === null ? '—' : `${d}d ${h}h ${m}m`}
            </span>
        )
    }

    return (
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
            <div className="mt-1.5 flex gap-1.5" suppressHydrationWarning>
                {units.map(({ v, l }) => (
                    <div key={l} className="min-w-[52px] rounded-xl bg-black/25 px-2 py-1.5 text-center backdrop-blur-sm">
                        <p className="text-lg sm:text-xl font-extrabold tabular-nums leading-none">{now === null ? '--' : String(v).padStart(2, '0')}</p>
                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide opacity-75">{l}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
