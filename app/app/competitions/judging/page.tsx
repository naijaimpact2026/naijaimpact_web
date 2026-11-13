import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { isAdmin, reviewCounts, reviewQueue } from '@/lib/world/service'
import JudgingDesk from '@/components/app/world/judging/JudgingDesk'
import ReportsDesk from '@/components/app/world/judging/ReportsDesk'
import { countOpenReports, listReports } from '@/lib/world/reports'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Judging · Hubnovo World' }

/*
 * Judging desk for Hubnovo World (Campus): Sunday boss challenges, the
 * Week 4 finale, flagged AI reviews and appeals. Admins only for now —
 * judges get the admin role until a dedicated judge role exists.
 */
export default async function JudgingPage({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string }> })
{
    const { authUser, profile } = await getCurrentUser()
    if (!authUser) redirect('/auth/login?next=/app/competitions/judging')
    if (!profile || !isAdmin(profile)) redirect('/app/competitions')

    const sp = await searchParams
    const back = (
        <Link href="/app/competitions/campus" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Campus Competition
        </Link>
    )

    if (sp.tab === 'reports')
    {
        const [reports, counts] = await Promise.all([listReports(profile, { status: sp.status }), reviewCounts(profile)])
        return (
            <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
                {back}
                {reports.ok
                    ? <ReportsDesk key={sp.status ?? 'open'} enabled={reports.enabled} reports={reports.reports} counts={counts} open={reports.open} status={sp.status === 'actioned' || sp.status === 'dismissed' ? sp.status : 'open'} />
                    : <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">{reports.error}</p>}
            </div>
        )
    }

    const tab = sp.tab === 'appeals' ? 'appeals' : 'queue'
    const [res, reportsOpen] = await Promise.all([reviewQueue(profile, { appeals: tab === 'appeals', limit: 100 }), countOpenReports()])

    return (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
            {back}
            {res.ok
                ? <JudgingDesk key={tab} tab={tab} items={res.items} counts={res.counts} reportsOpen={reportsOpen} />
                : <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">{res.error}</p>}
        </div>
    )
}
