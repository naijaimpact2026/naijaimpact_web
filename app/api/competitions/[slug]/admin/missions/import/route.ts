import { jsonError, readJson, toResponse, withProfile } from '@/lib/world/api'
import { importWeek, type MissionInput } from '@/lib/world/admin-content'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/admin/missions/import  body { missions: SeedMission[], replace?, activate? } — admin: load a whole week. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || !Array.isArray(b.missions)) return jsonError('Send { missions: [...] }.', 400)
        return toResponse(await importWeek(slug, profile, { missions: b.missions as MissionInput[], replace: b.replace === true, activate: b.activate !== false }))
    })
}
