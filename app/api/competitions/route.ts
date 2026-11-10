import { NextResponse } from 'next/server'
import { withProfile } from '@/lib/world/api'
import { listCompetitionSummaries } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** GET /api/competitions — every competition (classic + world) with the caller's join/play status. */
export async function GET(request: Request)
{
    return withProfile(request, async ({ profile }) =>
        NextResponse.json({ ok: true, competitions: await listCompetitionSummaries(profile) }))
}
