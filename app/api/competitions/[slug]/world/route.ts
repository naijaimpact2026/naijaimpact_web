import { toResponse, withProfile } from '@/lib/world/api'
import { getWorldScreen } from '@/lib/world/world-view'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/world?week= — the whole 3D Campus home in one call (HUD, quests, districts, drop, layout, assets). */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const url = new URL(request.url)
    const w = Number(url.searchParams.get('week'))
    return withProfile(request, async ({ profile }) =>
        toResponse(await getWorldScreen(slug, profile, { week: Number.isInteger(w) && w > 0 ? w : undefined, origin: url.origin })))
}
