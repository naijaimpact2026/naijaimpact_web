'use server'

import { revalidatePath } from 'next/cache'
import { StreamChat } from 'stream-chat'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { ALLOWED_VIDEO_TYPES, MUX_RTMP_URL, canGoLive, formatBytes, getLiveLimits, getUploadLimits, normalizeRole } from '@/lib/modushive/config'
import { defaultPlaybackPolicy, getMux, isMuxConfigured } from '@/lib/modushive/mux'
import { deleteObject, getObjectSize, isR2Configured, presignDownload, presignUpload } from '@/lib/modushive/r2'
import { createCloudflareLiveInput, deleteCloudflareLiveInput, deleteCloudflareVideo, getCloudflareLiveInput, getCloudflareLiveInputVideos, isCloudflareStreamConfigured } from '@/lib/modushive/cloudflare'
import { getActingProfile } from '@/lib/modushive/acting-profile'

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
    // Set by the mobile API routes after verifying the bearer token.
    const acting = getActingProfile()
    if (acting) return acting

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

    const startOfToday = new Date()
    startOfToday.setUTCHours(0, 0, 0, 0)
    const { count: todayUploads } = await supabase
        .from('videos')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', profile.id)
        .gte('created_at', startOfToday.toISOString())
        .neq('status', 'errored')

    if ((todayUploads ?? 0) >= limits.maxDailyUploads)
    {
        return {
            ok: false,
            error: `You have reached your daily upload limit of ${limits.maxDailyUploads} ${limits.maxDailyUploads === 1 ? 'video' : 'videos'}. Please try again tomorrow.`,
        }
    }

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

    const uploadUrl = await presignUpload(key, input.contentType, input.sizeBytes)
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
        .select('id, owner_id, provider, provider_asset_id, source_r2_key')
        .eq('id', videoId)
        .maybeSingle()

    if (!video) return { ok: false, error: 'Video not found.' }
    if (video.owner_id !== profile.id && normalizeRole(profile.role) !== 'admin') return { ok: false, error: 'You can only delete your own videos.' }

    // Best effort on the provider side — the row is what the app reads.
    if (video.provider === 'mux' && video.provider_asset_id && isMuxConfigured()) {
        await getMux().video.assets.delete(video.provider_asset_id).catch((e) => console.error('[modushive] mux delete failed:', e))
    } else if (video.provider === 'cloudflare' && isCloudflareStreamConfigured() && video.provider_asset_id) {
        await deleteCloudflareVideo(video.provider_asset_id).catch((e) => console.error('[modushive] cloudflare delete failed:', e))
    }

    if (video.source_r2_key && isR2Configured()) {
        await deleteObject(video.source_r2_key).catch((e) => console.error('[modushive] r2 delete failed:', e))
    }

    // Unlink any live stream replay reference
    await supabase.from('live_streams').update({ replay_video_id: null }).eq('replay_video_id', videoId)

    await supabase.from('videos').delete().eq('id', videoId)
    revalidatePath('/app/modushive')
    return { ok: true }
}

// ─── Live ────────────────────────────────────────────────────────────────────
// Who may go live is LIVE_STREAM_ROLES in lib/modushive/config.ts. A stream's
// key and End button belong to its host; admins can manage any stream.

/** Loads the stream if the caller is its host or an admin; null otherwise. */
async function getOwnStream(liveStreamId: string)
{
    const profile = await requireProfile()
    const { data: stream } = await createServiceClient()
        .from('live_streams')
        .select('*')
        .eq('id', liveStreamId)
        .maybeSingle()

    if (!stream) return null
    if (stream.host_id !== profile.id && normalizeRole(profile.role) !== 'admin') return null
    return stream
}

function getStreamChatServer(): StreamChat | null
{
    const apiKey = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_KEY
    const apiSecret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET
    return apiKey && apiSecret ? StreamChat.getInstance(apiKey, apiSecret) : null
}

