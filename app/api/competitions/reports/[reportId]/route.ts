import { jsonError, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { handleReport } from '@/lib/world/reports'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/reports/:reportId  body { action: dismiss|reject_attempt, attemptId?, note } — admin: handle a report. */
export async function POST(request: Request, { params }: { params: Promise<{ reportId: string }> })
{
    const { reportId } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        const action = str(b?.action)
        if (action !== 'dismiss' && action !== 'reject_attempt') return jsonError('Send action: dismiss or reject_attempt.', 400)
        return toResponse(await handleReport(profile, { reportId, action, attemptId: str(b?.attemptId) ?? null, note: str(b?.note) ?? '' }))
    })
}
