import { jsonError, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { createSquad, getMySquad, renameSquad } from '@/lib/world/squads'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ slug: string }> }

/** GET /api/competitions/:slug/squad — my squad (null if none). `enabled: false` until squads are switched on. */
export async function GET(request: Request, { params }: Ctx)
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await getMySquad(slug, profile)))
}

/** POST /api/competitions/:slug/squad  body { name } — create a squad (you become its leader). */
export async function POST(request: Request, { params }: Ctx)
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || !str(b.name)) return jsonError('Send a squad name.', 400)
        return toResponse(await createSquad(slug, profile, { name: b.name }))
    })
}

/** PATCH /api/competitions/:slug/squad  body { name } — leader renames the squad. */
export async function PATCH(request: Request, { params }: Ctx)
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || !str(b.name)) return jsonError('Send a squad name.', 400)
        return toResponse(await renameSquad(slug, profile, { name: b.name }))
    })
}
