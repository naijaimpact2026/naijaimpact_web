import { createClient } from '@/lib/supabase/server'
import InsureDashboard from '@/components/app/fintech/insure/InsureDashboard'
import
{
    fetchInsureProducts,
    fetchUserPolicies,
    fetchUserClaims,
} from '@/lib/actions/fintech/insure'

export const dynamic = 'force-dynamic'

export default async function InsurePage()
{
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser)
    {
        return (
            <main className="max-w-4xl mx-auto px-4 py-8">
                <p className="text-muted-foreground">Please sign in to access NaijaInsure.</p>
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

    // Fetch all data in parallel
    const [products, policies, claims] = await Promise.all([
        fetchInsureProducts(),
        fetchUserPolicies(userId),
        fetchUserClaims(userId),
    ])

    // Compute summary stats
    const activePoliciesCount = policies.filter((p) => p.status === 'active').length
    const pendingClaimsCount = claims.filter((c) => c.status === 'pending').length

    // Next premium due: nearest end_date among active policies
    const activePoliciesSorted = policies
        .filter((p) => p.status === 'active')
        .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())

    const nextPremiumDue = activePoliciesSorted.length > 0
        ? activePoliciesSorted[0].end_date
        : null

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.18),transparent 70%)' }} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="max-w-5xl mx-auto px-5 pt-7 pb-8 relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">Fintech Hub</p>
                    <h1 className="text-3xl font-black text-white">NaijaInsure</h1>
                    <p className="text-sm mt-1 text-green-300/60">Micro-insurance for health, device, travel and life</p>
                </div>
            </div>
            <main className="max-w-5xl mx-auto px-4 py-6">
                <InsureDashboard
                    products={products}
                    policies={policies}
                    claims={claims}
                    activePoliciesCount={activePoliciesCount}
                    pendingClaimsCount={pendingClaimsCount}
                    nextPremiumDue={nextPremiumDue}
                    userEmail={authUser.email ?? ''}
                />
            </main>
        </div>
    )
}
