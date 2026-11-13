'use client'

import { useState } from 'react'
import { Award, Check, CheckCircle2, Circle, Copy, Download, ExternalLink, FileText, Linkedin, Lock, Share2 } from 'lucide-react'
import { toast } from '@/components/toast'
import type { CertificateView, MyCertificatesView } from '@/lib/world/types'
import { AnimatedBar } from '../fx'

const pretty = (code: string) => code.match(/.{1,4}/g)!.join('-')

export default function WorldCertificates({ slug, view, color, pathwayName }: { slug: string; view: MyCertificatesView; color: string; pathwayName: string })
{
    if (!view.enabled)
        return (
            <section className="hw-rise rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                <Award className="mx-auto h-9 w-9 text-muted-foreground" />
                <h1 className="mt-3 text-lg font-bold text-foreground">Certificates are switching on soon</h1>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Finish a stage with 60+ and pass its finale to earn a verified certificate.</p>
            </section>
        )

    return (
        <div className="space-y-5">
            <section className="hw-rise relative overflow-hidden rounded-3xl p-5 text-white shadow-lg sm:p-6" style={{ background: `linear-gradient(135deg, ${color} 0%, #102A43 90%)` }}>
                <Award className="hw-float absolute -right-4 -top-4 h-32 w-32 text-white/10" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">{pathwayName}</p>
                <h1 className="text-2xl font-extrabold sm:text-3xl">My certificates</h1>
                <p className="mt-1 max-w-lg text-sm text-white/85">
                    Every 4-week stage you pass earns a certificate with a QR code anyone can scan to check it’s real. Add it to your CV and LinkedIn.
                </p>
            </section>

            {view.certificates.map((c, n) => <CertificateCard key={c.code} cert={c} color={color} delay={n * 80} />)}

            {view.next && <NextStage next={view.next} color={color} first={view.certificates.length === 0} slug={slug} />}
        </div>
    )
}

function CertificateCard({ cert, color, delay }: { cert: CertificateView; color: string; delay: number })
{
    const [copied, setCopied] = useState(false)
    const verifyPath = `/certificates/${pretty(cert.code)}`
    const issued = new Date(cert.issuedAt)
    const linkedIn = `https://www.linkedin.com/profile/add?${new URLSearchParams({
        startTask: 'CERTIFICATION_NAME',
        name: `${cert.competitionName}: Stage ${cert.stage} ${cert.stageName} (${cert.pathwayName})`,
        organizationName: 'Hubnovo',
        issueYear: String(issued.getUTCFullYear()),
        issueMonth: String(issued.getUTCMonth() + 1),
        certUrl: cert.verifyUrl,
        certId: pretty(cert.code),
    })}`

    async function copy()
    {
        try { await navigator.clipboard.writeText(cert.verifyUrl); setCopied(true); setTimeout(() => setCopied(false), 1800) }
        catch { toast.error('Could not copy the link.') }
    }
    async function share()
    {
        const text = `I completed Stage ${cert.stage}: ${cert.stageName} of the ${cert.pathwayName} pathway in the Hubnovo ${cert.competitionName} with ${cert.score}/100.`
        if (navigator.share) { try { await navigator.share({ title: 'My Hubnovo certificate', text, url: cert.verifyUrl }) } catch { /* cancelled */ } }
        else copy()
    }

    return (
        <article className="hw-rise overflow-hidden rounded-3xl border border-border bg-card" style={{ animationDelay: `${delay}ms` }}>
            <a href={verifyPath} target="_blank" rel="noopener noreferrer" className="block bg-muted/40 p-3 sm:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG */}
                <img src={`/api/certificates/${cert.code}/image`} alt={`Your Stage ${cert.stage} certificate`} width={2000} height={1414} className="hw-lift w-full rounded-2xl border border-border shadow-md" loading="lazy" />
            </a>
            <div className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>Stage {cert.stage} · {cert.pathwayName}</p>
                        <h2 className="text-lg font-extrabold text-foreground">{cert.stageName}</h2>
                        <p className="text-xs text-muted-foreground">
                            Issued {issued.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })} · Code <span className="font-mono font-bold text-foreground">{pretty(cert.code)}</span>
                        </p>
                    </div>
                    <span className="rounded-2xl px-3 py-1.5 text-center text-white" style={{ backgroundColor: color }}>
                        <span className="block text-xl font-extrabold leading-none tabular-nums">{cert.score}</span>
                        <span className="text-[10px] font-semibold opacity-85">stage score</span>
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <a href={`/api/certificates/${cert.code}/pdf`} className="hw-press inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: color }}><FileText className="h-4 w-4" /> PDF</a>
                    <a href={`/api/certificates/${cert.code}/image?download=1`} className="hw-press inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground hover:bg-muted"><Download className="h-4 w-4" /> Image</a>
                    <a href={linkedIn} target="_blank" rel="noopener noreferrer" className="hw-press inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground hover:bg-muted"><Linkedin className="h-4 w-4 text-[#0A66C2]" /> LinkedIn</a>
                    <button type="button" onClick={share} className="hw-press inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground hover:bg-muted"><Share2 className="h-4 w-4" /> Share</button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    <button type="button" onClick={copy} className="inline-flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy verification link</button>
                    <a href={verifyPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /> Open verification page</a>
                </div>
            </div>
        </article>
    )
}

function NextStage({ next, color, first, slug }: { next: NonNullable<MyCertificatesView['next']>; color: string; first: boolean; slug: string })
{
    const scoreOk = next.total >= next.passMark
    return (
        <section className="hw-rise rounded-3xl border border-dashed border-border bg-card p-5" style={{ animationDelay: '120ms' }}>
            <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Lock className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{first ? 'Your first certificate' : 'Next certificate'}</p>
                    <h2 className="text-base font-bold text-foreground">Stage {next.stage}: {next.stageName}</h2>
                    <p className="text-xs text-muted-foreground">Earned when you finish Week {next.finaleWeek}.</p>
                </div>
            </div>
            <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold"><span className="text-muted-foreground">Stage score</span><span className="tabular-nums text-foreground">{next.total} / pass {next.passMark}</span></div>
                <AnimatedBar pct={next.total} color={scoreOk ? '#16A34A' : color} className="mt-1 h-2" />
            </div>
            <ul className="mt-4 space-y-2 text-sm">
                <Req done={scoreOk}>Stage score of {next.passMark} or more</Req>
                <Req done={next.finalePassed}>Pass the Week {next.finaleWeek} finale (judged)</Req>
            </ul>
            <a href={`/app/competitions/${slug}`} className="mt-4 inline-flex text-xs font-bold hover:underline" style={{ color }}>Keep going with today’s quest →</a>
        </section>
    )
}

function Req({ done, children }: { done: boolean; children: React.ReactNode })
{
    return (
        <li className={`flex items-center gap-2 ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
            {done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4" />} {children}
        </li>
    )
}
