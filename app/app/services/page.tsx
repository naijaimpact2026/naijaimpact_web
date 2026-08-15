import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchServices } from '@/lib/actions/services'
import BusinessLaunchHome from '@/components/app/services/BusinessLaunchHome'
import type { SafeGoalSavings } from '@/lib/types'

export const dynamic = 'force-dynamic'

// ── Constants ────────────────────────────────────────────────────────────────

/** Default target for the 1-month business seed savings challenge */
const DEFAULT_SAVINGS_GOAL = 150_000
const CHALLENGE_DAYS = 30

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Days elapsed since a date, capped at totalDays. */
function daysSince(isoDate: string, totalDays: number): number
{
    const diff = Date.now() - new Date(isoDate).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return Math.min(Math.max(days, 0), totalDays)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ServicesPage()
{
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users')
        .select('id, display_name, naija_points')
        .eq('auth_id', authUser.id)
        .single()

    const userId = profile?.id ?? ''

    // ── Fetch data in parallel ────────────────────────────────────────────────
    const [
        { services },
        { data: myServices },
        { data: goalRows },
    ] = await Promise.all([
        // Equipment listings (all active services)
        fetchServices(null, 20),

        // User's own service listings
        supabase
            .from('services')
            .select('id, title, category, active, created_at')
            .eq('provider_id', userId)
            .order('created_at', { ascending: false })
            .limit(10),

        // User's goal savings — look for the business seed goal
        supabase
            .from('fintech_safe_goal_savings')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: true }),
    ])

    // ── Derive cooperative savings data ───────────────────────────────────────

    const goals = (goalRows ?? []) as SafeGoalSavings[]

    // Prefer a goal explicitly named "business" or "seed"; otherwise use the first active goal.
    const businessGoal =
        goals.find(g =>
            /business|seed/i.test(g.name)
        ) ?? goals[0] ?? null

    const savingsGoal = businessGoal?.target_amount ?? DEFAULT_SAVINGS_GOAL
    const savedAmount = businessGoal?.current_amount ?? 0
    const daysSaved = businessGoal
        ? daysSince(businessGoal.created_at, CHALLENGE_DAYS)
        : 0

    // Count formalized services (active listings act as proxy for formalized businesses)
    const formalizedCount = (myServices ?? []).filter(s => s.active).length

    return (
        <BusinessLaunchHome
            displayName={profile?.display_name ?? 'Entrepreneur'}
            services={services}
            myServices={myServices ?? []}
            savedAmount={savedAmount}
            savingsGoal={savingsGoal}
            daysSaved={daysSaved}
            totalDays={CHALLENGE_DAYS}
            applicationsCount={myServices?.length ?? 0}
            formalizedCount={formalizedCount}
        />
    )
}
