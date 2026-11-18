'use client'

import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react'

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface MiniPlayerState
{
    /** Player variant: Mux component, Cloudflare iframe, or plain <video> URL */
    type: 'mux' | 'cloudflare' | 'direct'
    /** Mux/Cloudflare playback ID, or the direct video src URL */
    playbackId: string
    /** Mux signed tokens (playback, storyboard, thumbnail) */
    tokens?: { playback?: string; storyboard?: string; thumbnail?: string }
    /** Mux stream type */
    streamType?: 'live' | 'on-demand'
    /** Video / stream title shown in the mini-player bar */
    title: string
    /** Full pathname to navigate back to on "expand" (e.g. /app/modushive/live/abc) */
    sourceUrl: string
    /** Creator display name */
    creatorName?: string
}

interface MiniPlayerContextValue
{
    miniPlayer: MiniPlayerState | null
    setMiniPlayer: (state: MiniPlayerState) => void
    clearMiniPlayer: () => void
}

/* ── Context ───────────────────────────────────────────────────────────────── */

const MiniPlayerContext = createContext<MiniPlayerContextValue>({
    miniPlayer: null,
    setMiniPlayer: () => {},
    clearMiniPlayer: () => {},
})

export function useMiniPlayer()
{
    return useContext(MiniPlayerContext)
}

/* ── Provider ──────────────────────────────────────────────────────────────── */

export function MiniPlayerProvider({ children }: { children: ReactNode })
{
    const [miniPlayer, setMiniPlayerState] = useState<MiniPlayerState | null>(null)

    const setMiniPlayer = useCallback((state: MiniPlayerState) =>
    {
        setMiniPlayerState(state)
    }, [])

    const clearMiniPlayer = useCallback(() =>
    {
        setMiniPlayerState(null)
    }, [])

    return (
        <MiniPlayerContext.Provider value={{ miniPlayer, setMiniPlayer, clearMiniPlayer }}>
            {children}
        </MiniPlayerContext.Provider>
    )
}

