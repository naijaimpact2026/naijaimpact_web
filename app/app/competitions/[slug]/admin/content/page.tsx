import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { listAdminMissions, listRubrics } from '@/lib/world/admin-content'
import { getCompetitionDetail, isAdmin } from '@/lib/world/service'
import ContentEditor from '@/components/app/world/admin/ContentEditor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mission content · Hubnovo World' }

/*
 * Admin content editor: the curriculum lead writes, schedules, previews and
 * switches missions on/off for every week, edits rubrics and imports a whole
 * week as JSON. Admins only.
 */
export default async function AdminContentPage({ params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const { authUser, profile } = await getCurrentUser()
    if (!authUser) redirect(`/auth/login?next=/app/competitions/${slug}/admin/content`)
    if (!profile || !isAdmin(profile)) redirect(`/app/competitions/${slug}`)

    const [detail, missions, rubrics] = await Promise.all([
        getCompetitionDetail(slug, profile),
        listAdminMissions(slug, profile),
        listRubrics(slug, profile),
    ])
    if (!detail.ok || !missions.ok) notFound()

    return (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <ContentEditor
                slug={slug}
                name={detail.competition.name}
                weeks={missions.weeks}
                currentWeek={detail.competition.clock.week}
                pathways={detail.competition.pathways}
                missions={missions.missions}
                rubrics={rubrics.ok ? rubrics.rubrics : []}
            />
        </div>
    )
}
