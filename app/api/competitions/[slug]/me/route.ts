import { jsonError, num, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { updateWorldMe } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** PATCH /api/competitions/:slug/me  body { state?, character?, accessibility?, institutionId?, institutionName?, pathway? } */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b) return jsonError('Send a JSON body.', 400)
        return toResponse(await updateWorldMe(slug, profile, {
            ...('state' in b ? { state: str(b.state) ?? null } : {}),
            ...('character' in b ? { character: num(b.character) } : {}),
            ...('accessibility' in b && b.accessibility && typeof b.accessibility === 'object' ? { accessibility: b.accessibility as Record<string, boolean> } : {}),
            ...('institutionId' in b ? { institutionId: str(b.institutionId) ?? null } : {}),
            ...('institutionName' in b ? { institutionName: str(b.institutionName) ?? null } : {}),
            ...('pathway' in b && str(b.pathway) ? { pathway: str(b.pathway) } : {}),
        }))
    })
}
