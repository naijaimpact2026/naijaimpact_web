import { jsonError, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { appealAttempt } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/attempts/:attemptId/appeal  body { reason } */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string; attemptId: string }> })
{
    const { slug, attemptId } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || !str(b.reason)) return jsonError('Send a reason.', 400)
        return toResponse(await appealAttempt(slug, attemptId, profile, str(b.reason)!))
    })
}
