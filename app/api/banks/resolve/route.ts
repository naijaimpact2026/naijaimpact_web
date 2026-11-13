import { badBody, readJson, str, toResponse, withProfile } from '@/lib/wallet/api'
import { resolveBankAccount } from '@/lib/wallet/service'

export const dynamic = 'force-dynamic'

/** POST /api/banks/resolve { bankCode, accountNumber } — the account holder's name. */
export async function POST(request: Request)
{
    return withProfile(request, async ({ profile }) =>
    {
        const body = await readJson(request)
        if (!body) return badBody()
        return toResponse(await resolveBankAccount(profile, str(body.bankCode), str(body.accountNumber)), (r) => ({
            accountName: r.accountName,
        }))
    })
}
