import { toResponse, withProfile } from '@/lib/world/api'
import { openSquadChat } from '@/lib/world/squads'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/squad/chat — make sure the squad chat exists with every member; returns its channel id. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await openSquadChat(slug, profile)))
}
