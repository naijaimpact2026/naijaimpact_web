import { jsonError, toResponse, withProfile } from '@/lib/wallet/api'
import { lookupUser } from '@/lib/wallet/service'

export const dynamic = 'force-dynamic'

/** GET /api/users/lookup?username= — { user } or { user: null } (Send flow). */
export async function GET(request: Request)
{
    return withProfile(request, async ({ profile }) =>
    {
        const username = new URL(request.url).searchParams.get('username') ?? ''
        if (!username.trim()) return jsonError('Enter a username.', 400)
        return toResponse(await lookupUser(profile, username))
    })
}
