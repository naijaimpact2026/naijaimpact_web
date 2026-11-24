import { jsonError, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { claimTodayDrop, getTodayDrop } from '@/lib/world/drops'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/drops/today — today's campus drop (card + map tile, no answer until claimed) and the streak. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await getTodayDrop(slug, profile)))
}

/** POST /api/competitions/:slug/drops/today  body { answer } — answer and claim today's drop (once a day). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || !str(b.answer)) return jsonError('Send your answer.', 400)
        return toResponse(await claimTodayDrop(slug, profile, b.answer))
    })
}
