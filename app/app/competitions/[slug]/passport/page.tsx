import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getCompetitionDetail, getProgress, listQuests } from '@/lib/world/service'
import { calmMotion } from '@/lib/world/ui'
import WorldPassport from '@/components/app/world/passport/WorldPassport'

export const dynamic = 'force-dynamic'

/** Passport / My Progress: level, stage readiness, badges and the player's portfolio of passed missions. */
export default async function WorldPassportPage({ params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const { profile } = await getCurrentUser()
    if (!profile) redirect(`/auth/login?next=/app/competitions/${slug}/passport`)

    const detail = await getCompetitionDetail(slug, profile)
    if (!detail.ok) notFound()
    const c = detail.competition
    if (!c.me) redirect(`/app/competitions/${slug}`)

    // Mission views are computed once per request (React cache), so reading every week is cheap.
    const weeks = Array.from({ length: c.weeks }, (_, i) => i + 1)
    const [progressRes, ...weekRes] = await Promise.all([getProgress(slug, profile), ...weeks.map((w) => listQuests(slug, profile, w))])
    if (!progressRes.ok) notFound()
    const missions = weekRes.flatMap((r) => (r.ok ? r.missions : []))

    return (
        <div className={`w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 ${calmMotion(c.me) ? 'hw-reduce' : ''}`}>
            <Link href={`/app/competitions/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {c.name}
            </Link>
            <WorldPassport competition={c} profile={profile} progress={progressRes.progress} missions={missions} />
        </div>
    )
}
