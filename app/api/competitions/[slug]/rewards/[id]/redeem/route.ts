import { readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { redeemReward } from '@/lib/world/rewards'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/rewards/:id/redeem  body { requestId?: uuid } — spend HubTokens (same requestId = spends once). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string; id: string }> })
{
    const { slug, id } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        return toResponse(await redeemReward(slug, profile, id, str(b?.requestId) ?? null))
    })
}
