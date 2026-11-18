'use client'

import { useRouter } from 'next/navigation'
import { Minimize2 } from 'lucide-react'
import { useMiniPlayer, type MiniPlayerState } from './MiniPlayerContext'

interface MinimizeButtonProps
{
    /** The playback info to persist in the floating mini-player */
    playerState: MiniPlayerState
    className?: string
}

/**
 * A small pill button that pushes the current video into the floating
 * mini-player and navigates back to the NovoStream browse page.
 */
export default function MinimizeButton({ playerState, className }: MinimizeButtonProps)
{
    const { setMiniPlayer } = useMiniPlayer()
    const router = useRouter()

    return (
        <button
            type="button"
            onClick={() =>
            {
                setMiniPlayer(playerState)
                router.push('/app/modushive')
            }}
            className={
                className ??
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm'
            }
            aria-label="Minimize to mini-player"
        >
            <Minimize2 className="h-3.5 w-3.5 text-primary" />
            <span>Mini player</span>
        </button>
    )
}

