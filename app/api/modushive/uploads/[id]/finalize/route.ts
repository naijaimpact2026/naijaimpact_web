import { finalizeVideoUpload } from '@/lib/actions/modushive'
import { fromAction, withProfile } from '@/lib/modushive/api'

export const dynamic = 'force-dynamic'

/** POST /api/modushive/uploads/:id/finalize — after the PUT to R2 succeeds; hands the file to Mux. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    return withProfile(request, async () => fromAction(await finalizeVideoUpload(id)))
}
