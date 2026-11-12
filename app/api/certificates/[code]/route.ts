import { NextResponse } from 'next/server'
import { getCertificate } from '@/lib/world/certificates'

export const dynamic = 'force-dynamic'

/** GET /api/certificates/:code — public verification (no sign-in). */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> })
{
    const { code } = await params
    const cert = await getCertificate(code)
    if (!cert) return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 })
    return NextResponse.json({ ok: true, valid: !cert.revoked, certificate: cert })
}
