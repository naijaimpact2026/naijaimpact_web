import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { normalizeRole } from '@/lib/modushive/config'
import { listPendingSubmissions } from '@/lib/competitions/queries'
import ReviewQueue from '@/components/app/competitions/ReviewQueue'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Review submissions · Hubnovo' }

export default async function CompetitionReviewPage()
{
    const { profile } = await getCurrentUser()
    if (!profile || normalizeRole(profile.role) !== 'admin') redirect('/app/competitions')

    const submissions = await listPendingSubmissions()

    return (
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
            <Link href="/app/competitions" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Competitions
            </Link>
            <div>
                <h1 className="text-xl font-bold text-foreground">Review queue</h1>
                <p className="text-sm text-muted-foreground">Approve proof missions to award XP. Each mission can only award XP once per person.</p>
            </div>
            <ReviewQueue submissions={submissions} />
        </div>
    )
}
