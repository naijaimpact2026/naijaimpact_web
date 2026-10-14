'use client'

import MuxPlayer from '@mux/mux-player-react/lazy'
import { PLAYBACK_MAX_RESOLUTION } from '@/lib/modushive/config'
import type { PlaybackTokens } from '@/lib/types'

interface MuxVideoPlayerProps
{
    playbackId: string
    tokens?: PlaybackTokens
    title: string
    videoId: string
    viewerId?: string
    live?: boolean
}

/**
 * Thin wrapper around Mux Player. The lazy build keeps the player's JS out
 * of the page bundle until it's on screen. For signed playback the 720p cap
 * is inside the token; `maxResolution` covers public playback IDs.
 */
export default function MuxVideoPlayer({ playbackId, tokens, title, videoId, viewerId, live }: MuxVideoPlayerProps)
{
    return (
        <MuxPlayer
            playbackId={playbackId}
            tokens={tokens}
            streamType={live ? 'live' : 'on-demand'}
            maxResolution={tokens ? undefined : PLAYBACK_MAX_RESOLUTION}
            envKey={process.env.NEXT_PUBLIC_MUX_DATA_ENV_KEY}
            metadata={{ video_id: videoId, video_title: title, viewer_user_id: viewerId }}
            title={title}
            accentColor="#0e6fdd"
            autoPlay
            className="block w-full aspect-video overflow-hidden rounded-2xl bg-black"
        />
    )
}
