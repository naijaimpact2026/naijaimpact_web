import { jsonError, readJson, toResponse, withProfile } from '@/lib/world/api'
import { submitAttempt } from '@/lib/world/service'
import type { AttemptPayload } from '@/lib/world/types'

export const dynamic = 'force-dynamic'

const KINDS = ['quiz', 'sort', 'scenario', 'form']

/** POST /api/competitions/:slug/missions/:missionId/attempts  body = AttemptPayload → { attempt, awarded, badge } */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string; missionId: string }> })
{
    const { slug, missionId } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || typeof b.kind !== 'string' || !KINDS.includes(b.kind)) return jsonError('Send a payload with kind: quiz | sort | scenario | form.', 400)
        if (JSON.stringify(b).length > 100_000) return jsonError('Submission is too large.', 400)
        return toResponse(await submitAttempt(slug, missionId, profile, b as unknown as AttemptPayload))
    })
}