export async function createLiveStream(input: {
    title: string
    description?: string
    isPaid?: boolean
    ticketPrice?: number
    workshopTopics?: string[]
    scheduledFor?: string | null
}): Promise<ActionResult<{ id: string }>>
{
    const canUseCF = isCloudflareStreamConfigured()
    const canUseMux = isMuxConfigured()
    if (!canUseCF && !canUseMux) return { ok: false, error: 'Live streaming is not configured yet.' }

    const profile = await requireProfile()
    if (!canGoLive(profile.role)) return { ok: false, error: 'Live streaming is not available on your account yet.' }

    const title = input.title.trim()
    if (!title) return { ok: false, error: 'Give the stream a title.' }

    const supabase = createServiceClient()
    const limits = getLiveLimits(profile.role)

    const { count: openStreams } = await supabase
        .from('live_streams')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', profile.id)
        .neq('status', 'ended')
    if ((openStreams ?? 0) >= limits.maxOpenStreams)
    {
        return {
            ok: false,
            error: limits.maxOpenStreams === 1
                ? 'You already have a stream set up. End it before creating a new one.'
                : `You can have up to ${limits.maxOpenStreams} streams set up at once. End one before creating another.`,
        }
    }

    // Daily live minutes quota check
    const startOfToday = new Date()
    startOfToday.setUTCHours(0, 0, 0, 0)
    const { data: todayStreams } = await supabase
        .from('live_streams')
        .select('started_at, ended_at, status')
        .eq('host_id', profile.id)
        .gte('created_at', startOfToday.toISOString())

    let totalStreamedSeconds = 0
    const nowMs = Date.now()
    if (todayStreams)
    {
        for (const s of todayStreams)
        {
            if (s.started_at)
            {
                const start = new Date(s.started_at).getTime()
                const end = s.ended_at ? new Date(s.ended_at).getTime() : nowMs
                totalStreamedSeconds += Math.max(0, Math.floor((end - start) / 1000))
            }
        }
    }

    const streamedMinutes = Math.floor(totalStreamedSeconds / 60)
    if (streamedMinutes >= limits.maxDailyMinutes)
    {
        return {
            ok: false,
            error: `You have reached your daily live streaming limit of ${limits.maxDailyMinutes} minutes. Please try again tomorrow.`,
        }
    }

    const id = crypto.randomUUID()
    const policy = defaultPlaybackPolicy()

    const provider: 'cloudflare' | 'mux' = canUseCF ? 'cloudflare' : 'mux'
    let providerStreamId: string | null = null
    let playbackId: string | null = null
    let streamKeyData: string = ''

    if (provider === 'cloudflare')
    {
        try
        {
            const cf = await createCloudflareLiveInput(title, limits.allowRecording)
            providerStreamId = cf.uid
            playbackId = cf.uid
            streamKeyData = JSON.stringify({
                provider: 'cloudflare',
                whipUrl: cf.whipUrl,
                hlsUrl: cf.hlsUrl,
                rtmpsUrl: cf.rtmpsUrl,
                streamKey: cf.streamKey,
            })
        } catch (err)
        {
            console.error('[modushive] cloudflare stream create failed:', err)
            return { ok: false, error: 'Could not create the live stream on Cloudflare. Please check your Cloudflare Stream subscription.' }
        }
    } else
    {
        try
        {
            const remainingDailySeconds = (limits.maxDailyMinutes - streamedMinutes) * 60
            const maxContinuousSeconds = Math.min(limits.maxDurationS, remainingDailySeconds)

            const muxStream = await getMux().video.liveStreams.create({
                playback_policies: [policy],
                latency_mode: 'standard',
                reconnect_window: limits.allowRecording ? 60 : 0,
                max_continuous_duration: Math.max(60, maxContinuousSeconds),
                passthrough: `live:${id}`,
                ...(limits.allowRecording ? {
                    new_asset_settings: {
                        playback_policies: [policy],
                        video_quality: 'basic',
                    },
                } : {}),
            })
            providerStreamId = muxStream.id
            playbackId = muxStream.playback_ids?.[0]?.id ?? null
            streamKeyData = muxStream.stream_key || ''
        } catch (err)
        {
            console.error('[modushive] mux live stream create failed:', err)
            if (err instanceof Error && err.message.includes('free plan'))
                return { ok: false, error: 'Live streaming needs a paid Mux plan. Add a payment method in the Mux dashboard (Billing), then try again.' }
            return { ok: false, error: 'Could not create the live stream.' }
        }
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

    const isPaid = Boolean(input.isPaid && (input.ticketPrice ?? 0) > 0)
    const ticketPrice = isPaid ? Number(input.ticketPrice ?? 0) : 0
    const workshopTopics = Array.isArray(input.workshopTopics) ? input.workshopTopics.filter(Boolean) : []
    const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor).toISOString() : null

    const { error } = await supabase.from('live_streams').insert({
        id,
        host_id: profile.id,
        title,
        description: input.description?.trim() || null,
        status: 'idle',
        provider,
        provider_stream_id: providerStreamId,
        playback_id: playbackId,
        playback_policy: provider === 'cloudflare' ? 'public' : policy,
        chat_channel_id: chatChannelId,
        is_paid: isPaid,
        ticket_price: ticketPrice,
        currency: 'NGN',
        workshop_topics: workshopTopics,
        scheduled_for: scheduledFor,
    })
    if (!error && streamKeyData)
        await supabase.from('live_stream_keys').insert({ live_stream_id: id, stream_key: streamKeyData })

    if (error)
    {
        console.error('[modushive] live stream row failed:', error.message)
        if (provider === 'cloudflare' && providerStreamId)
        {
            await deleteCloudflareLiveInput(providerStreamId).catch(() => {})
        } else if (providerStreamId)
        {
            await getMux().video.liveStreams.delete(providerStreamId).catch(() => {})
        }
        return { ok: false, error: 'Could not save the live stream.' }
    }

    revalidatePath('/app/modushive/studio')
    return { ok: true, id }
}

