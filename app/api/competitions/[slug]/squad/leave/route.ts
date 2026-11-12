import { toResponse, withProfile } from '@/lib/world/api'
import { leaveSquad } from '@/lib/world/squads'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/squad/leave — leave your squad. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await leaveSquad(slug, profile)))
}
