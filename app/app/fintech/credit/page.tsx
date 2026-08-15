import { createClient } from '@/lib/supabase/server'
import CreditDashboard from '@/components/app/fintech/credit/CreditDashboard'
import type { LoanProduct, LoanApplication, Loan, LoanRepayment } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CreditPage()
{
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser)
    {
        return (
            <main className="max-w-4xl mx-auto px-4 py-8">
                <p className="text-muted-foreground">Please sign in to access NaijaCredit.</p>
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

    // ── Fetch all credit data in parallel ────────────────────────────────────
    const [
        { data: loanProducts },
        { data: loanApplications },
        { data: loans },
    ] = await Promise.all([
        supabase
            .from('fintech_credit_loan_products')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: true }),

        supabase
            .from('fintech_credit_loan_applications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),

        supabase
            .from('fintech_credit_loans')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
    ])

    const typedLoans = (loans ?? []) as Loan[]
    const loanIds = typedLoans.map((l) => l.id)

    // Fetch repayments for all user loans
    let repayments: LoanRepayment[] = []
    if (loanIds.length > 0)
    {
        const { data: reps } = await supabase
            .from('fintech_credit_repayments')
            .select('*')
            .in('loan_id', loanIds)
            .order('due_date', { ascending: true })
        repayments = (reps ?? []) as LoanRepayment[]
    }

    const typedApplications = (loanApplications ?? []) as LoanApplication[]

    // ── Compute summary stats ─────────────────────────────────────────────────
    const pendingApplicationsCount = typedApplications.filter((a) => a.status === 'pending').length
    const activeLoansCount = typedLoans.filter((l) => l.status === 'active').length

    const outstandingRepayments = repayments.filter(
        (r) => r.status === 'pending' || r.status === 'overdue'
    )
    const totalOutstandingBalance = outstandingRepayments.reduce(
        (sum, r) => sum + r.amount + r.late_fee,
        0
    )

    const nextRepaymentDate =
        outstandingRepayments.length > 0
            ? outstandingRepayments.sort(
                (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            )[0].due_date
            : null

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
                    <h1 className="text-3xl font-black text-white">NaijaCredit</h1>
                    <p className="text-sm mt-1 text-green-300/60">Micro-lending powered by your TradeCred score</p>
                </div>
            </div>
            <main className="max-w-4xl mx-auto px-4 py-6">
                <CreditDashboard
                    loanProducts={(loanProducts ?? []) as LoanProduct[]}
                    loanApplications={typedApplications}
                    loans={typedLoans}
                    repayments={repayments}
                    pendingApplicationsCount={pendingApplicationsCount}
                    activeLoansCount={activeLoansCount}
                    totalOutstandingBalance={totalOutstandingBalance}
                    nextRepaymentDate={nextRepaymentDate}
                />
            </main>
        </div>
    )
}
