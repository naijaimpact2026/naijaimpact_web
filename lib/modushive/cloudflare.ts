/**
 * Server-only Cloudflare Stream helpers.
 * Handles in-browser live streaming via WHIP (WebRTC HTTP Ingest Protocol).
 */

export interface CloudflareLiveInput {
    uid: string
    whipUrl: string
    hlsUrl: string
    rtmpsUrl: string
    streamKey: string
    status?: string
}

export function isCloudflareStreamConfigured(): boolean {
    return Boolean(
        process.env.CLOUDFLARE_STREAM_TOKEN &&
        (process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID)
    )
}

function getAccountId(): string {
    const id = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID
    if (!id) throw new Error('Cloudflare account ID not found in env (R2_ACCOUNT_ID)')
    return id
}

function getApiToken(): string {
    const token = process.env.CLOUDFLARE_STREAM_TOKEN
    if (!token) throw new Error('CLOUDFLARE_STREAM_TOKEN not found in env')
    return token
}

/**
 * Creates a new Cloudflare Live Input with automatic recording enabled.
 * Returns WHIP publish URL for direct in-browser WebRTC broadcasting and HLS URL for playback.
 */
export async function createCloudflareLiveInput(title: string, record = true): Promise<CloudflareLiveInput> {
    const accountId = getAccountId()
    const token = getApiToken()

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            meta: { name: title },
            recording: { mode: record ? 'automatic' : 'off' },
        }),
    })

    const data = await res.json()
    if (!data.success || !data.result) {
        console.error('[cloudflare-stream] create live input failed:', data.errors)
        throw new Error(data.errors?.[0]?.message || 'Failed to create Cloudflare live input')
    }

    const r = data.result
    return {
        uid: r.uid,
        whipUrl: r.webRTC?.url || '',
        hlsUrl: r.playback?.hls || '',
        rtmpsUrl: r.rtmps?.url || 'rtmps://live.cloudflare.com:443/live/',
        streamKey: r.rtmps?.streamKey || '',
        status: r.status?.current?.state || 'idle',
    }
}

/**
 * Checks the status of a live input and checks if a recorded video is ready.
 */
export async function getCloudflareLiveInput(uid: string): Promise<{
    state: 'idle' | 'connected' | 'reconnecting'
    recordedVideoId: string | null
}> {
    const accountId = getAccountId()
    const token = getApiToken()

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs/${uid}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await res.json()
    if (!data.success || !data.result) {
        return { state: 'idle', recordedVideoId: null }
    }

    const state = data.result.status?.current?.state === 'connected' ? 'connected' : 'idle'
    // If stream ended and was recorded:
    const recordedVideoId = data.result.recording?.recordingVideos?.[0] || null

    return { state, recordedVideoId }
}

/**
 * Retrieves all recorded videos produced by a Cloudflare Live Input.
 */
export async function getCloudflareLiveInputVideos(uid: string): Promise<Array<{ uid: string; status?: { state: string }; duration?: number }>> {
    const accountId = getAccountId()
    const token = getApiToken()

    try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs/${uid}/videos`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        const data = await res.json()
        if (!data.success || !Array.isArray(data.result)) return []
        return data.result
    } catch (err) {
        console.error('[cloudflare-stream] failed to get live input videos:', err)
        return []
    }
}

/**
 * Deletes a live input when no longer needed.
 */
export async function deleteCloudflareLiveInput(uid: string): Promise<void> {
    const accountId = getAccountId()
    const token = getApiToken()

    await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs/${uid}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).catch((err) => console.error('[cloudflare-stream] delete input error:', err))
}

/**
 * Deletes an on-demand video asset in Cloudflare Stream.
 */
export async function deleteCloudflareVideo(uid: string): Promise<void> {
    const accountId = getAccountId()
    const token = getApiToken()

    await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).catch((err) => console.error('[cloudflare-stream] delete video error:', err))
}

