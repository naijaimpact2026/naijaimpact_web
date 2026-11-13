import { toResponse, withProfile } from '@/lib/world/api'
import { listReports } from '@/lib/world/reports'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/reports?status=open|actioned|dismissed — admin: player reports. */
export async function GET(request: Request)
{
    return withProfile(request, async ({ profile }) =>
        toResponse(await listReports(profile, { status: new URL(request.url).searchParams.get('status') ?? undefined })))
}
