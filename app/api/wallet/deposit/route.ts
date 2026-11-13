import { badBody, emailOf, num, readJson, toResponse, withProfile } from '@/lib/wallet/api'
import { startHostedDeposit } from '@/lib/wallet/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/wallet/deposit { amount } — records the deposit and opens a
 * Paystack checkout. Open `authorizationUrl` in a browser/WebView; when it
 * reaches /api/paystack/callback, call POST /api/wallet/deposit/verify.
 */
export async function POST(request: Request)
{
    return withProfile(request, async (ctx) =>
    {
        const body = await readJson(request)
        if (!body) return badBody()
        const callbackUrl = new URL('/api/paystack/callback', request.url).toString()
        return toResponse(await startHostedDeposit(ctx.profile, emailOf(ctx), num(body.amount), callbackUrl))
    })
}
