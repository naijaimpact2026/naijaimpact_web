import { getCertificate } from '@/lib/world/certificates'
import { renderCertificate } from '@/lib/world/certificate-art'
import { fileName, sampleCertificate } from '@/lib/world/certificate-files'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/certificates/:code/image — the certificate as a PNG (public; ?download=1 to save). Local dev: code "preview" (&name=) renders a sample. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> })
{
    const { code } = await params
    const q = new URL(request.url).searchParams
    const cert = code === 'preview' && process.env.NODE_ENV !== 'production' ? sampleCertificate(q.get('name') ?? undefined) : await getCertificate(code)
    if (!cert) return new Response('Certificate not found', { status: 404 })
    return renderCertificate(cert, {
        'Cache-Control': 'public, max-age=3600',
        ...(q.get('download') ? { 'Content-Disposition': `attachment; filename="${fileName(cert, 'png')}"` } : {}),
    })
}
