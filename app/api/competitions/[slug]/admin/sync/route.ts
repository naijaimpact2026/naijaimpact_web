import { readJson, toResponse, withProfile } from '@/lib/world/api'
import { syncContent } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/competitions/:slug/admin/sync  body { overwrite?: boolean, retire?: boolean }
 * Admin: load authored missions. retire=true switches off missions in the code-covered weeks that are no longer in the code.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        return toResponse(await syncContent(slug, profile, b?.overwrite === true, b?.retire === true))
    })
}
