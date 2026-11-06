import { createLiveStream } from '@/lib/actions/modushive'
import { fromAction, jsonError, readJson, withProfile } from '@/lib/modushive/api'

export const dynamic = 'force-dynamic'

/** POST /api/modushive/live  body { title, description? } → { id } */
export async function POST(request: Request)
{
    return withProfile(request, async () =>
    {
        const body = await readJson(request)
        if (!body || typeof body.title !== 'string')
            return jsonError('Send a title.', 400)

        return fromAction(await createLiveStream({
            title: body.title,
            description: typeof body.description === 'string' ? body.description : undefined,
        }))
    })
}
