'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { ToastItem } from './toast-store'
import { pause, resume, requestDismiss, acknowledge } from './toast-store'
import { useSpring } from './useSpring'
import { triggerHaptic } from '@/lib/haptics'

const SWIPE_DISMISS_THRESHOLD = 80
const SWIPE_HAPTIC_THRESHOLD = 40

const TYPE_CONFIG = {
    success: {
        Icon: CheckCircle2,
        color: 'var(--color-emerald)',
        tint: 'color-mix(in srgb, var(--color-emerald) 8%, var(--color-card))',
        label: 'Success',
    },
    error: {
        Icon: XCircle,
        color: 'var(--color-destructive)',
        tint: 'color-mix(in srgb, var(--color-destructive) 8%, var(--color-card))',
        label: 'Error',
    },
    warning: {
        Icon: AlertTriangle,
        color: '#f59e0b',
        tint: 'color-mix(in srgb, #f59e0b 8%, var(--color-card))',
        label: 'Warning',
    },
    info: {
        Icon: Info,
        color: 'var(--color-cyan)',
        tint: 'color-mix(in srgb, var(--color-cyan) 8%, var(--color-card))',
        label: 'Info',
    },
} as const

interface ToastCardProps
{
    toast: ToastItem
    index: number
    targetY: number
    onHeight: (height: number) => void
}

export default function ToastCard({ toast: item, index, targetY, onHeight }: ToastCardProps)
{
    const config = TYPE_CONFIG[item.type]
    const { Icon } = config

    const cardRef = useRef<HTMLDivElement | null>(null)
    const [mounted, setMounted] = useState(false)
    const [dragX, setDragX] = useState(0)
    const [dragging, setDragging] = useState(false)
    const dragStartRef = useRef<{ x: number; pointerId: number } | null>(null)
    const flungHapticFired = useRef(false)

    const springY = useSpring(targetY, { stiffness: 180, damping: 20 }, targetY + 28)

    // Depth cue for cards further back in the stack (older, pushed up).
    const scale = 1 - Math.min(index, 2) * 0.03
    const opacity = item.leaving ? 0 : 1 - Math.min(index, 2) * 0.08

    useLayoutEffect(() =>
    {
        if (!cardRef.current) return
        onHeight(cardRef.current.offsetHeight)

        const observer = new ResizeObserver((entries) =>
        {
            const entry = entries[0]
            if (entry) onHeight(entry.contentRect.height)
        })
        observer.observe(cardRef.current)
        return () => observer.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() =>
    {
        const raf = requestAnimationFrame(() => setMounted(true))
        return () => cancelAnimationFrame(raf)
    }, [])

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>)
    {
        if ((e.target as HTMLElement).closest('[data-toast-close]')) return
        dragStartRef.current = { x: e.clientX, pointerId: e.pointerId }
        flungHapticFired.current = false
        setDragging(true)
        cardRef.current?.setPointerCapture(e.pointerId)
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>)
    {
        if (!dragStartRef.current || dragStartRef.current.pointerId !== e.pointerId) return
        const delta = e.clientX - dragStartRef.current.x
        setDragX(delta)

        if (!flungHapticFired.current && Math.abs(delta) > SWIPE_HAPTIC_THRESHOLD)
        {
            flungHapticFired.current = true
            triggerHaptic('light')
        }
    }

    function endDrag(e: React.PointerEvent<HTMLDivElement>)
    {
        if (!dragStartRef.current || dragStartRef.current.pointerId !== e.pointerId) return
        dragStartRef.current = null
        setDragging(false)

        if (Math.abs(dragX) > SWIPE_DISMISS_THRESHOLD)
        {
            requestDismiss(item.id, dragX > 0 ? 'right' : 'left')
        }
        else
        {
            setDragX(0)
        }
    }

    function handleBodyClick()
    {
        if (dragStartRef.current) return
        if (Math.abs(dragX) > 4) return
        if (item.type === 'error' && !item.acknowledged) acknowledge(item.id)
    }

    const exitX = item.leaving && item.exitDirection
        ? (item.exitDirection === 'right' ? 480 : -480)
        : dragX

    const entering = !mounted && !item.leaving

    return (
        // Outer "slot" — owns the spring-driven Y position + depth scale. The
        // spring hook already updates this every animation frame, so it must
        // NOT also carry a CSS transition on transform, or the two would
        // fight (CSS trying to ease toward a target that's already moving).
        <div
            className="absolute inset-x-0 bottom-0 w-full"
            style={{
                transform: `translate3d(0, ${-springY}px, 0) scale(${scale})`,
                opacity: entering ? 0 : opacity,
                zIndex: 10 - index,
                transition: 'opacity 220ms ease-out',
            }}
        >
            {/* Inner "drag" layer — owns X only, via direct pointer manipulation
                while dragging (no transition, 1:1 with the finger/cursor) and a
                spring-flavoured easing curve for the release/fling-off/snap-back. */}
            <div
                ref={cardRef}
                role={item.type === 'error' ? 'alert' : 'status'}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onMouseEnter={() => pause(item.id)}
                onMouseLeave={() => resume(item.id)}
                onClick={handleBodyClick}
                className="pointer-events-auto select-none touch-pan-y flex items-start gap-3 rounded-xl border border-border shadow-lg px-4 py-3.5"
                style={{
                    transform: `translateX(${exitX}px)`,
                    transition: dragging ? 'none' : `transform ${item.leaving ? '260ms' : '320ms'} cubic-bezier(0.34, 1.56, 0.64, 1)`,
                    background: config.tint,
                    borderLeft: `4px solid ${config.color}`,
                    cursor: item.type === 'error' && !item.acknowledged ? 'pointer' : 'grab',
                }}
            >
                <span
                    className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5"
                    style={{ background: `color-mix(in srgb, ${config.color} 16%, transparent)` }}
                >
                    <Icon className="w-4 h-4" style={{ color: config.color }} strokeWidth={2.4} />
                </span>

                <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-foreground leading-snug break-words">{item.message}</p>
                    {item.type === 'error' && !item.acknowledged && (
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">Tap to dismiss</p>
                    )}
                </div>

                <button
                    type="button"
                    data-toast-close
                    onClick={(e) => { e.stopPropagation(); requestDismiss(item.id) }}
                    aria-label="Dismiss notification"
                    className="shrink-0 p-1 -m-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}
