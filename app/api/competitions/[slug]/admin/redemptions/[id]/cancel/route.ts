import { readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { cancelRedemption } from '@/lib/world/rewards'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/admin/redemptions/:id/cancel  body { note? } — admin: cancel and refund the tokens (notifies the student). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string; id: string }> })
{
    const { slug, id } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        return toResponse(await cancelRedemption(slug, profile, id, str(b?.note)))
    })
}
