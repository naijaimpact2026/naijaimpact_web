import { badBody, num, readJson, str, toResponse, withProfile } from '@/lib/wallet/api'
import { sendFunds } from '@/lib/wallet/service'

export const dynamic = 'force-dynamic'

/** POST /api/wallet/transfer { username, amount, pin } — send money to another user. */
export async function POST(request: Request)
{
    return withProfile(request, async ({ profile }) =>
    {
        const body = await readJson(request)
        if (!body) return badBody()
        return toResponse(await sendFunds(profile, str(body.username), num(body.amount), str(body.pin)))
    })
}
