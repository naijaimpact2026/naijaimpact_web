import { jsonError, num, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { joinWorld } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/join  body { pathway, institutionId? | institutionName?, state?, character?, accessibility? } */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || !str(b.pathway)) return jsonError('Send a pathway: "career" or "enterprise".', 400)
        return toResponse(await joinWorld(slug, profile, {
            pathway: str(b.pathway)!, institutionId: str(b.institutionId) ?? null, institutionName: str(b.institutionName) ?? null,
            state: str(b.state) ?? null, character: num(b.character),
            accessibility: b.accessibility && typeof b.accessibility === 'object' ? b.accessibility as Record<string, boolean> : undefined,
        }))
    })
}
