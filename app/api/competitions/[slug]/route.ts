import { toResponse, withProfile } from '@/lib/world/api'
import { getCompetitionDetail } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug — semester clock, pathways and the caller's participation. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await getCompetitionDetail(slug, profile)))
}
