import { jsonError, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { reportPlayer, type ReportInput } from '@/lib/world/reports'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/reports  body { targetUserId, reason, note?, attemptId?, context? } — report another player. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || !str(b.targetUserId) || !str(b.reason)) return jsonError('Send targetUserId and reason.', 400)
        return toResponse(await reportPlayer(slug, profile, {
            targetUserId: str(b.targetUserId)!, reason: str(b.reason) as ReportInput['reason'], note: str(b.note) ?? null,
            attemptId: str(b.attemptId) ?? null, context: str(b.context) as ReportInput['context'],
        }))
    })
}
