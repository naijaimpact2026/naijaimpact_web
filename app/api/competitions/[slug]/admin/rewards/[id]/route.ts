import { jsonError, readJson, toResponse, withProfile } from '@/lib/world/api'
import { saveReward, type RewardInput } from '@/lib/world/rewards'

export const dynamic = 'force-dynamic'

/** PATCH /api/competitions/:slug/admin/rewards/:id  body Partial<RewardInput> — admin: edit, or { isActive: false } to switch off. */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string; id: string }> })
{
    const { slug, id } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b) return jsonError('Send the fields to change.', 400)
        return toResponse(await saveReward(slug, profile, id, b as Partial<RewardInput>))
    })
}
