import { createServiceClient } from '@/lib/supabase/service'
import { getUploadLimits } from './config'
import { getMux, isMuxConfigured } from './mux'
import type { LiveStream, Video } from '@/lib/types'

/**
 * Applies Mux state to our rows. Used by the webhook (push) and by the
 * pages as a pull fallback, so status still moves forward when a webhook
 * can't reach us (localhost) or was missed.
 */

/** Minimal asset shape shared by webhook payloads and the assets API. */
export interface MuxAssetLike
{
    id: string
    status?: string
    duration?: number
    aspect_ratio?: string
    passthrough?: string
    playback_ids?: Array<{ id: string }>
    errors?: { messages?: string[] }
}

type VideoPatch = Partial<Pick<Video, 'status' | 'playback_id' | 'duration_s' | 'aspect_ratio' | 'error_message' | 'provider_asset_id'>>

/** Upload finished processing. Enforces the owner's duration limit using Mux's (trusted) duration. */
export async function applyAssetReady(videoId: string, asset: MuxAssetLike): Promise<VideoPatch | null>
{
    const supabase = createServiceClient()
    const { data: video } = await supabase
        .from('videos')
        .select('id, status, owner:users!videos_owner_id_fkey(role)')
        .eq('id', videoId)
        .maybeSingle()
    if (!video || video.status === 'ready') return null

    const owner = video.owner as unknown as { role?: string } | null
    const { maxDurationS } = getUploadLimits(owner?.role)
    const now = new Date().toISOString()

    let patch: VideoPatch
    if ((asset.duration ?? 0) > maxDurationS + 2)
    {
        await getMux().video.assets.delete(asset.id).catch(() => {})
        patch = { status: 'errored', error_message: `Longer than ${Math.round(maxDurationS / 60) || 1} min limit` }
    } else
    {
        patch = {
            status: 'ready',
            provider_asset_id: asset.id,
            playback_id: asset.playback_ids?.[0]?.id ?? null,
            duration_s: asset.duration ?? null,
            aspect_ratio: asset.aspect_ratio ?? null,
            error_message: null,
        }
    }

    await supabase.from('videos').update({ ...patch, updated_at: now }).eq('id', video.id)
    return patch
}

export async function applyAssetErrored(videoId: string, asset: MuxAssetLike): Promise<VideoPatch>
{
    const patch: VideoPatch = { status: 'errored', error_message: asset.errors?.messages?.join('; ') || 'Processing failed' }
    await createServiceClient()
        .from('videos')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', videoId)
    return patch
}

/** A live recording is complete — publish it as a replay video (idempotent on the asset id). */
export async function applyLiveRecording(liveStreamId: string, asset: MuxAssetLike): Promise<string | null>
{
    const supabase = createServiceClient()
    const { data: stream } = await supabase
        .from('live_streams')
        .select('id, host_id, title, description, playback_policy')
        .eq('id', liveStreamId)
        .maybeSingle()
    if (!stream) return null

    const now = new Date().toISOString()
    const { data: replay } = await supabase
        .from('videos')
        .upsert({
            owner_id: stream.host_id,
            title: stream.title,
            description: stream.description,
            kind: 'live_replay',
            status: 'ready',
            provider: 'mux',
            provider_asset_id: asset.id,
            playback_id: asset.playback_ids?.[0]?.id ?? null,
            playback_policy: stream.playback_policy,
            duration_s: asset.duration ?? null,
            aspect_ratio: asset.aspect_ratio ?? null,
            updated_at: now,
        }, { onConflict: 'provider_asset_id' })
        .select('id')
        .single()

    if (!replay) return null
    await supabase.from('live_streams').update({ replay_video_id: replay.id, updated_at: now }).eq('id', stream.id)
    return replay.id
}

type StreamPatch = Partial<Pick<LiveStream, 'status' | 'started_at' | 'ended_at' | 'replay_video_id'>>

export async function applyStreamActive(providerStreamId: string): Promise<StreamPatch>
{
    const now = new Date().toISOString()
    const patch: StreamPatch = { status: 'live', started_at: now, ended_at: null }
    await createServiceClient()
        .from('live_streams')
        .update({ ...patch, updated_at: now })
        .eq('provider_stream_id', providerStreamId)
        .neq('status', 'ended')
    return patch
}

export async function applyStreamIdle(providerStreamId: string): Promise<StreamPatch>
{
    const now = new Date().toISOString()
    const patch: StreamPatch = { status: 'ended', ended_at: now }
    await createServiceClient()
        .from('live_streams')
        .update({ ...patch, updated_at: now })
        .eq('provider_stream_id', providerStreamId)
        .eq('status', 'live')
    return patch
}

// ─── Pull fallback ───────────────────────────────────────────────────────────

/*
 * Pages that poll (ProcessingRefresher) would otherwise hit the Mux API on
 * every refresh for every viewer. One check per row per 10s per server
 * instance is plenty — webhooks remain the primary path.
 */
const THROTTLE_MS = 10_000
const lastChecked = new Map<string, number>()

function shouldCheck(id: string): boolean
{
    const now = Date.now()
    if (now - (lastChecked.get(id) ?? 0) < THROTTLE_MS) return false
    lastChecked.set(id, now)
    if (lastChecked.size > 500) lastChecked.delete(lastChecked.keys().next().value!)
    return true
}

/** Returns the video with any status change from Mux applied. */
export async function syncVideo<T extends Video>(video: T): Promise<T>
{
    if (video.status !== 'processing' || !video.provider_asset_id || !isMuxConfigured() || !shouldCheck(video.id)) return video
    try
    {
        const asset = await getMux().video.assets.retrieve(video.provider_asset_id)
        if (asset.status === 'ready') return { ...video, ...(await applyAssetReady(video.id, asset)) }
        if (asset.status === 'errored') return { ...video, ...(await applyAssetErrored(video.id, asset)) }
    } catch (err)
    {
        console.error('[modushive] video sync failed:', err)
    }
    return video
}

/** Returns the stream with any status change from Mux applied (go-live, end, replay). */
export async function syncLiveStream<T extends LiveStream>(stream: T): Promise<T>
{
    const needsReplay = stream.status === 'ended' && !stream.replay_video_id
    if ((stream.status === 'ended' && !needsReplay) || !stream.provider_stream_id || !isMuxConfigured() || !shouldCheck(stream.id)) return stream

    try
    {
        const mux = getMux()
        const remote = await mux.video.liveStreams.retrieve(stream.provider_stream_id)
        let patch: StreamPatch = {}

        if (stream.status === 'idle' && remote.status === 'active')
            patch = await applyStreamActive(stream.provider_stream_id)
        else if (stream.status === 'live' && remote.status !== 'active')
            patch = await applyStreamIdle(stream.provider_stream_id)

        const ended = (patch.status ?? stream.status) === 'ended'
        const assetId = remote.recent_asset_ids?.at(-1)
        if (ended && remote.status !== 'active' && !stream.replay_video_id && assetId)
        {
            const asset = await mux.video.assets.retrieve(assetId)
            if (asset.status === 'ready')
            {
                const replayId = await applyLiveRecording(stream.id, asset)
                if (replayId) patch.replay_video_id = replayId
            }
        }

        return { ...stream, ...patch }
    } catch (err)
    {
        console.error('[modushive] live stream sync failed:', err)
        return stream
    }
}
