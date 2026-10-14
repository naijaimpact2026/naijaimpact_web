'use server'

import { revalidatePath } from 'next/cache'
import { StreamChat } from 'stream-chat'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { ALLOWED_VIDEO_TYPES, MUX_RTMP_URL, formatBytes, getUploadLimits, normalizeRole } from '@/lib/modushive/config'
import { defaultPlaybackPolicy, getMux, isMuxConfigured } from '@/lib/modushive/mux'
import { deleteObject, getObjectSize, isR2Configured, presignDownload, presignUpload } from '@/lib/modushive/r2'

/*
 * ModusHive writes. Tables have SELECT-only RLS, so every write here goes
 * through the service-role client after the auth/ownership/role check.
 */

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const NOT_CONFIGURED = 'ModusHive uploads are not switched on yet. Please check back soon.'

const EXTENSIONS: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'video/x-m4v': 'm4v',
}

async function requireProfile()
{
    const { profile } = await getCurrentUser()
    if (!profile) throw new Error('Unauthorized')
    return profile
}

// ─── Uploads ─────────────────────────────────────────────────────────────────

interface CreateUploadInput
{
    title: string
    description?: string
    contentType: string
    sizeBytes: number
    /** Read client-side from the file's metadata; re-checked when Mux reports the real duration. */
    durationS: number
}

/** Step 1: create the `videos` row and hand back a presigned R2 PUT URL. */
export async function createVideoUpload(input: CreateUploadInput): Promise<ActionResult<{ videoId: string; uploadUrl: string }>>
{
    if (!isMuxConfigured() || !isR2Configured()) return { ok: false, error: NOT_CONFIGURED }

    const profile = await requireProfile()
    const limits = getUploadLimits(profile.role)
    const title = input.title.trim()

    if (!title) return { ok: false, error: 'Give your video a title.' }
    if (title.length > 120) return { ok: false, error: 'Title must be 120 characters or fewer.' }
    if (!ALLOWED_VIDEO_TYPES.includes(input.contentType)) return { ok: false, error: 'Upload an MP4, MOV or WebM video.' }
    if (input.sizeBytes > limits.maxBytes) return { ok: false, error: `Videos can be up to ${formatBytes(limits.maxBytes)}.` }
    if (input.durationS > limits.maxDurationS + 1) return { ok: false, error: `Videos can be up to ${Math.round(limits.maxDurationS / 60) || 1} min long.` }

    const supabase = createServiceClient()
    const videoId = crypto.randomUUID()
    const key = `videos/${profile.id}/${videoId}/original.${EXTENSIONS[input.contentType]}`

    const { error } = await supabase.from('videos').insert({
        id: videoId,
        owner_id: profile.id,
        title,
        description: input.description?.trim() || null,
        kind: 'short',
        status: 'uploading',
        provider: 'mux',
        playback_policy: defaultPlaybackPolicy(),
        source_r2_key: key,
        source_size_bytes: input.sizeBytes,
    })
    if (error)
    {
        console.error('[modushive] create video row failed:', error.message)
        return { ok: false, error: 'Could not start the upload. Please try again.' }
    }

    const uploadUrl = await presignUpload(key, input.contentType)
    return { ok: true, videoId, uploadUrl }
}

/** Step 2 (after the browser's PUT to R2 finishes): hand the original to Mux. */
export async function finalizeVideoUpload(videoId: string): Promise<ActionResult>
{
    if (!isMuxConfigured() || !isR2Configured()) return { ok: false, error: NOT_CONFIGURED }

    const profile = await requireProfile()
    const supabase = createServiceClient()

    const { data: video } = await supabase
        .from('videos')
        .select('id, owner_id, status, source_r2_key, playback_policy')
        .eq('id', videoId)
        .maybeSingle()

    if (!video || video.owner_id !== profile.id) return { ok: false, error: 'Video not found.' }
    if (video.status !== 'uploading' || !video.source_r2_key) return { ok: true }

    // Trust the bucket, not the client, for the final size.
    const size = await getObjectSize(video.source_r2_key)
    const limits = getUploadLimits(profile.role)
    if (size === null) return { ok: false, error: 'Upload did not complete. Please try again.' }
    if (size > limits.maxBytes)
    {
        await deleteObject(video.source_r2_key).catch(() => {})
        await supabase.from('videos').update({ status: 'errored', error_message: 'File too large' }).eq('id', videoId)
        return { ok: false, error: `Videos can be up to ${formatBytes(limits.maxBytes)}.` }
    }

    try
    {
        const asset = await getMux().video.assets.create({
            inputs: [{ url: await presignDownload(video.source_r2_key) }],
            playback_policies: [video.playback_policy],
            video_quality: 'basic',
            max_resolution_tier: '1080p',
            passthrough: videoId,
        })

        await supabase
            .from('videos')
            .update({ status: 'processing', provider_asset_id: asset.id, source_size_bytes: size, updated_at: new Date().toISOString() })
            .eq('id', videoId)
    } catch (err)
    {
        console.error('[modushive] mux asset create failed:', err)
        await supabase.from('videos').update({ status: 'errored', error_message: 'Processing could not start' }).eq('id', videoId)
        return { ok: false, error: 'We could not process this video. Please try again.' }
    }

    revalidatePath('/app/modushive')
    return { ok: true }
}

