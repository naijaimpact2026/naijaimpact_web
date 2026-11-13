import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import QRCode from 'qrcode'
import type { CertificateView } from './types'

/*
 * Certificate artwork (PNG via next/og). A pure function of the certificate
 * record, so it can be rendered from sample data without touching the DB.
 * A4 landscape ratio (√2). Fonts are local TTF subsets (Latin, Latin
 * Extended, Vietnamese) so names like "Adéṣọlá Ọ̀ṣúndáre" render properly.
 */

export const CERT_WIDTH = 2000
export const CERT_HEIGHT = 1414

const FONT_DIR = path.join(process.cwd(), 'lib/world/certificate-fonts')
const FONT_FILES = [
    ['Inter', 400, 'inter-latin-400-normal'], ['Inter', 400, 'inter-latin-ext-400-normal'], ['Inter', 400, 'inter-vietnamese-400-normal'],
    ['Inter', 700, 'inter-latin-700-normal'], ['Inter', 700, 'inter-latin-ext-700-normal'], ['Inter', 700, 'inter-vietnamese-700-normal'],
    ['Playfair', 700, 'playfair-display-latin-700-normal'], ['Playfair', 700, 'playfair-display-latin-ext-700-normal'], ['Playfair', 700, 'playfair-display-vietnamese-700-normal'],
] as const

type Font = { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }
let fontsPromise: Promise<Font[]> | null = null
function loadFonts(): Promise<Font[]>
{
    fontsPromise ??= Promise.all(FONT_FILES.map(async ([name, weight, file]) =>
    {
        const buf = await readFile(path.join(FONT_DIR, `${file}.ttf`))
        return { name, weight, style: 'normal' as const, data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer }
    })).catch((e) => { fontsPromise = null; throw e })
    return fontsPromise
}

const NAVY = '#102A43'
const GOLD = '#B8902B'
const INK = '#1F2937'
const MUTED = '#6B7280'
const PAPER = '#FBF8F1'

const PATHWAY_COLOR: Record<string, string> = { career: '#2563EB', enterprise: '#16A34A' }

export async function renderCertificate(cert: CertificateView, headers: Record<string, string> = {}): Promise<ImageResponse>
{
    const [fonts, qrSvg] = await Promise.all([
        loadFonts(),
        QRCode.toString(cert.verifyUrl, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: NAVY, light: '#00000000' } }),
    ])
    const qr = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString('base64')}`
    const accent = PATHWAY_COLOR[cert.pathway] ?? NAVY
    const issued = new Date(cert.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })
    const code = cert.code.match(/.{1,4}/g)!.join('-')
    const nameSize = cert.holderName.length > 28 ? 84 : cert.holderName.length > 20 ? 100 : 116

    return new ImageResponse(
        (
            <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: PAPER, padding: 44, fontFamily: 'Inter' }}>
                <div style={{ flex: 1, display: 'flex', border: `6px solid ${NAVY}`, padding: 14 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', border: `2px solid ${GOLD}`, padding: '64px 96px 56px', position: 'relative' }}>
                        {/* Pathway ribbon */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, display: 'flex', backgroundColor: accent }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: NAVY, fontSize: 26, fontWeight: 700, letterSpacing: 8 }}>
                            <div style={{ width: 54, height: 2, backgroundColor: GOLD, display: 'flex' }} />
                            HUBNOVO WORLD · {cert.competitionName.toUpperCase()}
                            <div style={{ width: 54, height: 2, backgroundColor: GOLD, display: 'flex' }} />
                        </div>

                        <div style={{ display: 'flex', marginTop: 56, fontFamily: 'Playfair', fontSize: 88, color: NAVY }}>Certificate of Completion</div>
                        <div style={{ display: 'flex', marginTop: 40, fontSize: 30, color: MUTED }}>This certifies that</div>
                        <div style={{ display: 'flex', marginTop: 18, fontFamily: 'Playfair', fontSize: nameSize, color: INK, textAlign: 'center', lineHeight: 1.15 }}>{cert.holderName}</div>
                        <div style={{ display: 'flex', width: 760, height: 2, marginTop: 18, backgroundColor: GOLD }} />
                        {cert.institution && <div style={{ display: 'flex', marginTop: 22, fontSize: 30, color: MUTED }}>{cert.institution}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, fontSize: 34, color: INK, textAlign: 'center', lineHeight: 1.5 }}>
                            <div style={{ display: 'flex' }}>has completed&nbsp;<span style={{ fontWeight: 700 }}>Stage {cert.stage}: {cert.stageName}</span></div>
                            <div style={{ display: 'flex' }}>of the&nbsp;<span style={{ fontWeight: 700, color: accent }}>{cert.pathwayName}</span>&nbsp;pathway</div>
                        </div>
                        <div style={{ display: 'flex', marginTop: 34, maxWidth: 1180, fontSize: 25, color: MUTED, textAlign: 'center', lineHeight: 1.55 }}>
                            Awarded for four weeks of daily quests, real-world missions and judged boss challenges, completed with a stage score of {cert.score} out of 100.
                        </div>

                        {/* Footer: date · seal · verify */}
                        <div style={{ display: 'flex', width: '100%', marginTop: 'auto', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', width: 520 }}>
                                <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: INK }}>{issued}</div>
                                <div style={{ display: 'flex', width: 360, height: 2, backgroundColor: NAVY, marginTop: 12 }} />
                                <div style={{ display: 'flex', fontSize: 22, color: MUTED, marginTop: 10, letterSpacing: 2 }}>DATE ISSUED</div>
                            </div>

                            <div style={{ display: 'flex', width: 230, height: 230, borderRadius: 115, backgroundColor: NAVY, border: `8px solid ${GOLD}`, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <div style={{ display: 'flex', fontSize: 17, letterSpacing: 2, color: '#E9D8A6' }}>STAGE SCORE</div>
                                <div style={{ display: 'flex', fontFamily: 'Playfair', fontSize: 92, lineHeight: 1 }}>{cert.score}</div>
                                <div style={{ display: 'flex', fontSize: 22, color: '#E9D8A6' }}>out of 100</div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 22, width: 520 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <div style={{ display: 'flex', fontSize: 22, color: MUTED, letterSpacing: 2 }}>VERIFY THIS CERTIFICATE</div>
                                    <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: INK, marginTop: 8 }}>{code}</div>
                                    <div style={{ display: 'flex', fontSize: 22, color: MUTED, marginTop: 6 }}>{cert.verifyUrl.replace(/^https?:\/\//, '').replace(/\/certificates\/.*/, '/certificates')}</div>
                                </div>
                                {/* eslint-disable-next-line @next/next/no-img-element -- rendered by satori */}
                                <img src={qr} width={150} height={150} alt="" />
                            </div>
                        </div>
                        {cert.revoked && (
                            <div style={{ position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', fontSize: 140, fontWeight: 700, color: 'rgba(220,38,38,0.35)', transform: 'rotate(-12deg)' }}>REVOKED</div>
                        )}
                    </div>
                </div>
            </div>
        ),
        { width: CERT_WIDTH, height: CERT_HEIGHT, fonts, headers },
    )
}
