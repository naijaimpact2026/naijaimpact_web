import { NextResponse } from 'next/server'
import { withProfile } from '@/lib/modushive/api'
import { canGoLive, getLiveLimits, getUploadLimits, normalizeRole } from '@/lib/modushive/config'
import { isMuxConfigured } from '@/lib/modushive/mux'
import { isR2Configured } from '@/lib/modushive/r2'
import { isCloudflareStreamConfigured } from '@/lib/modushive/cloudflare'
import { listArchivedReplays, listLiveNow, listMyPendingVideos, listReadyVideos } from '@/lib/modushive/queries'

export const dynamic = 'force-dynamic'

/** GET /api/modushive/feed?limit=24 — the ModusHive home screen in one call. */
export async function GET(request: Request)
{
    return withProfile(request, async ({ supabase, profile }) =>
    {
        const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get('limit')) || 24, 1), 60)

        // Pending first: syncing it can flip a video to ready, which should
        // then show up in `videos` on this same response.
        const myPending = await listMyPendingVideos(profile.id, supabase)
        const [liveNow, videos, archived] = await Promise.all([
            listLiveNow(supabase),
            listReadyVideos(limit, supabase),
            listArchivedReplays(12, supabase),
        ])
        // listArchivedReplays falls back to ordinary videos when there are no
        // replays yet — those are already in `videos`, so keep real replays only.
        const replays = archived.filter((v) => v.kind === 'live_replay')

        return NextResponse.json({
            videos,
            liveNow,
            replays,
            myPending,
            me: {
                id: profile.id,
                role: normalizeRole(profile.role),
                canGoLive: canGoLive(profile.role) && (isCloudflareStreamConfigured() || isMuxConfigured()),
                uploadsEnabled: isMuxConfigured() && isR2Configured(),
                uploadLimits: getUploadLimits(profile.role),
                liveLimits: getLiveLimits(profile.role),
            },
        })
    })
}