export async function getLiveStreamKey(liveStreamId: string): Promise<ActionResult<{
    rtmpUrl: string
    streamKey: string
    whipUrl?: string
    hlsUrl?: string
    provider: 'cloudflare' | 'mux'
}>>
{
    const stream = await getOwnStream(liveStreamId)
    if (!stream) return { ok: false, error: 'Live stream not found.' }

    const { data } = await createServiceClient()
        .from('live_stream_keys')
        .select('stream_key')
        .eq('live_stream_id', liveStreamId)
        .maybeSingle()

    if (!data) return { ok: false, error: 'Stream credentials not found.' }

    try
    {
        const parsed = JSON.parse(data.stream_key)
        if (parsed.whipUrl)
        {
            return {
                ok: true,
                provider: 'cloudflare',
                whipUrl: parsed.whipUrl,
                hlsUrl: parsed.hlsUrl,
                rtmpUrl: parsed.rtmpsUrl,
                streamKey: parsed.streamKey,
            }
        }
    } catch {}

    return {
        ok: true,
        provider: 'mux',
        rtmpUrl: MUX_RTMP_URL,
        streamKey: data.stream_key,
    }
}

export async function markLiveStreamActive(liveStreamId: string): Promise<ActionResult>
{
    const stream = await getOwnStream(liveStreamId)
    if (!stream) return { ok: false, error: 'Live stream not found.' }

    const now = new Date().toISOString()
    await createServiceClient()
        .from('live_streams')
        .update({ status: 'live', started_at: now, updated_at: now })
        .eq('id', liveStreamId)

    revalidatePath('/app/modushive')
    revalidatePath('/app/modushive/studio')
    revalidatePath(`/app/modushive/live/${liveStreamId}`)
    return { ok: true }
}

export async function endLiveStream(liveStreamId: string): Promise<ActionResult>
{
    const stream = await getOwnStream(liveStreamId)
    if (!stream) return { ok: false, error: 'Live stream not found.' }

    const supabase = createServiceClient()
    if (stream.status === 'ended') return { ok: true }

    let replayVideoId: string | null = stream.replay_video_id || null

    if (stream.provider === 'cloudflare' && stream.provider_stream_id && isCloudflareStreamConfigured())
    {
        // Check if Cloudflare already produced a recorded video asset for this broadcast
        try {
            const recordedVideos = await getCloudflareLiveInputVideos(stream.provider_stream_id)
            const latestVideo = recordedVideos[0]
            if (latestVideo?.uid) {
                const now = new Date().toISOString()
                const { data: replay } = await supabase
                    .from('videos')
                    .upsert({
                        owner_id: stream.host_id,
                        title: stream.title,
                        description: stream.description,
                        kind: 'live_replay',
                        status: 'ready',
                        provider: 'cloudflare',
                        provider_asset_id: latestVideo.uid,
                        playback_id: latestVideo.uid,
                        playback_policy: 'public',
                        duration_s: latestVideo.duration ?? null,
                        updated_at: now,
                    }, { onConflict: 'provider_asset_id' })
                    .select('id')
                    .single()

                if (replay) replayVideoId = replay.id
            }
        } catch (err) {
            console.error('[modushive] checking cloudflare recorded video error:', err)
        }
        // Note: We do NOT delete the live input here to preserve any in-flight recordings.
    } else if (stream.provider_stream_id && isMuxConfigured())
    {
        const mux = getMux()
        await mux.video.liveStreams.complete(stream.provider_stream_id).catch(() => {})
        await mux.video.liveStreams.disable(stream.provider_stream_id).catch((e) => console.error('[modushive] mux disable failed:', e))
    }

    const now = new Date().toISOString()
    await supabase
        .from('live_streams')
        .update({
            status: 'ended',
            ended_at: now,
            updated_at: now,
            ...(replayVideoId ? { replay_video_id: replayVideoId } : {}),
        })
        .eq('id', liveStreamId)
    await supabase.from('live_stream_keys').delete().eq('live_stream_id', liveStreamId)

    revalidatePath('/app/modushive')
    revalidatePath('/app/modushive/studio')
    revalidatePath(`/app/modushive/live/${liveStreamId}`)
    return { ok: true }
}

