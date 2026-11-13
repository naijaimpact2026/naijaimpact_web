import { toResponse, withProfile } from '@/lib/world/api'
import { removeSquadMember } from '@/lib/world/squads'

export const dynamic = 'force-dynamic'

/** DELETE /api/competitions/:slug/squad/members/:userId — leader removes a player. */
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string; userId: string }> })
{
    const { slug, userId } = await params
    return withProfile(request, async ({ profile }) => toResponse(await removeSquadMember(slug, profile, userId)))
}
