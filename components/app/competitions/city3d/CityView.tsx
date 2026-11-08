'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Crosshair, Loader2 } from 'lucide-react'
import Joystick from './Joystick'
import type { CityZone } from './CityScene'

// three.js + models only load here, on the client, when the City view is open.
const CityScene = dynamic(() => import('./CityScene'), { ssr: false })

interface Props
{
    zones: CityZone[]
    character: number
    themeColor: string
    paused: boolean
    onZoneEnter: (key: string) => void
    onError: () => void
}

const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'])

export default function CityView({ zones, character, themeColor, paused, onZoneEnter, onError }: Props)
{
    const wrapRef = useRef<HTMLDivElement>(null)
    const keys = useRef(new Set<string>())
    const joystick = useRef({ x: 0, y: 0 })
    const [ready, setReady] = useState(false)
    const [touch, setTouch] = useState(false)
    const [recenter, setRecenter] = useState(0)
    const enterRef = useRef(onZoneEnter)
    enterRef.current = onZoneEnter

    useEffect(() => { setTouch(window.matchMedia('(pointer: coarse)').matches) }, [])
    useEffect(() => { if (paused) { keys.current.clear(); joystick.current = { x: 0, y: 0 } } }, [paused])

    const handleReady = useCallback(() => setReady(true), [])
    const handleEnter = useCallback((k: string) => enterRef.current(k), [])

    return (
        <div
            ref={wrapRef}
            tabIndex={0}
            aria-label="Competition city. Use arrow keys or WASD to walk, drag to rotate, scroll or pinch to zoom, tap a building to go there."
            className="relative h-[78vh] min-h-[460px] max-h-[920px] w-full overflow-hidden rounded-3xl border border-border bg-[#bfe6f7] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary touch-none"
            onPointerDown={() => wrapRef.current?.focus({ preventScroll: true })}
            onKeyDown={(e) =>
            {
                const k = e.key.toLowerCase()
                if (!MOVE_KEYS.has(k) || paused) return
                e.preventDefault()
                keys.current.add(k)
            }}
            onKeyUp={(e) => keys.current.delete(e.key.toLowerCase())}
            onBlur={() => keys.current.clear()}
        >
            <CityScene
                zones={zones}
                character={character}
                themeColor={themeColor}
                paused={paused}
                onZoneEnter={handleEnter}
                onReady={handleReady}
                onError={onError}
                joystick={joystick}
                keys={keys}
                recenter={recenter}
            />

            {!ready && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#bfe6f7] text-[#102A43]">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <p className="text-sm font-semibold">Building the city…</p>
                </div>
            )}
            {ready && (
                <>
                    <p className="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                        {touch ? 'Tap to walk · drag to look around · tap a building' : 'Click or WASD to walk · drag to rotate · scroll to zoom'}
                    </p>
                    <button
                        type="button"
                        onClick={() => setRecenter((n) => n + 1)}
                        aria-label="Centre on me"
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#102A43] shadow-md hover:bg-white"
                    >
                        <Crosshair className="h-4 w-4" />
                    </button>
                </>
            )}
            {ready && touch && !paused && <Joystick onMove={(x, y) => { joystick.current = { x, y } }} />}
        </div>
    )
}
