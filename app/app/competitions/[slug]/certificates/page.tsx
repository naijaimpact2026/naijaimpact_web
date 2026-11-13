import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getCompetitionDetail } from '@/lib/world/service'
import { myCertificates } from '@/lib/world/certificates'
import { calmMotion } from '@/lib/world/ui'
import WorldCertificates from '@/components/app/world/certificates/WorldCertificates'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My certificates · Hubnovo World' }

/** The player's stage certificates (download, share, verify) and progress towards the next one. */
export default async function WorldCertificatesPage({ params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const { profile } = await getCurrentUser()
    if (!profile) redirect(`/auth/login?next=/app/competitions/${slug}/certificates`)
    const detail = await getCompetitionDetail(slug, profile)
    if (!detail.ok) notFound()
    const c = detail.competition
    if (!c.me) redirect(`/app/competitions/${slug}`)
    const res = await myCertificates(slug, profile)
    if (!res.ok) notFound()
    const pathway = c.pathways.find((p) => p.key === c.me!.pathway)!

    return (
        <div className={`w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 ${calmMotion(c.me) ? 'hw-reduce' : ''}`}>
            <Link href={`/app/competitions/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {c.name}
            </Link>
            <WorldCertificates slug={slug} view={res} color={pathway.color} pathwayName={pathway.name} />
        </div>
    )
}
