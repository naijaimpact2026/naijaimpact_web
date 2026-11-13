import { badBody, num, readJson, str, toResponse, withProfile } from '@/lib/wallet/api'
import { requestWithdrawal } from '@/lib/wallet/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/wallet/withdraw { amount, bankCode, accountNumber, pin } — holds
 * the amount and queues a payout to the account (name resolved server-side).
 */
export async function POST(request: Request)
{
    return withProfile(request, async ({ profile }) =>
    {
        const body = await readJson(request)
        if (!body) return badBody()
        return toResponse(await requestWithdrawal(profile, {
            amount: num(body.amount),
            bankCode: str(body.bankCode),
            accountNumber: str(body.accountNumber),
            pin: str(body.pin),
        }))
    })
}
