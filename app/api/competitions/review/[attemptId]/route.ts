import { jsonError, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { reviewAttempt } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/review/:attemptId  body { decision: pass|revise|reject, rubricScores?, feedback, appeal?: upheld|dismissed } */
export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> })
{
    const { attemptId } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        const decision = str(b?.decision)
        if (!b || !decision || !['pass', 'revise', 'reject'].includes(decision)) return jsonError('Send decision: pass | revise | reject.', 400)
        return toResponse(await reviewAttempt(profile, {
            attemptId, decision: decision as 'pass' | 'revise' | 'reject', feedback: str(b.feedback) ?? '',
            rubricScores: b.rubricScores && typeof b.rubricScores === 'object' ? b.rubricScores as Record<string, number> : undefined,
            appeal: b.appeal === 'upheld' || b.appeal === 'dismissed' ? b.appeal : undefined,
        }))
    })
}
