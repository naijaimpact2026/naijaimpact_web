import { NextResponse } from 'next/server'
import { jsonError, livePlayback, withProfile } from '@/lib/modushive/api'
import { normalizeRole } from '@/lib/modushive/config'
import { getLiveStream } from '@/lib/modushive/queries'

export const dynamic = 'force-dynamic'

/** GET /api/modushive/live/:id — the stream, plus an HLS URL while it's live. Poll it while idle. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    return withProfile(request, async ({ supabase, profile }) =>
    {
        const stream = await getLiveStream(id, supabase)
        if (!stream) return jsonError('Live stream not found.', 404)

        return NextResponse.json({
            stream,
            playback: await livePlayback(stream),
            isHost: stream.host_id === profile.id || normalizeRole(profile.role) === 'admin',
        })
    })
}
