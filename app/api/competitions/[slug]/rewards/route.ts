import { toResponse, withProfile } from '@/lib/world/api'
import { listRewards } from '@/lib/world/rewards'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/rewards — the Rewards Exchange catalogue and my HubTokens balance. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await listRewards(slug, profile)))
}
