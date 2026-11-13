import { NextResponse } from 'next/server'
import { withProfile } from '@/lib/wallet/api'
import { getWalletView } from '@/lib/wallet/service'

export const dynamic = 'force-dynamic'

/** GET /api/wallet?limit=50 — balance (naira) and latest transactions, newest first. */
export async function GET(request: Request)
{
    return withProfile(request, async ({ profile }) =>
    {
        const raw = Number(new URL(request.url).searchParams.get('limit') ?? 50)
        const limit = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), 100) : 50
        return NextResponse.json(await getWalletView(profile, limit))
    })
}
