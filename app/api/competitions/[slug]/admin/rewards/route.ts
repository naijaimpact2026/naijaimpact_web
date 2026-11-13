import { jsonError, readJson, toResponse, withProfile } from '@/lib/world/api'
import { adminListRewards, saveReward, type RewardInput } from '@/lib/world/rewards'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/admin/rewards — admin: the whole catalogue (incl. switched off) with redemption counts. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await adminListRewards(slug, profile)))
}

/** POST /api/competitions/:slug/admin/rewards  body RewardInput — admin: add a reward (switched off unless isActive). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b) return jsonError('Send a reward.', 400)
        return toResponse(await saveReward(slug, profile, null, b as Partial<RewardInput>))
    })
}
