import { NextResponse } from 'next/server'
import { getRequestUser, type RequestUser } from '@/lib/supabase/request-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { runAsProfile } from './acting-profile'
import { rateLimit, RATE_LIMITED } from '@/lib/rate-limit'
import { isMuxConfigured, signPlayback } from './mux'
import type { LiveStream, User, Video } from '@/lib/types'

/*
 * Shared plumbing for the ModusHive REST API (app/api/modushive), which the
 * mobile app calls with `Authorization: Bearer <supabase access token>`.
 * Writes reuse the server actions in lib/actions/modushive.ts so web and
 * mobile enforce exactly the same limits.
 */

export type ApiContext = RequestUser & { profile: User }

export const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status })

/** Resolves the caller, then runs the handler (and any actions it calls) as them. */
export async function withProfile(request: Request, handler: (ctx: ApiContext) => Promise<Response>): Promise<Response>
{
    try
    {
        const ctx = await getRequestUser(request)
        if (!ctx.authUser) return jsonError('Unauthorized', 401)
        if (!ctx.profile) return jsonError('Finish setting up your profile first.', 403)
        if (!(await rateLimit(`modushive:${ctx.profile.id}`, 120, 60, { failOpen: true })))
            return jsonError(RATE_LIMITED, 429)
        return await runAsProfile(ctx.profile, () => handler(ctx as ApiContext))
    } catch (err)
    {
        console.error('[modushive-api] request failed:', err)
        return jsonError('Something went wrong. Please try again.', 500)
    }
}

/** Turns a server action result into a response: 200 with the fields, or 4xx with { error }. */
export function fromAction(result: { ok: true } | { ok: false; error: string }): Response
{
    if (result.ok) return NextResponse.json(result)
    return jsonError(result.error, /not found/i.test(result.error) ? 404 : 400)
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null>
{
    try
    {
        const body = await request.json()
        return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null
    } catch
    {
        return null
    }
}

export interface Playback
{
    provider: 'mux' | 'cloudflare'
    /** HLS manifest, ready to hand to the player (token already applied). */
    hlsUrl: string
    posterUrl: string | null
}

async function muxPlayback(playbackId: string, policy: Video['playback_policy']): Promise<Playback | null>
{
    if (!isMuxConfigured()) return null
    const tokens = await signPlayback(playbackId, policy)
    return {
        provider: 'mux',
        hlsUrl: `https://stream.mux.com/${playbackId}.m3u8${tokens ? `?token=${tokens.playback}` : ''}`,
        posterUrl: `https://image.mux.com/${playbackId}/thumbnail.webp${tokens ? `?token=${tokens.thumbnail}` : ''}`,
    }
}

/** Playback for a ready video, or null while it's still processing. */
export async function videoPlayback(video: Video): Promise<Playback | null>
{
    if (video.status !== 'ready' || !video.playback_id) return null
    return muxPlayback(video.playback_id, video.playback_policy)
}

/** Playback for a stream that is live right now, or null. */
export async function livePlayback(stream: LiveStream): Promise<Playback | null>
{
    if (stream.status !== 'live' || !stream.playback_id) return null
    if (stream.provider !== 'cloudflare') return muxPlayback(stream.playback_id, stream.playback_policy)

    // Cloudflare playback is public; the HLS URL saved at creation is the
    // canonical one (customer subdomain), with the generic domain as fallback.
    const { data } = await createServiceClient()
        .from('live_stream_keys')
        .select('stream_key')
        .eq('live_stream_id', stream.id)
        .maybeSingle()

    let hlsUrl = ''
    try { hlsUrl = data ? JSON.parse(data.stream_key).hlsUrl ?? '' : '' } catch { /* Mux-style plain key */ }

    return {
        provider: 'cloudflare',
        hlsUrl: hlsUrl || `https://videodelivery.net/${stream.playback_id}/manifest/video.m3u8`,
        posterUrl: `https://videodelivery.net/${stream.playback_id}/thumbnails/thumbnail.jpg`,
    }
}
