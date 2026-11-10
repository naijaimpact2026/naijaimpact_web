import { toResponse, withProfile } from '@/lib/world/api'
import { todayQuests } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/quests/today — today's quest + open catch-up missions + semester clock. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await todayQuests(slug, profile)))
}
