import { getCertificate } from '@/lib/world/certificates'
import { certificatePdf, fileName, sampleCertificate } from '@/lib/world/certificate-files'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/certificates/:code/pdf — the certificate as an A4 landscape PDF (public). */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> })
{
    const { code } = await params
    const q = new URL(request.url).searchParams
    const cert = code === 'preview' && process.env.NODE_ENV !== 'production' ? sampleCertificate(q.get('name') ?? undefined) : await getCertificate(code)
    if (!cert) return new Response('Certificate not found', { status: 404 })
    const pdf = await certificatePdf(cert)
    return new Response(Buffer.from(pdf), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `${q.get('inline') ? 'inline' : 'attachment'}; filename="${fileName(cert, 'pdf')}"`,
            'Cache-Control': 'public, max-age=3600',
        },
    })
}
