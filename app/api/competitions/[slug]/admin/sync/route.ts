import { readJson, toResponse, withProfile } from '@/lib/world/api'
import { syncContent } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/admin/sync  body { overwrite?: boolean } — admin: load authored missions. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        return toResponse(await syncContent(slug, profile, b?.overwrite === true))
    })
}
