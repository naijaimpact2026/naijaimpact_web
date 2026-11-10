import { toResponse, withProfile } from '@/lib/world/api'
import { listQuests } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/quests?week=N — the caller's pathway missions for a week (default: current week). */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const week = Number(new URL(request.url).searchParams.get('week')) || undefined
    return withProfile(request, async ({ profile }) => toResponse(await listQuests(slug, profile, week)))
}
