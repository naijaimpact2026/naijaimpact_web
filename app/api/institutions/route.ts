import { NextResponse } from 'next/server'
import { withProfile } from '@/lib/world/api'
import { searchInstitutions } from '@/lib/world/service'

export const dynamic = 'force-dynamic'

/** GET /api/institutions?q= — approved institutions (max 30). */
export async function GET(request: Request)
{
    const q = new URL(request.url).searchParams.get('q') ?? ''
    return withProfile(request, async () => NextResponse.json({ ok: true, institutions: await searchInstitutions(q) }))
}
