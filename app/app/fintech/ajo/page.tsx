import { createClient } from '@/lib/supabase/server'
import AjoDashboardClient from '@/components/app/fintech/ajo/AjoDashboardClient'
import type {
    AjoGroup,
    AjoMember,
    AjoContribution,
    AjoPayoutSchedule,
    AjoDispute,
    User,
} from '@/lib/types'

export const dynamic = 'force-dynamic'

// ─── Joined types for data fetching ─────────────────────────────────────────

export type AjoGroupWithMembership = AjoGroup & {
    member: Pick<AjoMember, 'id' | 'payout_position' | 'status'>
    member_count: number
}

export type PendingContribution = {
    groupId: string
    groupName: string
    memberId: string
    cycle: number
    amount: number
}

export type UpcomingPayout = AjoPayoutSchedule & {
    group_name: string
}

export type OpenDispute = AjoDispute & {
    group_name: string
    raised_by_username: string | null
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AjoPage()
{
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser)
    {
        return (
            <main className="max-w-4xl mx-auto px-4 py-8">
                <p className="text-muted-foreground">Please sign in to access NaijaAjo.</p>
            </main>
        )
    }

    // Resolve platform users.id
    const { data: profile } = await supabase
        .from('users')
        .select('id, username, display_name')
        .eq('auth_id', authUser.id)
        .single()

    if (!profile)
    {
        return (
            <main className="max-w-4xl mx-auto px-4 py-8">
                <p className="text-muted-foreground">Profile not found.</p>
            </main>
        )
    }

    const userId = profile.id

    // ── Fetch memberships + groups ───────────────────────────────────────────
    const { data: memberships } = await supabase
        .from('fintech_ajo_members')
        .select('id, group_id, payout_position, status')
        .eq('user_id', userId)
        .eq('status', 'active')

    const groupIds = (memberships ?? []).map((m: Pick<AjoMember, 'group_id'>) => m.group_id)

    let groups: AjoGroupWithMembership[] = []

    if (groupIds.length > 0)
    {
        const { data: groupRows } = await supabase
            .from('fintech_ajo_groups')
            .select('*')
            .in('id', groupIds)
            .eq('status', 'active')

        if (groupRows)
        {
            // Fetch member counts for each group
            const memberCountPromises = groupRows.map(async (g: AjoGroup) =>
            {
                const { count } = await supabase
                    .from('fintech_ajo_members')
                    .select('id', { count: 'exact', head: true })
                    .eq('group_id', g.id)
                    .eq('status', 'active')
                return { groupId: g.id, count: count ?? 0 }
            })
            const memberCounts = await Promise.all(memberCountPromises)
            const countMap: Record<string, number> = {}
            memberCounts.forEach(({ groupId, count }) =>
            {
                countMap[groupId] = count
            })

            groups = groupRows.map((g: AjoGroup) =>
            {
                const member = (memberships ?? []).find(
                    (m: Pick<AjoMember, 'group_id' | 'id' | 'payout_position' | 'status'>) =>
                        m.group_id === g.id
                )
                return {
                    ...g,
                    member: {
                        id: member?.id ?? '',
                        payout_position: member?.payout_position ?? 1,
                        status: member?.status ?? 'active',
                    },
                    member_count: countMap[g.id] ?? 0,
                }
            })
        }
    }

    // ── Fetch pending contributions (current cycle, not yet paid by this user) ──
    const pendingContributions: PendingContribution[] = []

    for (const g of groups)
    {
        if (!g.member.id) continue

        const { data: existing } = await supabase
            .from('fintech_ajo_contributions')
            .select('id')
            .eq('group_id', g.id)
            .eq('member_id', g.member.id)
            .eq('cycle', g.current_cycle)
            .eq('status', 'paid')
            .maybeSingle()

        if (!existing)
        {
            pendingContributions.push({
                groupId: g.id,
                groupName: g.name,
                memberId: g.member.id,
                cycle: g.current_cycle,
                amount: g.contribution_amount,
            })
        }
    }

    // ── Fetch upcoming payouts (where this user is recipient, status pending) ───
    let upcomingPayouts: UpcomingPayout[] = []

    if (groupIds.length > 0)
    {
        const { data: payoutRows } = await supabase
            .from('fintech_ajo_payout_schedule')
            .select('*')
            .eq('recipient_id', userId)
            .eq('status', 'pending')
            .in('group_id', groupIds)
            .order('due_date', { ascending: true })

        if (payoutRows)
        {
            upcomingPayouts = (payoutRows as AjoPayoutSchedule[]).map((row) =>
            {
                const grp = groups.find((g) => g.id === row.group_id)
                return { ...row, group_name: grp?.name ?? 'Unknown Group' }
            })
        }
    }

    // ── Fetch open disputes for user's groups ─────────────────────────────────
    let openDisputes: OpenDispute[] = []

    if (groupIds.length > 0)
    {
        const { data: disputeRows } = await supabase
            .from('fintech_ajo_disputes')
            .select('*')
            .in('group_id', groupIds)
            .eq('status', 'open')
            .order('created_at', { ascending: false })

        if (disputeRows)
        {
            // Fetch raisers' usernames
            const raiserIds = [...new Set((disputeRows as AjoDispute[]).map((d) => d.raised_by))]
            let raisers: Pick<User, 'id' | 'username'>[] = []

            if (raiserIds.length > 0)
            {
                const { data: raiserRows } = await supabase
                    .from('users')
                    .select('id, username')
                    .in('id', raiserIds)
                raisers = (raiserRows ?? []) as Pick<User, 'id' | 'username'>[]
            }

            openDisputes = (disputeRows as AjoDispute[]).map((d) =>
            {
                const grp = groups.find((g) => g.id === d.group_id)
                const raiser = raisers.find((r) => r.id === d.raised_by)
                return {
                    ...d,
                    group_name: grp?.name ?? 'Unknown Group',
                    raised_by_username: raiser?.username ?? null,
                }
            })
        }
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.18),transparent 70%)' }} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="max-w-4xl mx-auto px-5 pt-7 pb-8 relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">Fintech Hub</p>
                    <h1 className="text-3xl font-black text-white">NaijaAjo</h1>
                    <p className="text-sm mt-1 text-green-300/60">Digital cooperative savings — save together, win together</p>
                </div>
            </div>
            <main className="max-w-4xl mx-auto px-4 py-6">
                <AjoDashboardClient
                    groups={groups}
                    pendingContributions={pendingContributions}
                    upcomingPayouts={upcomingPayouts}
                    openDisputes={openDisputes}
                    currentUserId={userId}
                />
            </main>
        </div>
    )
}
