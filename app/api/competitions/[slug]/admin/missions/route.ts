import { jsonError, readJson, toResponse, withProfile } from '@/lib/world/api'
import { createMission, listAdminMissions, type MissionInput } from '@/lib/world/admin-content'

export const dynamic = 'force-dynamic'

const int = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : undefined)

/** GET /api/competitions/:slug/admin/missions?pathway=&week=&day=&active=true|false — admin: missions with answer keys, attempt counts and week checks. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const q = new URL(request.url).searchParams
        const active = q.get('active')
        return toResponse(await listAdminMissions(slug, profile, {
            pathway: q.get('pathway') ?? undefined, week: int(q.get('week')), day: int(q.get('day')),
            active: active === 'true' ? true : active === 'false' ? false : undefined,
        }))
    })
}

/** POST /api/competitions/:slug/admin/missions  body MissionInput — admin: create a mission. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b) return jsonError('Send a mission.', 400)
        return toResponse(await createMission(slug, profile, b as unknown as MissionInput))
    })
}
