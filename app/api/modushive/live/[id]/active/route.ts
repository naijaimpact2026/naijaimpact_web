import { markLiveStreamActive } from '@/lib/actions/modushive'
import { fromAction, withProfile } from '@/lib/modushive/api'

export const dynamic = 'force-dynamic'

/** POST /api/modushive/live/:id/active — host only; call once WHIP publishing has connected. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    return withProfile(request, async () => fromAction(await markLiveStreamActive(id)))
}
