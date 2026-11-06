'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { subscribe, getSnapshot } from './toast-store'
import ToastCard from './ToastCard'

const GAP = 10
const FALLBACK_HEIGHT = 64

/**
 * Mounted once in the root layout. Positions up to MAX_VISIBLE toasts
 * (enforced by the store — everything past that queues) in a fixed stack,
 * newest at the front/bottom. Real per-card heights are measured by
 * ToastCard and fed back here so the cumulative offset each card springs
 * to actually matches its neighbour's rendered height, not a guess.
 */
export default function ToastViewport()
{
    const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    const pathname = usePathname()
    const isAppShell = pathname?.startsWith('/app') ?? false

    const heightsRef = useRef<Map<string, number>>(new Map())
    const [, forceRerender] = useState(0)

    function reportHeight(id: string, height: number)
    {
        if (heightsRef.current.get(id) === height) return
        heightsRef.current.set(id, height)
        forceRerender((n) => n + 1)
    }

    let cumulative = 0
    const positioned = toasts.map((t, index) =>
    {
        const y = cumulative
        cumulative += (heightsRef.current.get(t.id) ?? FALLBACK_HEIGHT) + GAP
        return { toast: t, index, y }
    })

    if (toasts.length === 0) return null

    return (
        <div
            className={`fixed z-[100] left-3 right-3 sm:left-auto sm:right-6 sm:w-[380px] ${isAppShell ? 'bottom-20 lg:bottom-6' : 'bottom-4 sm:bottom-6'}`}
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
            aria-live="polite"
            aria-relevant="additions"
        >
            <div className="relative w-full">
                {positioned.map(({ toast: t, index, y }) => (
                    <ToastCard
                        key={t.id}
                        toast={t}
                        index={index}
                        targetY={y}
                        onHeight={(h) => reportHeight(t.id, h)}
                    />
                ))}
            </div>
        </div>
    )
}
