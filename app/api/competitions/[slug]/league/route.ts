import { toResponse, withProfile } from '@/lib/world/api'
import { institutionLeague } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/league?pathway= — campus vs campus (average XP per participant). */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const pathway = new URL(request.url).searchParams.get('pathway') ?? undefined
    return withProfile(request, async ({ profile }) => toResponse(await institutionLeague(slug, profile, pathway)))
}
