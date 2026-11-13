import { PDFDocument } from 'pdf-lib'
import { CERT_BASE_URL } from './certificates'
import { renderCertificate } from './certificate-art'
import type { CertificateView } from './types'

/** Sample certificate for local design previews (never served in production). */
export function sampleCertificate(name = 'Adéṣọlá Ọ̀ṣúndáre'): CertificateView
{
    return {
        code: 'K7MQ3XP9RT2B', verifyUrl: `${CERT_BASE_URL}/certificates/K7MQ-3XP9-RT2B`, imageUrl: '', pdfUrl: '',
        competitionName: 'Campus Competition', stage: 1, stageName: 'Discover & Define', pathway: 'career', pathwayName: 'Career & Employability',
        holderName: name, institution: 'University of Lagos', score: 78, issuedAt: '2026-12-06T12:00:00Z', revoked: false,
    }
}

export const fileName = (c: CertificateView, ext: 'png' | 'pdf') =>
    `hubnovo-certificate-stage-${c.stage}-${c.holderName.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'player'}.${ext}`

/** A4 landscape PDF with the certificate image filling the page. */
export async function certificatePdf(cert: CertificateView): Promise<Uint8Array>
{
    const png = await (await renderCertificate(cert)).arrayBuffer()
    const pdf = await PDFDocument.create()
    pdf.setTitle(`${cert.competitionName} certificate: ${cert.holderName}`)
    pdf.setSubject(`Stage ${cert.stage}: ${cert.stageName} (${cert.pathwayName})`)
    pdf.setAuthor('Hubnovo')
    pdf.setCreator('Hubnovo World')
    const img = await pdf.embedPng(png)
    const page = pdf.addPage([841.89, 595.28])
    page.drawImage(img, { x: 0, y: 0, width: 841.89, height: 595.28 })
    return pdf.save()
}
