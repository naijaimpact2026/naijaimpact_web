import { createClient } from '@/lib/supabase/server'
import SafeDashboardClient from '@/components/app/fintech/safe/SafeDashboardClient'
import type { SafeFlexibleAccount, SafeLockedSavings, SafeGoalSavings } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SafePage()
{
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser)
    {
        return (
            <main className="max-w-4xl mx-auto px-4 py-8">
                <p className="text-muted-foreground">Please sign in to access NaijaSafe.</p>
            </main>
        )
    }

    // Resolve platform users.id
    const { data: profile } = await supabase
        .from('users')
        .select('id')
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

    // ── Fetch all savings data in parallel ───────────────────────────────────
    const [
        { data: flexibleAccounts },
        { data: lockedSavings },
        { data: goalSavings },
    ] = await Promise.all([
        supabase
            .from('fintech_safe_flexible_accounts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),

        supabase
            .from('fintech_safe_locked_savings')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),

        supabase
            .from('fintech_safe_goal_savings')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
    ])

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
                    <h1 className="text-3xl font-black text-white">NaijaSafe</h1>
                    <p className="text-sm mt-1 text-green-300/60">Your personal savings vault — flexible, locked and goal-based</p>
                </div>
            </div>
            <main className="max-w-4xl mx-auto px-4 py-6">
                <SafeDashboardClient
                    flexibleAccounts={(flexibleAccounts ?? []) as SafeFlexibleAccount[]}
                    lockedSavings={(lockedSavings ?? []) as SafeLockedSavings[]}
                    goalSavings={(goalSavings ?? []) as SafeGoalSavings[]}
                />
            </main>
        </div>
    )
}
