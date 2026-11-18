'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Maximize2, Pause, Play, X } from 'lucide-react'
import MuxPlayer from '@mux/mux-player-react/lazy'
import { PLAYBACK_MAX_RESOLUTION } from '@/lib/modushive/config'
import { useMiniPlayer } from './MiniPlayerContext'

/* ── Helpers ───────────────────────────────────────────────────────────────── */

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number)
{
    return Math.max(min, Math.min(max, value))
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function MiniPlayerOverlay()
{
    const { miniPlayer, clearMiniPlayer } = useMiniPlayer()
    const router = useRouter()
    const pathname = usePathname()

    /* ── Track if user has navigated away from the source watch page ── */
    const hasLeftSourceRef = useRef(false)

    useEffect(() =>
    {
        hasLeftSourceRef.current = false
    }, [miniPlayer?.playbackId])

    useEffect(() =>
    {
        if (!miniPlayer)
        {
            hasLeftSourceRef.current = false
            return
        }

        // If user is currently browsing other pages (e.g. /app/modushive, /app/feed)
        if (pathname !== miniPlayer.sourceUrl)
        {
            hasLeftSourceRef.current = true

            // If user has navigated to another watch page (live or video), dismiss mini player
            const isWatchPage = pathname.startsWith('/app/modushive/live/') ||
                (pathname.startsWith('/app/modushive/') && !['/app/modushive', '/app/modushive/studio', '/app/modushive/upload', '/app/modushive/earnings'].includes(pathname))
            if (isWatchPage)
            {
                clearMiniPlayer()
            }
        }
        else if (hasLeftSourceRef.current)
        {
            // Only auto-dismiss if user navigated away first, and has now returned to the original watch page
            clearMiniPlayer()
        }
    }, [pathname, miniPlayer, clearMiniPlayer])

    /* ── Drag state ── */
    const containerRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    /* ── Playback state (for direct video only) ── */
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPaused, setIsPaused] = useState(false)

    /* ── Reset position when mini-player opens ── */
    useEffect(() =>
    {
        if (miniPlayer) setPosition(null)
    }, [miniPlayer?.sourceUrl]) // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Drag handlers ── */
    const handlePointerDown = useCallback((e: React.PointerEvent) =>
    {
        // Only drag from the control bar area (data-drag-handle), not from buttons
        const target = e.target as HTMLElement
        if (target.closest('button') || target.closest('video') || target.closest('mux-player') || target.closest('iframe')) return

        e.preventDefault()
        const el = containerRef.current
        if (!el) return

        const rect = el.getBoundingClientRect()
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: rect.left,
            origY: rect.top,
        }
        setIsDragging(true)
        el.setPointerCapture(e.pointerId)
    }, [])

    const handlePointerMove = useCallback((e: React.PointerEvent) =>
    {
        if (!dragRef.current || !containerRef.current) return
        const el = containerRef.current
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        const newX = clamp(dragRef.current.origX + dx, 0, window.innerWidth - el.offsetWidth)
        const newY = clamp(dragRef.current.origY + dy, 0, window.innerHeight - el.offsetHeight)
        setPosition({ x: newX, y: newY })
    }, [])

    const handlePointerUp = useCallback((e: React.PointerEvent) =>
    {
        dragRef.current = null
        setIsDragging(false)
        containerRef.current?.releasePointerCapture(e.pointerId)
    }, [])

    /* ── Direct video play/pause ── */
    const togglePlayPause = useCallback(() =>
    {
        const video = videoRef.current
        if (!video) return
        if (video.paused) { video.play(); setIsPaused(false) }
        else { video.pause(); setIsPaused(true) }
    }, [])

    /* ── Expand: navigate back to the full watch page ── */
    const handleExpand = useCallback(() =>
    {
        if (!miniPlayer) return
        const url = miniPlayer.sourceUrl
        clearMiniPlayer()
        router.push(url)
    }, [miniPlayer, clearMiniPlayer, router])

    /* ── Don't render if nothing is minimized ── */
    if (!miniPlayer) return null

    /* ── Position styles: Tailwind default avoids bottom-nav on mobile and mascot on desktop; inline styles apply on drag ── */
    const positionClass = position
        ? ''
        : 'bottom-20 right-4 sm:right-6 sm:bottom-6 lg:bottom-6 lg:right-24'

    const positionStyle: React.CSSProperties = position
        ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
        : {}

    return (
        <div
            ref={containerRef}
            role="complementary"
            aria-label="Mini player"
            className={`fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl shadow-black/40 transition-shadow ${positionClass} ${isDragging ? 'shadow-3xl cursor-grabbing' : 'cursor-grab'}`}
            style={{
                width: 'clamp(280px, 24vw, 360px)',
                ...positionStyle,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {/* ── Video Area ── */}
            <div className="relative aspect-video w-full bg-black">
                {/* Overlay to prevent iframe/video from stealing pointer events during drag */}
                {isDragging && <div className="absolute inset-0 z-20 cursor-grabbing" />}
                {miniPlayer.type === 'mux' ? (
                    <MuxPlayer
                        playbackId={miniPlayer.playbackId}
                        tokens={miniPlayer.tokens}
                        streamType={miniPlayer.streamType ?? 'on-demand'}
                        maxResolution={miniPlayer.tokens ? undefined : PLAYBACK_MAX_RESOLUTION}
                        envKey={process.env.NEXT_PUBLIC_MUX_DATA_ENV_KEY}
                        title={miniPlayer.title}
                        accentColor="#0e6fdd"
                        autoPlay
                        className="block w-full h-full aspect-video"
                    />
                ) : miniPlayer.type === 'cloudflare' ? (
                    <iframe
                        src={`https://iframe.videodelivery.net/${miniPlayer.playbackId}?autoplay=true`}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowFullScreen
                        className="h-full w-full border-0"
                    />
                ) : (
                    /* direct <video> */
                    <video
                        ref={videoRef}
                        src={miniPlayer.playbackId}
                        autoPlay
                        playsInline
                        onPause={() => setIsPaused(true)}
                        onPlay={() => setIsPaused(false)}
                        className="h-full w-full object-contain"
                    />
                )}
            </div>

            {/* ── Control Bar ── */}
            <div
                data-drag-handle
                className="flex items-center gap-1.5 bg-card/95 backdrop-blur-md px-3 py-2"
            >
                {/* Play/Pause (only for direct video — Mux & CF iframes have built-in controls) */}
                {miniPlayer.type === 'direct' && (
                    <button
                        type="button"
                        onClick={togglePlayPause}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors"
                        aria-label={isPaused ? 'Play' : 'Pause'}
                    >
                        {isPaused
                            ? <Play className="h-3.5 w-3.5 fill-foreground text-foreground" />
                            : <Pause className="h-3.5 w-3.5 fill-foreground text-foreground" />}
                    </button>
                )}

                {/* Title & Creator */}
                <div className="flex-1 min-w-0 select-none">
                    <p className="truncate text-[11px] font-bold text-foreground leading-tight">
                        {miniPlayer.title}
                    </p>
                    {miniPlayer.creatorName && (
                        <p className="truncate text-[10px] text-muted-foreground leading-tight">
                            {miniPlayer.creatorName}
                        </p>
                    )}
                </div>

                {/* Expand (go back to full page) */}
                <button
                    type="button"
                    onClick={handleExpand}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors"
                    aria-label="Expand to full player"
                >
                    <Maximize2 className="h-3.5 w-3.5 text-foreground" />
                </button>

                {/* Close / Dismiss */}
                <button
                    type="button"
                    onClick={clearMiniPlayer}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-destructive/15 transition-colors"
                    aria-label="Close mini player"
                >
                    <X className="h-3.5 w-3.5 text-foreground" />
                </button>
            </div>
        </div>
    )
}

