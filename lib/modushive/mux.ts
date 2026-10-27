import Mux from '@mux/mux-node'
import { PLAYBACK_MAX_RESOLUTION } from './config'
import type { PlaybackPolicy, PlaybackTokens } from '@/lib/types'

/**
 * Server-only Mux helpers. Everything Mux-specific lives here so the rest of
 * ModusHive only deals with the provider-neutral columns on `videos` /
 * `live_streams` (provider, provider_asset_id, playback_id).
 */

let client: Mux | null = null

export function isMuxConfigured(): boolean
{
    return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET)
}

function isSigningConfigured(): boolean
{
    return Boolean(process.env.MUX_SIGNING_KEY_ID && process.env.MUX_SIGNING_KEY_PRIVATE)
}

export function getMux(): Mux
{
    if (!isMuxConfigured()) throw new Error('Mux is not configured (MUX_TOKEN_ID / MUX_TOKEN_SECRET)')
    if (!client)
    {
        client = new Mux({
            tokenId: process.env.MUX_TOKEN_ID,
            tokenSecret: process.env.MUX_TOKEN_SECRET,
            webhookSecret: process.env.MUX_WEBHOOK_SECRET,
            jwtSigningKey: process.env.MUX_SIGNING_KEY_ID,
            jwtPrivateKey: process.env.MUX_SIGNING_KEY_PRIVATE,
        })
    }
    return client
}

/** Policy for new assets/streams: signed whenever a signing key exists. */
export function defaultPlaybackPolicy(): PlaybackPolicy
{
    return isSigningConfigured() ? 'signed' : 'public'
}

/** Tokens for <MuxPlayer tokens>. Undefined for public playback IDs. */
export async function signPlayback(playbackId: string, policy: PlaybackPolicy): Promise<PlaybackTokens | undefined>
{
    if (policy !== 'signed') return undefined
    const mux = getMux()
    const [playback, thumbnail, storyboard] = await Promise.all([
        mux.jwt.signPlaybackId(playbackId, {
            type: 'video',
            expiration: '6h',
            params: { max_resolution: PLAYBACK_MAX_RESOLUTION },
        }),
        mux.jwt.signPlaybackId(playbackId, { type: 'thumbnail', expiration: '6h' }),
        mux.jwt.signPlaybackId(playbackId, { type: 'storyboard', expiration: '6h' }),
    ])
    return { playback, thumbnail, storyboard }
}

/**
 * Static thumbnail URL for grids — never a playing video (no autoplay on
 * listing pages keeps delivery cost down). For signed playback IDs the
 * query params have to live inside the token.
 */
export async function getThumbnailUrl(
    playbackId: string | null,
    policy: PlaybackPolicy,
    opts: { width?: number; time?: number } = {},
): Promise<string | null>
{
    if (!playbackId) return null
    const params: Record<string, string> = { width: String(opts.width ?? 640) }
    if (opts.time !== undefined) params.time = String(opts.time)

    if (policy !== 'signed') return `https://image.mux.com/${playbackId}/thumbnail.webp?${new URLSearchParams(params)}`

    try
    {
        const token = await getMux().jwt.signPlaybackId(playbackId, { type: 'thumbnail', expiration: '12h', params })
        return `https://image.mux.com/${playbackId}/thumbnail.webp?token=${token}`
    } catch
    {
        return null
    }
}