/** Deletes a live stream, cleaning up any remote inputs and database records. */
export async function deleteLiveStream(liveStreamId: string): Promise<ActionResult>
{
    const stream = await getOwnStream(liveStreamId)
    if (!stream) return { ok: false, error: 'Live stream not found or unauthorized.' }

    const supabase = createServiceClient()

    // 1. Clean up provider live input
    if (stream.provider === 'cloudflare' && stream.provider_stream_id && isCloudflareStreamConfigured()) {
        await deleteCloudflareLiveInput(stream.provider_stream_id).catch(() => {})
    } else if (stream.provider_stream_id && isMuxConfigured()) {
        await getMux().video.liveStreams.delete(stream.provider_stream_id).catch(() => {})
    }

    // 2. Delete linked records
    await supabase.from('live_stream_keys').delete().eq('live_stream_id', liveStreamId)
    await supabase.from('live_shopping_pinned_products').delete().eq('live_stream_id', liveStreamId)
    await supabase.from('live_stream_tickets').delete().eq('live_stream_id', liveStreamId)

    // 3. Delete live_streams row
    const { error } = await supabase.from('live_streams').delete().eq('id', liveStreamId)
    if (error) {
        console.error('[modushive] deleteLiveStream error:', error)
        return { ok: false, error: 'Could not delete live stream. Please try again.' }
    }

    revalidatePath('/app/modushive')
    revalidatePath('/app/modushive/studio')
    revalidatePath(`/app/modushive/live/${liveStreamId}`)
    return { ok: true }
}

/** Saves a canvas snapshot captured during broadcast as the stream's poster/thumbnail */
export async function saveLiveStreamThumbnail(liveStreamId: string, thumbnailUrl: string): Promise<ActionResult>
{
    if (!thumbnailUrl || typeof thumbnailUrl !== 'string') {
        return { ok: false, error: 'Invalid thumbnail URL' }
    }

    const stream = await getOwnStream(liveStreamId)
    if (!stream) return { ok: false, error: 'Live stream not found or unauthorized' }

    const supabase = createServiceClient()
    const { error } = await supabase
        .from('live_streams')
        .update({
            thumbnail_url: thumbnailUrl,
            updated_at: new Date().toISOString(),
        })
        .eq('id', liveStreamId)

    if (error) {
        // If column doesn't exist yet prior to migration, ignore without crashing
        console.warn('[modushive] thumbnail_url update notice:', error.message)
    }

    revalidatePath('/app/modushive')
    revalidatePath('/app/modushive/studio')
    revalidatePath(`/app/modushive/live/${liveStreamId}`)
    return { ok: true }
}

