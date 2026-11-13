import { toResponse, withProfile } from '@/lib/world/api'
import { reviewQueue } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/review?appeals=1 — admin/judge: submissions waiting for review (or open appeals). */
export async function GET(request: Request)
{
    const appeals = new URL(request.url).searchParams.get('appeals') === '1'
    return withProfile(request, async ({ profile }) => toResponse(await reviewQueue(profile, { appeals })))
}
