import { NextResponse } from 'next/server'
import { withProfile } from '@/lib/modushive/api'
import { canGoLive, getLiveLimits, normalizeRole } from '@/lib/modushive/config'
import { isMuxConfigured } from '@/lib/modushive/mux'
import { isCloudflareStreamConfigured } from '@/lib/modushive/cloudflare'
import { listStudioStreams } from '@/lib/modushive/queries'

export const dynamic = 'force-dynamic'

/** GET /api/modushive/studio — the caller's streams (every stream for admins). */
export async function GET(request: Request)
{
    return withProfile(request, async ({ supabase, profile }) =>
    {
        const allowed = canGoLive(profile.role)
        const isAdmin = normalizeRole(profile.role) === 'admin'

        return NextResponse.json({
            canGoLive: allowed && (isCloudflareStreamConfigured() || isMuxConfigured()),
            provider: isCloudflareStreamConfigured() ? 'cloudflare' : 'mux',
            limits: getLiveLimits(profile.role),
            streams: allowed ? await listStudioStreams(isAdmin ? undefined : profile.id, supabase) : [],
        })
    })
}
