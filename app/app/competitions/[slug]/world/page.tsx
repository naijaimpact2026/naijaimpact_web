import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getCompetitionDetail, getProgress, listQuests } from '@/lib/world/service'
import { squadSummary } from '@/lib/world/squads'
import { calmMotion } from '@/lib/world/ui'
import type { WorldMissionLite } from '@/lib/world/districts'
import CampusWorld from '@/components/app/world/campus3d/CampusWorld'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Hubnovo World · 3D Campus' }

/** The 3D Campus: walk your avatar between districts; each district holds this week's quests of that type. */
export default async function WorldMapPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ week?: string }> })
{
    const { slug } = await params
    const { profile } = await getCurrentUser()
    if (!profile) redirect(`/auth/login?next=/app/competitions/${slug}/world`)
    const detail = await getCompetitionDetail(slug, profile)
    if (!detail.ok) notFound()
    const c = detail.competition
    if (!c.me) redirect(`/app/competitions/${slug}`)

    const asked = Number((await searchParams).week)
    const week = Number.isInteger(asked) && asked >= 1 && asked <= c.weeks ? asked : undefined
    const [quests, progress, squad] = await Promise.all([listQuests(slug, profile, week), getProgress(slug, profile), squadSummary(c.id, profile.id)])
    if (!quests.ok) notFound()

    const missions: WorldMissionLite[] = quests.missions.map((m) => ({
        id: m.id, title: m.title, kind: m.kind, pathway: m.pathway, week: m.week, day: m.day,
        xp: m.xp, tokens: m.tokens, status: m.status, unlocksAt: m.unlocksAt, estMinutes: m.estMinutes,
    }))
    const pathway = c.pathways.find((p) => p.key === c.me!.pathway)!

    return (
        <div className={`w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 ${calmMotion(c.me) ? 'hw-reduce' : ''}`}>
            <CampusWorld
                slug={slug}
                competitionName={c.name}
                week={quests.week ?? 1}
                currentWeek={c.clock.week}
                totalWeeks={c.weeks}
                pathway={{ key: pathway.key, name: pathway.name, color: pathway.color }}
                character={c.me.avatar.character}
                missions={missions}
                xp={progress.ok ? progress.progress.xp : 0}
                tokens={progress.ok ? progress.progress.tokens : 0}
                badges={progress.ok ? progress.progress.badges.length : 0}
                squad={squad}
                lite={Boolean(c.me.accessibility.lite)}
            />
        </div>
    )
}
