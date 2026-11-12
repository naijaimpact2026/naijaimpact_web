import { toResponse, withProfile } from '@/lib/world/api'
import { worldLeaderboard } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/leaderboard?pathway=career|enterprise&scope=overall|institution|state&value=&period=all|week&limit= */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const q = new URL(request.url).searchParams
    return withProfile(request, async ({ profile }) => toResponse(await worldLeaderboard(slug, profile, {
        pathway: q.get('pathway') ?? undefined, scope: q.get('scope') ?? undefined, value: q.get('value') ?? undefined, period: q.get('period') ?? undefined,
        limit: Number(q.get('limit')) || undefined,
    })))
}
