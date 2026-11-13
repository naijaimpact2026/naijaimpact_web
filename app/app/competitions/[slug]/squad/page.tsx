import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getCompetitionDetail } from '@/lib/world/service'
import { getMySquad } from '@/lib/world/squads'
import { calmMotion } from '@/lib/world/ui'
import SquadPanel from '@/components/app/world/squad/SquadPanel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My squad · Hubnovo World' }

/** Squad: create or join (by invite code), members, this week's team mission and the squad chat. */
export default async function WorldSquadPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ code?: string }> })
{
    const { slug } = await params
    const { code } = await searchParams
    const { profile } = await getCurrentUser()
    if (!profile) redirect(`/auth/login?next=/app/competitions/${slug}/squad${code ? `?code=${encodeURIComponent(code)}` : ''}`)

    const detail = await getCompetitionDetail(slug, profile)
    if (!detail.ok) notFound()
    const c = detail.competition
    if (!c.me) redirect(`/app/competitions/${slug}`)
    const res = await getMySquad(slug, profile)
    if (!res.ok) notFound()
    const pathway = c.pathways.find((p) => p.key === c.me!.pathway)!

    return (
        <div className={`w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 ${calmMotion(c.me) ? 'hw-reduce' : ''}`}>
            <Link href={`/app/competitions/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {c.name}
            </Link>
            <SquadPanel slug={slug} enabled={res.enabled} squad={res.squad} pathway={{ key: pathway.key, name: pathway.name, color: pathway.color }} inviteCode={code ?? null} />
        </div>
    )
}
