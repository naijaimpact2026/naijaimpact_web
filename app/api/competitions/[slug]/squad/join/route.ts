import { jsonError, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { joinSquad } from '@/lib/world/squads'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/squad/join  body { code } — join with a 6-character invite code. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || !str(b.code)) return jsonError('Send the squad code.', 400)
        return toResponse(await joinSquad(slug, profile, { code: b.code }))
    })
}