/** Publishes an ended live stream as an on-demand video in the creator's channel */
export async function publishStreamAsVideo(
    liveStreamId: string,
    input?: { title?: string; description?: string }
): Promise<ActionResult<{ videoId: string }>>
{
    const stream = await getOwnStream(liveStreamId)
    if (!stream) return { ok: false, error: 'Live stream not found.' }

    const supabase = createServiceClient()
    const now = new Date().toISOString()
    const videoTitle = (input?.title || stream.title).trim().slice(0, 120)

    // If stream already has a replay video record linked
    if (stream.replay_video_id) {
        await supabase
            .from('videos')
            .update({
                title: videoTitle,
                description: input?.description !== undefined ? input.description : stream.description,
                status: 'ready',
                updated_at: now,
            })
            .eq('id', stream.replay_video_id)

        revalidatePath('/app/modushive')
        revalidatePath('/app/modushive/studio')
        return { ok: true, videoId: stream.replay_video_id }
    }

    const videoId = crypto.randomUUID()

    // Check if Cloudflare produced an on-demand recorded video for this live input
    let finalPlaybackId = stream.playback_id
    let finalProviderAssetId = stream.provider_stream_id || videoId
    if (stream.provider === 'cloudflare' && stream.provider_stream_id && isCloudflareStreamConfigured()) {
        const cfVideos = await getCloudflareLiveInputVideos(stream.provider_stream_id).catch(() => [])
        if (cfVideos && cfVideos.length > 0 && cfVideos[0]?.uid) {
            finalPlaybackId = cfVideos[0].uid
            finalProviderAssetId = cfVideos[0].uid
        }
    }

    // Otherwise create the video row
    const { data: video, error } = await supabase
        .from('videos')
        .insert({
            id: videoId,
            owner_id: stream.host_id,
            title: videoTitle,
            description: input?.description !== undefined ? input.description : stream.description,
            kind: 'live_replay',
            status: 'ready',
            provider: stream.provider,
            provider_asset_id: finalProviderAssetId,
            playback_id: finalPlaybackId,
            playback_policy: stream.playback_policy || 'public',
            updated_at: now,
        })
        .select('id')
        .single()

    if (error || !video) {
        console.error('[modushive] publishStreamAsVideo insert error:', error)
        return { ok: false, error: 'Could not publish video. Please try again.' }
    }

    // Link replay_video_id to live stream
    await supabase
        .from('live_streams')
        .update({
            replay_video_id: video.id,
            updated_at: now,
        })
        .eq('id', liveStreamId)

    revalidatePath('/app/modushive')
    revalidatePath('/app/modushive/studio')
    revalidatePath(`/app/modushive/live/${liveStreamId}`)
    return { ok: true, videoId: video.id }
}

/** Initiates upload of a recorded stream file (e.g. from local MediaRecorder or disk) */
export async function createStreamRecordingUpload(
    liveStreamId: string,
    input: { contentType: string; sizeBytes: number; durationS: number }
): Promise<ActionResult<{ videoId: string; uploadUrl: string; storageType: 'supabase' | 'r2'; publicUrl?: string }>>
{
    const stream = await getOwnStream(liveStreamId)
    if (!stream) return { ok: false, error: 'Live stream not found or unauthorized.' }

    const profile = await requireProfile()
    const supabase = createServiceClient()
    const videoId = crypto.randomUUID()
    const ext = EXTENSIONS[input.contentType] || 'webm'
    const now = new Date().toISOString()

    // 1. If R2 is fully configured (with bucket name), use R2
    if (isR2Configured()) {
        const key = `videos/${profile.id}/${videoId}/replay.${ext}`
        const { error } = await supabase.from('videos').insert({
            id: videoId,
            owner_id: profile.id,
            title: stream.title,
            description: stream.description,
            kind: 'live_replay',
            status: 'uploading',
            provider: 'r2',
            playback_policy: 'public',
            source_r2_key: key,
            source_size_bytes: input.sizeBytes,
            duration_s: input.durationS,
        })

        if (error) {
            return { ok: false, error: 'Could not create replay record.' }
        }

        await supabase.from('live_streams').update({ replay_video_id: videoId, updated_at: now }).eq('id', liveStreamId)
        const uploadUrl = await presignUpload(key, input.contentType, input.sizeBytes)
        return { ok: true, videoId, uploadUrl, storageType: 'r2' }
    }

    // 2. Otherwise use Supabase's public 'media' storage bucket (reliable, zero quota restriction)
    const storagePath = `replays/${profile.id}/${videoId}.${ext}`
    const { data: signedData, error: signError } = await supabase
        .storage
        .from('media')
        .createSignedUploadUrl(storagePath)

    if (signError || !signedData?.signedUrl) {
        console.error('[modushive] Supabase createSignedUploadUrl error:', signError)
        return { ok: false, error: 'Could not prepare upload URL. Please try again.' }
    }

    const { data: publicData } = supabase.storage.from('media').getPublicUrl(storagePath)
    const publicUrl = publicData.publicUrl

    const { error: insertError } = await supabase.from('videos').insert({
        id: videoId,
        owner_id: profile.id,
        title: stream.title,
        description: stream.description,
        kind: 'live_replay',
        status: 'uploading',
        provider: 'supabase',
        provider_asset_id: storagePath,
        playback_id: publicUrl,
        playback_policy: 'public',
        source_size_bytes: input.sizeBytes,
        duration_s: input.durationS,
        updated_at: now,
    })

    if (insertError) {
        console.error('[modushive] Insert video record error:', insertError)
        return { ok: false, error: 'Could not create replay record in database.' }
    }

    // Immediately link replay_video_id on the stream
    await supabase.from('live_streams').update({ replay_video_id: videoId, updated_at: now }).eq('id', liveStreamId)

    return {
        ok: true,
        videoId,
        uploadUrl: signedData.signedUrl,
        storageType: 'supabase',
        publicUrl,
    }
}

