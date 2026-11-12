import type { Metadata } from 'next'
import Link from 'next/link'
import { cache } from 'react'
import { BadgeCheck, Download, FileText, ShieldAlert, ShieldCheck } from 'lucide-react'
import { formatCertCode, getCertificate, normalizeCertCode } from '@/lib/world/certificates'

/*
 * Public certificate verification: /certificates/<code>. Lives outside /app
 * so anyone (an employer, a school) can check a certificate without signing
 * in. Shows only what's printed on the certificate. Not indexed.
 */

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string }> }
const load = cache((code: string) => getCertificate(code))

export async function generateMetadata({ params }: Props): Promise<Metadata>
{
    const cert = await load((await params).code)
    const base = { robots: { index: false, follow: false } }
    if (!cert) return { ...base, title: 'Certificate not found · Hubnovo' }
    const title = `${cert.holderName}: ${cert.competitionName} certificate`
    const description = `Stage ${cert.stage}: ${cert.stageName}, ${cert.pathwayName} pathway. Stage score ${cert.score}/100. Verified by Hubnovo.`
    return {
        ...base, title: `${title} · Hubnovo`, description,
        openGraph: { title, description, images: [{ url: `/api/certificates/${cert.code}/image`, width: 2000, height: 1414 }] },
        twitter: { card: 'summary_large_image', title, description },
    }
}

export default async function CertificateVerifyPage({ params }: Props)
{
    const raw = (await params).code
    const cert = await load(raw)

    return (
        <main className="min-h-dvh bg-background px-4 py-8 sm:py-12">
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
                    {/* eslint-disable-next-line @next/next/no-img-element -- small logo */}
                    <img src="/logo.png" alt="" className="h-7 w-7 rounded-md" /> Hubnovo
                </Link>

                {!cert ? (
                    <section className="rounded-3xl border border-border bg-card p-8 text-center">
                        <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
                        <h1 className="mt-3 text-xl font-extrabold text-foreground">Certificate not found</h1>
                        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                            No Hubnovo certificate matches the code <span className="font-mono font-bold text-foreground">{normalizeCertCode(raw) ? formatCertCode(normalizeCertCode(raw)) : raw}</span>. Check the code printed under the QR code and try again.
                        </p>
                    </section>
                ) : (
                    <>
                        <section className={`flex flex-wrap items-center gap-3 rounded-3xl border p-4 sm:p-5 ${cert.revoked ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
                            {cert.revoked ? <ShieldAlert className="h-8 w-8 shrink-0 text-red-600" /> : <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-600" />}
                            <div className="min-w-0 flex-1">
                                <h1 className={`text-lg font-extrabold ${cert.revoked ? 'text-red-800 dark:text-red-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                                    {cert.revoked ? 'This certificate has been revoked' : 'Verified certificate'}
                                </h1>
                                <p className="text-sm text-foreground/80">
                                    {cert.revoked ? 'It is no longer valid.' : `Issued by Hubnovo to ${cert.holderName}.`} Code <span className="font-mono font-bold">{formatCertCode(cert.code)}</span>
                                </p>
                            </div>
                        </section>

                        {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG */}
                        <img src={`/api/certificates/${cert.code}/image`} alt={`Certificate for ${cert.holderName}`} width={2000} height={1414} className="w-full rounded-2xl border border-border shadow-lg" />

                        <section className="grid gap-4 rounded-3xl border border-border bg-card p-5 sm:grid-cols-2">
                            <Detail label="Awarded to" value={cert.holderName} />
                            <Detail label="Campus" value={cert.institution ?? 'Not stated'} />
                            <Detail label="Programme" value={`${cert.competitionName} (Hubnovo World)`} />
                            <Detail label="Pathway" value={cert.pathwayName} />
                            <Detail label="Completed" value={`Stage ${cert.stage}: ${cert.stageName}`} />
                            <Detail label="Stage score" value={`${cert.score} / 100 (pass mark 60)`} />
                            <Detail label="Issued" value={new Date(cert.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })} />
                            <Detail label="How it's earned" value="Four weeks of daily quests and real-world missions, AI-reviewed work and judged boss challenges." />
                        </section>

                        {!cert.revoked && (
                            <div className="flex flex-wrap gap-2">
                                <a href={`/api/certificates/${cert.code}/pdf`} className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"><FileText className="h-4 w-4" /> Download PDF</a>
                                <a href={`/api/certificates/${cert.code}/image?download=1`} className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted"><Download className="h-4 w-4" /> Download image</a>
                            </div>
                        )}
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><BadgeCheck className="h-4 w-4" /> This page is the official record. A certificate is only valid if its code shows here.</p>
                    </>
                )}
            </div>
        </main>
    )
}

function Detail({ label, value }: { label: string; value: string })
{
    return (
        <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
        </div>
    )
}
