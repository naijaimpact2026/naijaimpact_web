import { toResponse, withProfile } from '@/lib/world/api'
import { getMission } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/missions/:missionId — mission (client-safe config) + the caller's attempts. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string; missionId: string }> })
{
    const { slug, missionId } = await params
    return withProfile(request, async ({ profile }) => toResponse(await getMission(slug, missionId, profile)))
}
