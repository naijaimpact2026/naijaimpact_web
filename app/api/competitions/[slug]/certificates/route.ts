import { toResponse, withProfile } from '@/lib/world/api'
import { myCertificates } from '@/lib/world/certificates'

export const dynamic = 'force-dynamic'

/** GET /api/competitions/:slug/certificates — my certificates (issues newly earned ones) + the stage I'm working towards. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    return withProfile(request, async ({ profile }) => toResponse(await myCertificates(slug, profile)))
}
