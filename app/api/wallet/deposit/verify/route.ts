import { badBody, emailOf, readJson, str, toResponse, withProfile } from '@/lib/wallet/api'
import { verifyDeposit } from '@/lib/wallet/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/wallet/deposit/verify { reference } — checks the payment with
 * Paystack and credits it once (safe to call repeatedly).
 * → { status: 'success', amount, newBalance } | { status: 'pending' | 'failed', message }
 */
export async function POST(request: Request)
{
    return withProfile(request, async (ctx) =>
    {
        const body = await readJson(request)
        if (!body) return badBody()
        return toResponse(await verifyDeposit(ctx.profile, emailOf(ctx), str(body.reference)), (r) =>
            r.status === 'success'
                ? { status: r.status, amount: r.amount, newBalance: r.newBalance }
                : { status: r.status, message: r.message })
    })
}
