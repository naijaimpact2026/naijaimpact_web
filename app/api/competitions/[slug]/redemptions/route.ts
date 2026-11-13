import { toResponse, withProfile } from '@/lib/world/api'
import { myRedemptions } from '@/lib/world/rewards'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/redemptions — my redemptions with status and code. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await myRedemptions(slug, profile)))
}
