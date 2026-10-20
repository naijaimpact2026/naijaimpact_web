import { createVideoUpload } from '@/lib/actions/modushive'
import { fromAction, jsonError, readJson, withProfile } from '@/lib/modushive/api'

export const dynamic = 'force-dynamic'

/**
 * POST /api/modushive/uploads
 * body { title, description?, contentType, sizeBytes, durationS } → { videoId, uploadUrl }
 *
 * Then PUT the file to `uploadUrl` with the same Content-Type and exactly
 * `sizeBytes` bytes (both are signed into the URL), and call finalize.
 */
export async function POST(request: Request)
{
    return withProfile(request, async () =>
    {
        const body = await readJson(request)
        if (
            !body
            || typeof body.title !== 'string'
            || typeof body.contentType !== 'string'
            || typeof body.sizeBytes !== 'number'
            || (body.description !== undefined && body.description !== null && typeof body.description !== 'string')
        )
            return jsonError('Send title, contentType and sizeBytes.', 400)

        return fromAction(await createVideoUpload({
            title: body.title,
            description: typeof body.description === 'string' ? body.description : undefined,
            contentType: body.contentType,
            sizeBytes: body.sizeBytes,
            durationS: typeof body.durationS === 'number' ? body.durationS : 0,
        }))
    })
}
