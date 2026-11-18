import { badBody, emailOf, num, readJson, toResponse, withProfile } from '@/lib/wallet/api'
import { startHostedDeposit } from '@/lib/wallet/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/wallet/deposit { amount } — records the deposit and opens a
 * Paystack checkout. Open `authorizationUrl` in a browser/WebView. After
 * paying, the callback redirects to
 * naijaimpact://wallet?payment=<success|review|pending|failed>&reference=<ref>;
 * then call POST /api/wallet/deposit/verify to show the final state.
 */
export async function POST(request: Request)
{
    return withProfile(request, async (ctx) =>
    {
        const body = await readJson(request)
        if (!body) return badBody()
        // App callers (Bearer token) get sent back into the app after paying.
        const fromApp = /^bearer\s/i.test(request.headers.get('authorization') ?? '')
        const callback = new URL('/api/paystack/callback', request.url)
        if (fromApp) callback.searchParams.set('app', '1')
        const callbackUrl = callback.toString()
        return toResponse(await startHostedDeposit(ctx.profile, emailOf(ctx), num(body.amount), callbackUrl))
    })
}
