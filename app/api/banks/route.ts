import { NextResponse } from 'next/server'
import { withProfile } from '@/lib/wallet/api'
import { listBanks } from '@/lib/wallet/service'

export const dynamic = 'force-dynamic'

/** GET /api/banks — Nigerian banks (popular first) for withdrawals. */
export async function GET(request: Request)
{
    return withProfile(request, async () =>
    {
        const banks = (await listBanks()).map(({ name, code }) => ({ name, code }))
        return NextResponse.json({ banks })
    })
}
