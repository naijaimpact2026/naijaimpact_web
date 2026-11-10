'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/* Small motion helpers for Hubnovo World. All respect reduced motion. */

function prefersReducedMotion()
{
    if (typeof window === 'undefined') return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(document.querySelector('.hw-reduce'))
}

/** Counts from 0 (or the previous value) up to `value`. */
export function CountUp({ value, duration = 900, format = (n: number) => n.toLocaleString('en-NG') }: { value: number; duration?: number; format?: (n: number) => string })
{
    const [shown, setShown] = useState(value)
    const from = useRef(0)

    useEffect(() =>
    {
        if (prefersReducedMotion() || value === from.current) { setShown(value); from.current = value; return }
        const start = performance.now(), a = from.current, b = value
        let raf = 0
        const tick = (t: number) =>
        {
            const p = Math.min(1, (t - start) / duration)
            const eased = 1 - Math.pow(1 - p, 3)
            setShown(Math.round(a + (b - a) * eased))
            if (p < 1) raf = requestAnimationFrame(tick)
            else from.current = b
        }
        setShown(a)
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [value, duration])

    return <span className="tabular-nums">{format(shown)}</span>
}

/** A progress bar that fills from 0 on mount. `pct` is 0–100. */
export function AnimatedBar({ pct, color, className = 'h-2', track = 'bg-muted' }: { pct: number; color: string; className?: string; track?: string })
{
    const [w, setW] = useState(0)
    useEffect(() => { const t = requestAnimationFrame(() => setW(Math.max(0, Math.min(100, pct)))); return () => cancelAnimationFrame(t) }, [pct])
    return (
        <span className={`block overflow-hidden rounded-full ${track} ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <span className="hw-bar block h-full rounded-full" style={{ width: `${w}%`, backgroundColor: color }} />
        </span>
    )
}

const CONFETTI_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#F97316']

/** A one-off confetti burst from the centre of its (relative) parent. */
export function Confetti({ count = 36 }: { count?: number })
{
    const [on, setOn] = useState(false)
    useEffect(() => { if (!prefersReducedMotion()) setOn(true); const t = setTimeout(() => setOn(false), 1400); return () => clearTimeout(t) }, [])
    const pieces = useMemo(() => Array.from({ length: count }, (_, i) =>
    {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
        const dist = 90 + Math.random() * 140
        return {
            x: `${Math.cos(angle) * dist}px`,
            y: `${Math.sin(angle) * dist - 40}px`,
            r: `${Math.round(Math.random() * 720 - 360)}deg`,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            delay: `${Math.random() * 120}ms`,
        }
    }), [count])
    if (!on) return null
    return (
        <span aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-visible">
            {pieces.map((p, i) => (
                <span key={i} className="hw-confetti-piece" style={{ backgroundColor: p.color, animationDelay: p.delay, ['--x' as string]: p.x, ['--y' as string]: p.y, ['--r' as string]: p.r }} />
            ))}
        </span>
    )
}

/** Animated tick for "done" states. */
export function CheckMark({ className = 'h-4 w-4' }: { className?: string })
{
    return (
        <svg viewBox="0 0 24 24" className={`hw-check ${className}`} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
    )
}
