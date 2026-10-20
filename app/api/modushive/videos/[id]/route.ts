import { NextResponse } from 'next/server'
import { deleteVideo } from '@/lib/actions/modushive'
import { fromAction, jsonError, videoPlayback, withProfile } from '@/lib/modushive/api'
import { normalizeRole } from '@/lib/modushive/config'
import { getVideo } from '@/lib/modushive/queries'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** GET /api/modushive/videos/:id — the video plus a ready-to-play HLS URL once processed. */
export async function GET(request: Request, { params }: Params)
{
    const { id } = await params
    return withProfile(request, async ({ supabase, profile }) =>
    {
        const video = await getVideo(id, supabase)
        if (!video) return jsonError('Video not found.', 404)

        return NextResponse.json({
            video,
            playback: await videoPlayback(video),
            canDelete: video.owner_id === profile.id || normalizeRole(profile.role) === 'admin',
        })
    })
}

/** DELETE /api/modushive/videos/:id — owner or admin. */
export async function DELETE(request: Request, { params }: Params)
{
    const { id } = await params
    return withProfile(request, async () => fromAction(await deleteVideo(id)))
}
