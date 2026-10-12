import { createClient } from '@/lib/supabase/server'
import { getThumbnailUrl, isMuxConfigured } from './mux'
import { syncLiveStream, syncVideo } from './sync'
import type { LiveStream, LiveStreamWithHost, Video, VideoOwner, VideoWithOwner } from '@/lib/types'

/**
 * Read-side ModusHive queries for Server Components. These go through the
 * RLS client (ready videos + your own uploads are readable) and degrade to
 * empty results if the migration hasn't been applied yet. Rows still in
 * progress are checked against Mux (throttled) in case a webhook didn't
 * reach us — see lib/modushive/sync.ts.
 */

const OWNER_COLUMNS = 'id, username, display_name, avatar_url, verified'

type VideoRow = Video & { owner: VideoOwner | null }
type LiveStreamRow = LiveStream & { host: VideoOwner | null }

async function withThumbnails(rows: VideoRow[]): Promise<VideoWithOwner[]>
{
    const canSign = isMuxConfigured()
    return Promise.all(rows.map(async (v) => ({
        ...v,
        thumbnail_url: canSign && v.status === 'ready'
            ? await getThumbnailUrl(v.playback_id, v.playback_policy, { time: 1 })
            : null,
    })))
}

export async function listReadyVideos(limit = 24): Promise<VideoWithOwner[]>
{
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('videos')
        .select(`*, owner:users!videos_owner_id_fkey(${OWNER_COLUMNS})`)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error || !data) return []
    return withThumbnails(data as VideoRow[])
}

/** The viewer's own uploads that aren't watchable yet (or failed). */
export async function listMyPendingVideos(ownerId: string): Promise<Video[]>
{
    if (!ownerId) return []
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('owner_id', ownerId)
        .neq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error || !data) return []
    const synced = await Promise.all((data as Video[]).map(syncVideo))
    return synced.filter((v) => v.status !== 'ready')
}

export async function getVideo(id: string): Promise<VideoWithOwner | null>
{
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('videos')
        .select(`*, owner:users!videos_owner_id_fkey(${OWNER_COLUMNS})`)
        .eq('id', id)
        .maybeSingle()

    if (error || !data) return null
    const [video] = await withThumbnails([await syncVideo(data as VideoRow)])
    return video
}

async function withStreamThumbnails(rows: LiveStreamRow[]): Promise<LiveStreamWithHost[]>
{
    const canSign = isMuxConfigured()
    const synced = await Promise.all(rows.map(syncLiveStream))
    return Promise.all(synced.map(async (s) => ({
        ...s,
        thumbnail_url: canSign && s.status === 'live'
            ? await getThumbnailUrl(s.playback_id, s.playback_policy)
            : null,
    })))
}

export async function listLiveNow(): Promise<LiveStreamWithHost[]>
{
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('live_streams')
        .select(`*, host:users!live_streams_host_id_fkey(${OWNER_COLUMNS})`)
        .eq('status', 'live')
        .order('started_at', { ascending: false })

    if (error || !data) return []
    const streams = await withStreamThumbnails(data as LiveStreamRow[])
    return streams.filter((s) => s.status === 'live')
}

export async function getLiveStream(id: string): Promise<LiveStreamWithHost | null>
{
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('live_streams')
        .select(`*, host:users!live_streams_host_id_fkey(${OWNER_COLUMNS})`)
        .eq('id', id)
        .maybeSingle()

    if (error || !data) return null
    const [stream] = await withStreamThumbnails([data as LiveStreamRow])
    return stream
}

/** Studio list — every stream that isn't finished, plus the 10 most recent ended ones. */
export async function listStudioStreams(): Promise<LiveStreamWithHost[]>
{
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('live_streams')
        .select(`*, host:users!live_streams_host_id_fkey(${OWNER_COLUMNS})`)
        .order('created_at', { ascending: false })
        .limit(30)

    if (error || !data) return []
    const rows = data as LiveStreamRow[]
    const active = rows.filter((s) => s.status !== 'ended')
    const ended = rows.filter((s) => s.status === 'ended').slice(0, 10)
    return withStreamThumbnails([...active, ...ended])
}
