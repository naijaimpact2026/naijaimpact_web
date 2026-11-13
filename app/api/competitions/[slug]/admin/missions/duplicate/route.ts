import { jsonError, num, readJson, str, toResponse, withProfile } from '@/lib/world/api'
import { duplicateMissions } from '@/lib/world/admin-content'
import type { Pathway } from '@/lib/world/types'

export const dynamic = 'force-dynamic'

const pathway = (v: unknown) => (v === 'career' || v === 'enterprise' ? (v as Pathway) : undefined)

/** POST /api/competitions/:slug/admin/missions/duplicate — admin: copy a mission or a pathway-week (copies start switched off). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || num(b.toWeek) === undefined) return jsonError('Send toWeek.', 400)
        return toResponse(await duplicateMissions(slug, profile, {
            missionId: str(b.missionId), pathway: pathway(b.pathway), fromWeek: num(b.fromWeek),
            toWeek: num(b.toWeek)!, toPathway: pathway(b.toPathway), toDay: num(b.toDay),
        }))
    })
}
