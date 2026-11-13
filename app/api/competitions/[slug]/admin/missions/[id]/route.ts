import { jsonError, readJson, toResponse, withProfile } from '@/lib/world/api'
import { getAdminMission, updateMission, type MissionInput } from '@/lib/world/admin-content'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/admin/missions/:id — admin: one mission with its answer key. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string; id: string }> })
{
    const { slug, id } = await params
    return withProfile(request, async ({ profile }) => toResponse(await getAdminMission(slug, profile, id)))
}

/** PATCH /api/competitions/:slug/admin/missions/:id  body Partial<MissionInput> — admin: edit, or { isActive: false } to switch off. */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string; id: string }> })
{
    const { slug, id } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b) return jsonError('Send the fields to change.', 400)
        return toResponse(await updateMission(slug, profile, id, b as Partial<MissionInput>))
    })
}