export async function deleteVideo(videoId: string): Promise<ActionResult>
{
    const profile = await requireProfile()
    const supabase = createServiceClient()

    const { data: video } = await supabase
        .from('videos')
        .select('id, owner_id, provider_asset_id, source_r2_key')
        .eq('id', videoId)
        .maybeSingle()

    if (!video) return { ok: false, error: 'Video not found.' }
    if (video.owner_id !== profile.id && normalizeRole(profile.role) !== 'admin') return { ok: false, error: 'You can only delete your own videos.' }

    // Best effort on the provider side — the row is what the app reads.
    if (video.provider_asset_id && isMuxConfigured())
        await getMux().video.assets.delete(video.provider_asset_id).catch((e) => console.error('[modushive] mux delete failed:', e))
    if (video.source_r2_key && isR2Configured())
        await deleteObject(video.source_r2_key).catch((e) => console.error('[modushive] r2 delete failed:', e))

    await supabase.from('videos').delete().eq('id', videoId)
    revalidatePath('/app/modushive')
    return { ok: true }
}

// ─── Live (admin only) ───────────────────────────────────────────────────────

async function requireAdmin()
{
    const profile = await requireProfile()
    if (normalizeRole(profile.role) !== 'admin') throw new Error('Only admins can manage live streams')
    return profile
}

function getStreamChatServer(): StreamChat | null
{
    const apiKey = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_KEY
    const apiSecret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET
    return apiKey && apiSecret ? StreamChat.getInstance(apiKey, apiSecret) : null
}

export async function createLiveStream(input: { title: string; description?: string }): Promise<ActionResult<{ id: string }>>
{
    if (!isMuxConfigured()) return { ok: false, error: 'Mux is not configured yet.' }

    const profile = await requireAdmin()
    const title = input.title.trim()
    if (!title) return { ok: false, error: 'Give the stream a title.' }

    const supabase = createServiceClient()
    const id = crypto.randomUUID()
    const policy = defaultPlaybackPolicy()

    let muxStream
    try
    {
        muxStream = await getMux().video.liveStreams.create({
            playback_policies: [policy],
            latency_mode: 'standard',
            reconnect_window: 60,
            max_continuous_duration: 4 * 60 * 60,
            // Mux copies this onto the recording asset too (new_asset_settings
            // can't set its own), which is how the webhook/sync recognise a
            // live recording and turn it into a replay video.
            passthrough: `live:${id}`,
            // Mux rejects 'basic' for live — 'plus' is the cheapest tier
            // allowed. Uploads stay on 'basic' (finalizeVideoUpload).
            new_asset_settings: {
                playback_policies: [policy],
                video_quality: 'plus',
            },
        })
    } catch (err)
    {
        console.error('[modushive] mux live stream create failed:', err)
        if (err instanceof Error && err.message.includes('free plan'))
            return { ok: false, error: 'Live streaming needs a paid Mux plan. Add a payment method in the Mux dashboard (Billing), then try again.' }
        return { ok: false, error: 'Could not create the live stream.' }
    }

    // Live chat — one Stream `livestream` channel per broadcast. Optional:
    // the stream works without it.
    let chatChannelId: string | null = `modushive-${id}`
    try
    {
        const chat = getStreamChatServer()
        if (!chat) throw new Error('Stream Chat not configured')
        await chat.upsertUser({ id: profile.id, name: profile.display_name, image: profile.avatar_url ?? undefined })
        await chat.channel('livestream', chatChannelId, { created_by_id: profile.id, name: title } as Record<string, unknown>).create()
    } catch (err)
    {
        console.error('[modushive] live chat channel create failed:', err)
        chatChannelId = null
    }

    const { error } = await supabase.from('live_streams').insert({
        id,
        host_id: profile.id,
        title,
        description: input.description?.trim() || null,
        status: 'idle',
        provider: 'mux',
        provider_stream_id: muxStream.id,
        playback_id: muxStream.playback_ids?.[0]?.id ?? null,
        playback_policy: policy,
        chat_channel_id: chatChannelId,
    })
    if (!error && muxStream.stream_key)
        await supabase.from('live_stream_keys').insert({ live_stream_id: id, stream_key: muxStream.stream_key })

    if (error)
    {
        console.error('[modushive] live stream row failed:', error.message)
        await getMux().video.liveStreams.delete(muxStream.id).catch(() => {})
        return { ok: false, error: 'Could not save the live stream.' }
    }

    revalidatePath('/app/modushive/studio')
    return { ok: true, id }
}

export async function getLiveStreamKey(liveStreamId: string): Promise<ActionResult<{ rtmpUrl: string; streamKey: string }>>
{
    await requireAdmin()
    const { data } = await createServiceClient()
        .from('live_stream_keys')
        .select('stream_key')
        .eq('live_stream_id', liveStreamId)
        .maybeSingle()

    if (!data) return { ok: false, error: 'Stream key not found.' }
    return { ok: true, rtmpUrl: MUX_RTMP_URL, streamKey: data.stream_key }
}

export async function endLiveStream(liveStreamId: string): Promise<ActionResult>
{
    await requireAdmin()
    const supabase = createServiceClient()

    const { data: stream } = await supabase
        .from('live_streams')
        .select('id, provider_stream_id, status')
        .eq('id', liveStreamId)
        .maybeSingle()

    if (!stream) return { ok: false, error: 'Live stream not found.' }
    if (stream.status === 'ended') return { ok: true }

    // complete() ends the broadcast now (no reconnect window); disable()
    // makes the key unusable so the stream can't be restarted by mistake.
    if (stream.provider_stream_id && isMuxConfigured())
    {
        const mux = getMux()
        await mux.video.liveStreams.complete(stream.provider_stream_id).catch(() => {})
        await mux.video.liveStreams.disable(stream.provider_stream_id).catch((e) => console.error('[modushive] mux disable failed:', e))
    }

    await supabase
        .from('live_streams')
        .update({ status: 'ended', ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', liveStreamId)
    await supabase.from('live_stream_keys').delete().eq('live_stream_id', liveStreamId)

    revalidatePath('/app/modushive')
    revalidatePath('/app/modushive/studio')
    return { ok: true }
}
