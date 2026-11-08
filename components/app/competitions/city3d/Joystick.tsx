'use client'

import { useRef, useState } from 'react'

/** On-screen joystick for touch devices. Reports -1..1 per axis (y down = +1). */
export default function Joystick({ onMove }: { onMove: (x: number, y: number) => void })
{
    const baseRef = useRef<HTMLDivElement>(null)
    const [knob, setKnob] = useState({ x: 0, y: 0 })
    const active = useRef<number | null>(null)
    const R = 40

    function update(e: React.PointerEvent)
    {
        const rect = baseRef.current!.getBoundingClientRect()
        let dx = e.clientX - (rect.left + rect.width / 2)
        let dy = e.clientY - (rect.top + rect.height / 2)
        const len = Math.hypot(dx, dy)
        if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R }
        setKnob({ x: dx, y: dy })
        onMove(dx / R, dy / R)
    }

    function end()
    {
        active.current = null
        setKnob({ x: 0, y: 0 })
        onMove(0, 0)
    }

    return (
        <div
            ref={baseRef}
            className="absolute bottom-4 left-4 h-28 w-28 touch-none select-none rounded-full bg-black/20 ring-2 ring-white/40 backdrop-blur-sm"
            onPointerDown={(e) => { active.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); update(e) }}
            onPointerMove={(e) => { if (active.current === e.pointerId) update(e) }}
            onPointerUp={end}
            onPointerCancel={end}
            aria-hidden="true"
        >
            <div
                className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/90 shadow-lg"
                style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
            />
        </div>
    )
}
