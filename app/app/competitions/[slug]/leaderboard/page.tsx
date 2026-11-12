import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getCompetitionDetail, institutionLeague, worldLeaderboard } from '@/lib/world/service'
import { calmMotion } from '@/lib/world/ui'
import WorldLeaderboard, { type BoardParams } from '@/components/app/world/leaderboard/WorldLeaderboard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Leaderboard · Hubnovo World' }

/** Players leaderboard (per pathway, by campus/state, all time or this week) and the campus vs campus league. */
export default async function WorldLeaderboardPage({ params, searchParams }: {
    params: Promise<{ slug: string }>
    searchParams: Promise<Record<string, string | undefined>>
})
{
    const { slug } = await params
    const sp = await searchParams
    const { profile } = await getCurrentUser()
    if (!profile) redirect(`/auth/login?next=/app/competitions/${slug}/leaderboard`)

    const detail = await getCompetitionDetail(slug, profile)
    if (!detail.ok) notFound()
    const c = detail.competition

    const view = sp.view === 'league' ? 'league' : 'players'
    const leaguePathway = sp.pathway === 'career' || sp.pathway === 'enterprise' ? sp.pathway : undefined
    const board = view === 'players'
        ? await worldLeaderboard(slug, profile, { pathway: sp.pathway, scope: sp.scope, value: sp.value, period: sp.period })
        : null
    const league = view === 'league' ? await institutionLeague(slug, profile, leaguePathway) : null
    if ((board && !board.ok) || (league && !league.ok)) notFound()

    const p: BoardParams = { view, pathway: sp.pathway, scope: sp.scope, value: sp.value, period: sp.period }

    return (
        <div className={`w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 ${calmMotion(c.me) ? 'hw-reduce' : ''}`}>
            <Link href={`/app/competitions/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {c.name}
            </Link>
            <WorldLeaderboard
                slug={slug}
                params={p}
                pathways={c.pathways}
                me={c.me}
                week={c.clock.week}
                board={board && board.ok ? board : null}
                league={league && league.ok ? league : null}
            />
        </div>
    )
}
