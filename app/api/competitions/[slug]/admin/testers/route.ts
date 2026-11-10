import { jsonError, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { addTester } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** POST /api/competitions/:slug/admin/testers  body { username } — admin: let a user play a preview competition. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || !str(b.username)) return jsonError('Send a username.', 400)
        return toResponse(await addTester(slug, profile, str(b.username)!))
    })
}
