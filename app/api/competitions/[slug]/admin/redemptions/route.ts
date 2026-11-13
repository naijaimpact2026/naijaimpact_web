import { toResponse, withProfile } from '@/lib/world/api'
import { adminListRedemptions } from '@/lib/world/rewards'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/admin/redemptions?status=pending|fulfilled|cancelled — admin: redemptions to fulfil. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) =>
        toResponse(await adminListRedemptions(slug, profile, { status: new URL(request.url).searchParams.get('status') ?? undefined })))
}
