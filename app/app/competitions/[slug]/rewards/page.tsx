import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getCompetitionDetail, isAdmin } from '@/lib/world/service'
import { listRewards, myRedemptions } from '@/lib/world/rewards'
import { calmMotion } from '@/lib/world/ui'
import RewardsExchange from '@/components/app/world/rewards/RewardsExchange'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Rewards Exchange · Hubnovo World' }

/** Rewards Exchange: HubTokens balance, the catalogue and my redemptions. */
export default async function WorldRewardsPage({ params }: { params: Promise<{ slug: string }> })
{
    const { slug } = await params
    const { profile } = await getCurrentUser()
    if (!profile) redirect(`/auth/login?next=/app/competitions/${slug}/rewards`)
    const detail = await getCompetitionDetail(slug, profile)
    if (!detail.ok) notFound()
    const c = detail.competition
    if (!c.me) redirect(`/app/competitions/${slug}`)
    const [catalogue, mine] = await Promise.all([listRewards(slug, profile), myRedemptions(slug, profile)])
    if (!catalogue.ok || !mine.ok) notFound()
    const color = c.pathways.find((p) => p.key === c.me!.pathway)?.color ?? '#7C3AED'

    return (
        <div className={`w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 ${calmMotion(c.me) ? 'hw-reduce' : ''}`}>
            <div className="flex items-center justify-between gap-3">
                <Link href={`/app/competitions/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> {c.name}
                </Link>
                {isAdmin(profile) && (
                    <Link href={`/app/competitions/${slug}/admin/rewards`} className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
                        <Settings2 className="h-3.5 w-3.5 text-primary" /> Manage rewards
                    </Link>
                )}
            </div>
            <RewardsExchange slug={slug} enabled={catalogue.enabled} balance={catalogue.balance} rewards={catalogue.rewards} redemptions={mine.redemptions} color={color} />
        </div>
    )
}
