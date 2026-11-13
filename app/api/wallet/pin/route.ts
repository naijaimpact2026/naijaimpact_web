import { NextResponse } from 'next/server'
import { badBody, readJson, str, toResponse, withProfile } from '@/lib/wallet/api'
import { getPinStatus, setPin } from '@/lib/wallet/service'

export const dynamic = 'force-dynamic'

/** GET /api/wallet/pin — { hasPin } */
export async function GET(request: Request)
{
    return withProfile(request, async ({ profile }) => NextResponse.json(await getPinStatus(profile)))
}

/** POST /api/wallet/pin { pin, currentPin? } — set, or change (needs currentPin), the wallet PIN. */
export async function POST(request: Request)
{
    return withProfile(request, async ({ profile }) =>
    {
        const body = await readJson(request)
        if (!body) return badBody()
        return toResponse(await setPin(profile, str(body.pin), str(body.currentPin) || undefined), () => ({ ok: true }))
    })
}