/** Initiates upload of a recording file directly to an existing video row (e.g. to attach recording to a past replay) */
export async function createVideoRecordingUpload(
    videoId: string,
    input: { contentType: string; sizeBytes: number; durationS: number }
): Promise<ActionResult<{ videoId: string; uploadUrl: string; storageType: 'supabase' | 'r2'; publicUrl?: string }>>
{
    const profile = await requireProfile()
    const supabase = createServiceClient()

    const { data: video } = await supabase
        .from('videos')
        .select('id, owner_id')
        .eq('id', videoId)
        .maybeSingle()

    if (!video || (video.owner_id !== profile.id && normalizeRole(profile.role) !== 'admin')) {
        return { ok: false, error: 'Video not found or unauthorized.' }
    }

    const ext = EXTENSIONS[input.contentType] || 'webm'
    const now = new Date().toISOString()

    // 1. If R2 is configured
    if (isR2Configured()) {
        const key = `videos/${profile.id}/${videoId}/replay.${ext}`
        const { error } = await supabase
            .from('videos')
            .update({
                status: 'uploading',
                provider: 'r2',
                source_r2_key: key,
                source_size_bytes: input.sizeBytes,
                duration_s: input.durationS,
                updated_at: now,
            })
            .eq('id', videoId)

        if (error) {
            return { ok: false, error: 'Could not update video record.' }
        }

        const uploadUrl = await presignUpload(key, input.contentType, input.sizeBytes)
        return { ok: true, videoId, uploadUrl, storageType: 'r2' }
    }

    // 2. Supabase Storage fallback
    const storagePath = `replays/${profile.id}/${videoId}.${ext}`
    const { data: signedData, error: signError } = await supabase
        .storage
        .from('media')
        .createSignedUploadUrl(storagePath)

    if (signError || !signedData?.signedUrl) {
        console.error('[modushive] Supabase createSignedUploadUrl error:', signError)
        return { ok: false, error: 'Could not prepare upload URL. Please try again.' }
    }

    const { data: publicData } = supabase.storage.from('media').getPublicUrl(storagePath)
    const publicUrl = publicData.publicUrl

    const { error: updateError } = await supabase
        .from('videos')
        .update({
            status: 'uploading',
            provider: 'supabase',
            provider_asset_id: storagePath,
            playback_id: publicUrl,
            source_size_bytes: input.sizeBytes,
            duration_s: input.durationS,
            updated_at: now,
        })
        .eq('id', videoId)

    if (updateError) {
        return { ok: false, error: 'Could not update video record.' }
    }

    return {
        ok: true,
        videoId,
        uploadUrl: signedData.signedUrl,
        storageType: 'supabase',
        publicUrl,
    }
}

/** Finalizes the upload once the browser finishes sending the bytes to storage */
export async function finalizeStreamRecordingUpload(videoId: string): Promise<ActionResult>
{
    const profile = await requireProfile()
    const supabase = createServiceClient()

    const { data: video } = await supabase
        .from('videos')
        .select('id, owner_id, status, provider, playback_id')
        .eq('id', videoId)
        .maybeSingle()

    if (!video || (video.owner_id !== profile.id && normalizeRole(profile.role) !== 'admin')) {
        return { ok: false, error: 'Video not found or unauthorized.' }
    }

    await supabase
        .from('videos')
        .update({
            status: 'ready',
            updated_at: new Date().toISOString(),
        })
        .eq('id', videoId)

    revalidatePath('/app/modushive')
    revalidatePath('/app/modushive/studio')
    return { ok: true }
}
