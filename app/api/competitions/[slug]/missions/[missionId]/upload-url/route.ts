import { jsonError, num, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { createUploadUrl } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/competitions/:slug/missions/:missionId/upload-url  body { fieldId, contentType, sizeBytes }
 * → { uploadUrl, key }. PUT the file to uploadUrl with that Content-Type, then send { key } as the field value.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string; missionId: string }> })
{
    const { slug, missionId } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || !str(b.fieldId) || !str(b.contentType) || num(b.sizeBytes) === undefined)
            return jsonError('Send fieldId, contentType and sizeBytes.', 400)
        return toResponse(await createUploadUrl(slug, missionId, profile, { fieldId: str(b.fieldId)!, contentType: str(b.contentType)!, sizeBytes: num(b.sizeBytes)! }))
    })
}
