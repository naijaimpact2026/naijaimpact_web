import { toResponse, withProfile } from '@/lib/world/api'
import { getProgress } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/progress — passport: level, XP, HubTokens, rank, stage scores, badges. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await getProgress(slug, profile)))
}
