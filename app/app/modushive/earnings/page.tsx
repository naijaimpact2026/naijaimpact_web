import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getCreatorEarningsSummary } from '@/lib/actions/creator-earnings'
import { isCreatorOrAdmin } from '@/lib/modushive/config'
import CreatorEarningsDashboard from '@/components/app/modushive/earnings/CreatorEarningsDashboard'
import BecomeCreatorView from '@/components/app/modushive/BecomeCreatorView'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Creator Earnings Hub — NovoStream | Hubnovo',
    description:
        'Track your Day-One livestream earnings across tips, workshops, live shopping storefronts, and affiliate commissions with transparent fee breakdowns.',
}

export default async function CreatorEarningsPage() {
    const { profile, authUser } = await getCurrentUser()

    if (!authUser || !profile) {
        redirect('/login')
    }

    // Role-based gating: normal users see the Become a Creator onboarding view
    const isCreator = isCreatorOrAdmin(profile.role)

    if (!isCreator) {
        return (
            <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
                <BecomeCreatorView profile={profile} />
            </div>
        )
    }

    const earningsRes = await getCreatorEarningsSummary()

    if (!earningsRes.success || !earningsRes.data) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 py-12 text-center">
                <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 space-y-3">
                    <h2 className="text-lg font-bold text-destructive">
                        Unable to load Creator Earnings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {earningsRes.error || 'An unexpected error occurred while loading your earnings.'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            <CreatorEarningsDashboard
                initialSummary={earningsRes.data}
                profile={profile}
            />
        </div>
    )
}
