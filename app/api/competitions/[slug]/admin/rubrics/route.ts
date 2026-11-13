import { jsonError, readJson, toResponse, withProfile } from '@/lib/world/api'
import { listRubrics, saveRubric } from '@/lib/world/admin-content'
import type { RubricView } from '@/lib/world/types'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/admin/rubrics — admin: every rubric and how many missions use it. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await listRubrics(slug, profile)))
}

/** POST /api/competitions/:slug/admin/rubrics  body RubricView — admin: create or update a rubric (by key). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b) return jsonError('Send a rubric.', 400)
        return toResponse(await saveRubric(slug, profile, b as unknown as RubricView))
    })
}
