import { toResponse, withProfile } from '@/lib/world/api'
import { competitionAnalytics } from '@/lib/world/analytics'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/admin/analytics — admin: sign-ups, onboarding, activity, missions, review queue, tokens and pilot targets. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await competitionAnalytics(slug, profile)))
}
