import { readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { fulfilRedemption } from '@/lib/world/rewards'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/admin/redemptions/:id/fulfil  body { code?, note? } — admin: mark delivered (notifies the student). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string; id: string }> })
{
    const { slug, id } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        return toResponse(await fulfilRedemption(slug, profile, id, { code: str(b?.code), note: str(b?.note) }))
    })
}
