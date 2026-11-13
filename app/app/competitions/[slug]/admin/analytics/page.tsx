import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { competitionAnalytics } from '@/lib/world/analytics'
import { getCompetitionDetail, isAdmin } from '@/lib/world/service'
import AnalyticsView from '@/components/app/world/admin/AnalyticsView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Analytics · Hubnovo World' }

/** Admin analytics: sign-ups, onboarding, activity, missions, review queue, tokens and pilot targets. */
export default async function AdminAnalyticsPage({ params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const { authUser, profile } = await getCurrentUser()
    if (!authUser) redirect(`/auth/login?next=/app/competitions/${slug}/admin/analytics`)
    if (!profile || !isAdmin(profile)) redirect(`/app/competitions/${slug}`)

    const [detail, res] = await Promise.all([getCompetitionDetail(slug, profile), competitionAnalytics(slug, profile)])
    if (!detail.ok) notFound()

    return (
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            {res.ok
                ? <AnalyticsView slug={slug} name={detail.competition.name} data={res.analytics} pathways={detail.competition.pathways} />
                : <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">{res.error}</p>}
        </div>
    )
}
