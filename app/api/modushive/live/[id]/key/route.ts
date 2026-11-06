import { getLiveStreamKey } from '@/lib/actions/modushive'
import { fromAction, withProfile } from '@/lib/modushive/api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/modushive/live/:id/key — host or admin only.
 * → { provider, rtmpUrl, streamKey, whipUrl? } (whipUrl for Cloudflare WebRTC publishing).
 * Fetch on demand; never cache it on the device.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    return withProfile(request, async () =>
    {
        const res = fromAction(await getLiveStreamKey(id))
        res.headers.set('Cache-Control', 'no-store')
        return res
    })
}
