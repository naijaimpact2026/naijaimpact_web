import Link from 'next/link'
import
{
    Users2, PiggyBank, BarChart2, CreditCard, Shield,
    ArrowRight, Calendar, TrendingUp, Zap, ChevronRight,
    Landmark, Star, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type {
    AjoMember, AjoGroup, SafeFlexibleAccount, SafeLockedSavings,
    SafeGoalSavings, TradeCredScore, TradeCredTier, Loan, LoanRepayment, Policy,
} from '@/lib/types'

export const dynamic = 'force-dynamic'

function fmtNGN(n: number): string
{
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}
function fmtDate(d: string | null | undefined): string
{
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) }
    catch { return '—' }
}

const TIER_COLOR: Record<TradeCredTier, string> = {
    starter: '#6b7280', bronze: '#d97706', silver: '#94a3b8', gold: '#eab308', platinum: '#7c3aed',
}
const TIER_LABEL: Record<TradeCredTier, string> = {
    starter: 'Starter', bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum',
}

export default async function FintechPage()
{
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    let userId = ''
    if (authUser)
    {
        const { data: profile } = await supabase.from('users').select('id').eq('auth_id', authUser.id).single()
        userId = profile?.id ?? ''
    }

    // ── NaijaAjo ────────────────────────────────────────────────────────────
    let ajoActiveGroups = 0, ajoNextDate: string | null = null, ajoTotalCollected = 0
    if (userId)
    {
        const { data: ajoMembers } = await supabase
            .from('fintech_ajo_members').select('group_id,status')
            .eq('user_id', userId).eq('status', 'active') as { data: Pick<AjoMember, 'group_id' | 'status'>[] | null }
        if (ajoMembers?.length)
        {
            const { data: ajoGroups } = await supabase
                .from('fintech_ajo_groups').select('id,status,start_date,frequency,total_collected')
                .in('id', ajoMembers.map(m => m.group_id)).eq('status', 'active') as { data: Pick<AjoGroup, 'id' | 'status' | 'start_date' | 'frequency' | 'total_collected'>[] | null }
            ajoActiveGroups = ajoGroups?.length ?? 0
            ajoTotalCollected = (ajoGroups ?? []).reduce((s, g) => s + (g.total_collected ?? 0), 0)
            if (ajoGroups?.length)
                ajoNextDate = [...ajoGroups].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0].start_date
        }
    }

    // ── NaijaSafe ───────────────────────────────────────────────────────────
    let safeTotalBalance = 0, safeAccountsCount = 0
    if (userId)
    {
        const [{ data: flex }, { data: locked }, { data: goals }] = await Promise.all([
            supabase.from('fintech_safe_flexible_accounts').select('balance').eq('user_id', userId),
            supabase.from('fintech_safe_locked_savings').select('amount').eq('user_id', userId),
            supabase.from('fintech_safe_goal_savings').select('current_amount').eq('user_id', userId),
        ])
        safeTotalBalance =
            ((flex as Pick<SafeFlexibleAccount, 'balance'>[] ?? [])).reduce((s, r) => s + (r.balance ?? 0), 0)
            + ((locked as Pick<SafeLockedSavings, 'amount'>[] ?? [])).reduce((s, r) => s + (r.amount ?? 0), 0)
            + ((goals as Pick<SafeGoalSavings, 'current_amount'>[] ?? [])).reduce((s, r) => s + (r.current_amount ?? 0), 0)
        safeAccountsCount = (flex?.length ?? 0) + (locked?.length ?? 0) + (goals?.length ?? 0)
    }

    // ── TradeCred ───────────────────────────────────────────────────────────
    let tradeCredScore = 0, tradeCredTier: TradeCredTier = 'starter'
    if (userId)
    {
        const { data: scoreRow } = await supabase
            .from('fintech_tradecred_scores').select('score,tier')
            .eq('user_id', userId).single() as { data: Pick<TradeCredScore, 'score' | 'tier'> | null }
        if (scoreRow) { tradeCredScore = scoreRow.score ?? 0; tradeCredTier = scoreRow.tier ?? 'starter' }
    }

    // ── NaijaCredit ─────────────────────────────────────────────────────────
    let activeLoansCount = 0, nextRepaymentDate: string | null = null, outstandingBalance = 0
    if (userId)
    {
        const { data: loans } = await supabase
            .from('fintech_credit_loans').select('id,status').eq('user_id', userId).eq('status', 'active') as { data: Pick<Loan, 'id' | 'status'>[] | null }
        activeLoansCount = loans?.length ?? 0
        if (loans?.length)
        {
            const { data: reps } = await supabase
                .from('fintech_credit_repayments').select('due_date,status,amount,late_fee')
                .in('loan_id', loans.map(l => l.id))
                .in('status', ['pending', 'overdue'])
                .order('due_date', { ascending: true }) as { data: Pick<LoanRepayment, 'due_date' | 'status' | 'amount' | 'late_fee'>[] | null }
            nextRepaymentDate = reps?.[0]?.due_date ?? null
            outstandingBalance = (reps ?? []).reduce((s, r) => s + (r.amount ?? 0) + (r.late_fee ?? 0), 0)
        }
    }

    // ── NaijaInsure ─────────────────────────────────────────────────────────
    let activePoliciesCount = 0, nextPremiumDue: string | null = null
    if (userId)
    {
        const { data: policies } = await supabase
            .from('fintech_insure_policies').select('id,status,end_date')
            .eq('user_id', userId).eq('status', 'active') as { data: Pick<Policy, 'id' | 'status' | 'end_date'>[] | null }
        activePoliciesCount = policies?.length ?? 0
        if (policies?.length)
            nextPremiumDue = [...policies].sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())[0].end_date
    }

    const scorePercent = Math.round((tradeCredScore / 1000) * 100)

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* ════════════════════════════════════════════════
                HERO — dark green, matches WalletPanel style
            ════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.18),transparent 70%)' }} />
                <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(134,239,172,.12),transparent 70%)' }} />
                {/* Grid overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 px-5 pt-7 pb-8 max-w-5xl mx-auto">
                    {/* Label row */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">Hubnovo</p>
                            <h1 className="text-3xl font-black text-white leading-tight">Fintech Hub</h1>
                            <p className="text-sm text-green-300/60 mt-1">Your complete financial suite</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-green-300" />
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 pt-5"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl sm:text-3xl font-black text-white">{fmtNGN(safeTotalBalance)}</span>
                            <span className="text-[11px] flex items-center gap-1 text-green-400">
                                <TrendingUp className="w-3 h-3 shrink-0" /> Total Saved
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl sm:text-3xl font-black text-white">{tradeCredScore}</span>
                            <span className="text-[11px] flex items-center gap-1 text-green-400">
                                <Zap className="w-3 h-3 shrink-0" /> Credit Score
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl sm:text-3xl font-black text-white">{activePoliciesCount}</span>
                            <span className="text-[11px] flex items-center gap-1 text-green-400">
                                <Shield className="w-3 h-3 shrink-0" /> Active Policies
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════════
                SCROLLABLE CONTENT
            ════════════════════════════════════════════════ */}
            <div className="px-4 py-5 max-w-5xl mx-auto space-y-5">

                {/* ── Quick Access Grid ─────────────────────── */}
                <section>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Access</p>
                    <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        {([
                            { href: '/app/fintech/ajo', icon: Users2, label: 'NaijaAjo', iconCls: 'bg-emerald-100 text-emerald-700' },
                            { href: '/app/fintech/safe', icon: PiggyBank, label: 'NaijaSafe', iconCls: 'bg-sky-100 text-sky-700' },
                            { href: '/app/fintech/tradecred', icon: BarChart2, label: 'TradeCred', iconCls: 'bg-violet-100 text-violet-700' },
                            { href: '/app/fintech/credit', icon: CreditCard, label: 'NaijaCredit', iconCls: 'bg-orange-100 text-orange-700' },
                            { href: '/app/fintech/insure', icon: Shield, label: 'NaijaInsure', iconCls: 'bg-teal-100 text-teal-700' },
                        ] as const).map(({ href, icon: Icon, label, iconCls }) => (
                            <Link key={href} href={href}
                                className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl bg-white hover:bg-green-50 border border-gray-100 hover:border-green-200 shadow-sm hover:shadow-md transition-all group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${iconCls}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-gray-700 text-center leading-tight">{label}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ── Product Detail Cards ──────────────────── */}
                <section>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Products</p>
                    <div className="space-y-3">

                        {/* NaijaAjo Card */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-100 text-emerald-700">
                                        <Users2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">NaijaAjo</p>
                                        <p className="text-[11px] text-gray-400">Cooperative savings</p>
                                    </div>
                                </div>
                                <Link href="/app/fintech/ajo"
                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                                    Open <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="px-5 py-4 grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xl font-black text-gray-900">{ajoActiveGroups}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Active groups</p>
                                </div>
                                <div>
                                    <p className="text-xl font-black text-gray-900">{fmtNGN(ajoTotalCollected)}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Total collected</p>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />{fmtDate(ajoNextDate)}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Next cycle</p>
                                </div>
                            </div>
                            {ajoActiveGroups === 0 && (
                                <div className="px-5 pb-4">
                                    <Link href="/app/fintech/ajo"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 border-dashed border-green-200 text-green-700 hover:bg-green-50 transition-colors">
                                        <Users2 className="w-4 h-4" /> Join or Create a Group
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* NaijaSafe Card */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-sky-100 text-sky-700">
                                        <PiggyBank className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">NaijaSafe</p>
                                        <p className="text-[11px] text-gray-400">Personal savings vault</p>
                                    </div>
                                </div>
                                <Link href="/app/fintech/safe"
                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white bg-sky-500 hover:bg-sky-600 transition-colors">
                                    Open <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="px-5 py-4 grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xl font-black text-gray-900">{fmtNGN(safeTotalBalance)}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Total balance</p>
                                </div>
                                <div>
                                    <p className="text-xl font-black text-gray-900">{safeAccountsCount}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Accounts</p>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-sky-600">Flexible · Locked · Goals</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Account types</p>
                                </div>
                            </div>
                            {safeAccountsCount === 0 && (
                                <div className="px-5 pb-4">
                                    <Link href="/app/fintech/safe"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 border-dashed border-sky-200 text-sky-700 hover:bg-sky-50 transition-colors">
                                        <PiggyBank className="w-4 h-4" /> Start Saving Today
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* TradeCred Card */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-violet-100 text-violet-700">
                                        <BarChart2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">TradeCred</p>
                                        <p className="text-[11px] text-gray-400">Alternative credit score</p>
                                    </div>
                                </div>
                                <Link href="/app/fintech/tradecred"
                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white bg-violet-600 hover:bg-violet-700 transition-colors">
                                    View Score <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="px-5 py-4 space-y-3">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-4xl font-black text-gray-900">{tradeCredScore}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">out of 1,000</p>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-white"
                                        style={{ background: TIER_COLOR[tradeCredTier] }}>
                                        {TIER_LABEL[tradeCredTier]} Tier
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] text-gray-400">
                                        <span>Score progress</span><span>{scorePercent}%</span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${scorePercent}%`, background: `linear-gradient(90deg,${TIER_COLOR[tradeCredTier]},${TIER_COLOR[tradeCredTier]}aa)` }} />
                                    </div>
                                </div>
                                <p className="text-xs text-purple-600 font-semibold">
                                    Loan eligibility: up to {tradeCredScore >= 900 ? '₦500K' : tradeCredScore >= 700 ? '₦250K' : tradeCredScore >= 500 ? '₦100K' : tradeCredScore >= 300 ? '₦50K' : '₦10K'}
                                </p>
                            </div>
                        </div>

                        {/* Bottom row: Credit + Insure side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                            {/* NaijaCredit Card */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 pt-5 pb-3 border-b border-gray-50 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-100 text-orange-700">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">NaijaCredit</p>
                                        <p className="text-[11px] text-gray-400">Micro-lending</p>
                                    </div>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xl font-black text-gray-900">{activeLoansCount}</p>
                                            <p className="text-[11px] text-gray-400">Active loans</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">{fmtNGN(outstandingBalance)}</p>
                                            <p className="text-[11px] text-gray-400">Outstanding</p>
                                        </div>
                                    </div>
                                    {nextRepaymentDate && (
                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 rounded-xl px-3 py-2">
                                            <Clock className="w-3.5 h-3.5 shrink-0" />
                                            Next repayment: {fmtDate(nextRepaymentDate)}
                                        </div>
                                    )}
                                    <Link href="/app/fintech/credit"
                                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors">
                                        {activeLoansCount > 0 ? 'Manage Loans' : 'Apply for Loan'} <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>

                            {/* NaijaInsure Card */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 pt-5 pb-3 border-b border-gray-50 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal-100 text-teal-700">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">NaijaInsure</p>
                                        <p className="text-[11px] text-gray-400">Micro-insurance</p>
                                    </div>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xl font-black text-gray-900">{activePoliciesCount}</p>
                                            <p className="text-[11px] text-gray-400">Active policies</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-teal-600 flex items-center gap-1">
                                                {activePoliciesCount > 0
                                                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Protected</>
                                                    : <><AlertCircle className="w-3.5 h-3.5 text-gray-400" /> Not covered</>}
                                            </p>
                                            <p className="text-[11px] text-gray-400">Coverage status</p>
                                        </div>
                                    </div>
                                    {nextPremiumDue && (
                                        <div className="flex items-center gap-1.5 text-xs text-teal-600 font-semibold bg-teal-50 rounded-xl px-3 py-2">
                                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                                            Next premium: {fmtDate(nextPremiumDue)}
                                        </div>
                                    )}
                                    <Link href="/app/fintech/insure"
                                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors">
                                        {activePoliciesCount > 0 ? 'Manage Policies' : 'Get Covered'} <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Feature Spotlight ─────────────────────── */}
                <section>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Why Use Fintech Hub</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-2xl p-4 text-white"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            <Star className="w-5 h-5 text-yellow-400 mb-2" />
                            <p className="font-bold text-sm">Build Credit History</p>
                            <p className="text-xs text-green-200/70 mt-1 leading-relaxed">
                                Every transaction, saving and repayment builds your TradeCred score — unlocking bigger loans.
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <Users2 className="w-5 h-5 text-emerald-600 mb-2" />
                            <p className="font-bold text-sm text-gray-900">Save Together</p>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                Join Ajo groups with trusted community members and grow your savings collectively.
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <Shield className="w-5 h-5 text-teal-600 mb-2" />
                            <p className="font-bold text-sm text-gray-900">Stay Protected</p>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                Affordable micro-insurance for health, devices, travel and life — starting from ₦500/month.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── All Products List ──────────────────────── */}
                <section>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">All Products</p>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                        {([
                            { href: '/app/fintech/ajo', icon: Users2, label: 'NaijaAjo', desc: 'Digital cooperative savings — save together, win together', ctaClass: 'border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600', iconClass: 'bg-emerald-50 text-emerald-600', cta: 'View Groups' },
                            { href: '/app/fintech/safe', icon: PiggyBank, label: 'NaijaSafe', desc: 'Personal savings vault — flexible, locked and goal-based', ctaClass: 'border-sky-200 text-sky-700 hover:bg-sky-500 hover:text-white hover:border-sky-500', iconClass: 'bg-sky-50 text-sky-600', cta: 'View Savings' },
                            { href: '/app/fintech/tradecred', icon: BarChart2, label: 'TradeCred', desc: 'Alternative credit score built on real financial behaviour', ctaClass: 'border-violet-200 text-violet-700 hover:bg-violet-600 hover:text-white hover:border-violet-600', iconClass: 'bg-violet-50 text-violet-600', cta: 'Check Score' },
                            { href: '/app/fintech/credit', icon: CreditCard, label: 'NaijaCredit', desc: 'Micro-lending powered by your TradeCred score', ctaClass: 'border-orange-200 text-orange-700 hover:bg-orange-500 hover:text-white hover:border-orange-500', iconClass: 'bg-orange-50 text-orange-600', cta: 'Apply Now' },
                            { href: '/app/fintech/insure', icon: Shield, label: 'NaijaInsure', desc: 'Micro-insurance for health, device, travel and life', ctaClass: 'border-teal-200 text-teal-700 hover:bg-teal-500 hover:text-white hover:border-teal-500', iconClass: 'bg-teal-50 text-teal-600', cta: 'Browse Plans' },
                        ] as const).map(({ href, icon: Icon, label, desc, ctaClass, iconClass, cta }) => (
                            <Link key={href} href={href}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconClass}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm">{label}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{desc}</p>
                                </div>
                                <span className={`shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${ctaClass}`}>
                                    {cta} <ChevronRight className="w-3 h-3" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <div className="h-6" />
            </div>
        </div>
    )
}
