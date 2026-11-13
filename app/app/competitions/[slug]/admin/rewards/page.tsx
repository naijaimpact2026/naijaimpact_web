import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { adminListRedemptions, adminListRewards } from '@/lib/world/rewards'
import { getCompetitionDetail, isAdmin } from '@/lib/world/service'
import type { RedemptionStatus } from '@/lib/world/types'
import RewardsAdmin from '@/components/app/world/rewards/RewardsAdmin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Manage rewards · Hubnovo World' }

/** Admin: Rewards Exchange catalogue + redemptions to fulfil or cancel (refund). */
export default async function AdminRewardsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string }> })
{
    const { slug } = await params
    const { authUser, profile } = await getCurrentUser()
    if (!authUser) redirect(`/auth/login?next=/app/competitions/${slug}/admin/rewards`)
    if (!profile || !isAdmin(profile)) redirect(`/app/competitions/${slug}`)
    const s = (await searchParams).status
    const status: RedemptionStatus = s === 'fulfilled' || s === 'cancelled' ? s : 'pending'

    const [detail, rewards, redemptions] = await Promise.all([
        getCompetitionDetail(slug, profile),
        adminListRewards(slug, profile),
        adminListRedemptions(slug, profile, { status }),
    ])
    if (!detail.ok || !rewards.ok || !redemptions.ok) notFound()

    return (
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <RewardsAdmin
                slug={slug}
                name={detail.competition.name}
                enabled={rewards.enabled && redemptions.enabled}
                rewards={rewards.rewards}
                redemptions={redemptions.redemptions}
                counts={redemptions.counts}
                status={status}
            />
        </div>
    )
}
