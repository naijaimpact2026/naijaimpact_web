'use client'

import { useState } from 'react'
import Link from 'next/link'
import
    {
        ArrowDownLeft,
        ArrowUpRight,
        Banknote,
        Users,
        BarChart3,
        HandCoins,
        Building2,
        TrendingUp,
        TrendingDown,
        Clock,
        ChevronRight,
        Star,
        ShieldCheck,
        CreditCard,
        PiggyBank,
        BookOpen,
        Landmark,
        AlertCircle,
    } from 'lucide-react'
import type { Wallet as WalletType, Transaction } from '@/lib/types'
import DepositModal from './DepositModal'
import SendModal from './SendModal'
import WithdrawModal from './WithdrawModal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number | null | undefined): string
{
    const n = typeof amount === 'number' && isFinite(amount) ? amount : 0
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtCompact(amount: number | null | undefined): string
{
    const n = typeof amount === 'number' && isFinite(amount) ? amount : 0
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
    return fmt(n)
}

function fmtDate(iso: string): string
{
    return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TX_LABELS: Record<string, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    transfer_debit: 'Transfer',
    transfer_credit: 'Received',
    loan_disbursement: 'Loan',
    loan_repayment: 'Loan Repay',
    insurance_premium: 'Insurance',
    ajo_contribution: 'Ajo Collection',
    ajo_payout: 'Ajo Payout',
    savings_topup: 'Savings',
    savings_withdrawal: 'Savings Out',
    course_purchase: 'Course',
    campaign_donation: 'Donation',
}

const CREDIT_TYPES = new Set([
    'deposit', 'transfer_credit', 'loan_disbursement', 'ajo_payout', 'savings_withdrawal',
])

function isCredit(type: string) { return CREDIT_TYPES.has(type) }

function statusDot(status: string)
{
    if (status === 'success') return 'bg-emerald-500'
    if (status === 'pending') return 'bg-amber-400'
    return 'bg-rose-500'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuickTile({ icon, label, href }: { icon: React.ReactNode; label: string; href: string })
{
    return (
        <Link
            href={href}
            className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-white hover:bg-green-50 border border-gray-100 hover:border-green-200 shadow-sm hover:shadow transition-all group"
        >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#e8f5ee,#d0ede0)' }}>
                {icon}
            </div>
            <span className="text-[11px] font-bold text-gray-700 text-center leading-tight tracking-tight">
                {label}
            </span>
        </Link>
    )
}

function SpecialTile({ title, subtitle, dark }: { title: string; subtitle: string; dark?: boolean })
{
    return (
        <div className={`rounded-2xl p-4 flex flex-col gap-1 ${dark
            ? 'text-white'
            : 'bg-white border border-gray-100 text-gray-900'
            }`}
            style={dark ? { background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' } : {}}>
            <span className={`text-xs font-bold ${dark ? 'text-green-300' : 'text-green-700'}`}>{title}</span>
            <span className={`text-[10px] leading-tight ${dark ? 'text-green-100/70' : 'text-gray-500'}`}>{subtitle}</span>
        </div>
    )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WalletPanelProps
{
    wallet: WalletType
    transactions: Transaction[]
    userEmail: string
    hasPin: boolean
    displayName?: string
    naijaPoints?: number
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WalletPanel({
    wallet,
    transactions,
    userEmail,
    hasPin,
    displayName,
    naijaPoints = 0,
}: WalletPanelProps)
{
    const [depositOpen, setDepositOpen] = useState(false)
    const [sendOpen, setSendOpen] = useState(false)
    const [withdrawOpen, setWithdrawOpen] = useState(false)

    const balance = wallet?.balance ?? 0

    // Split transactions for preview
    const recent = transactions.slice(0, 10)

    return (
        <>
            {/* ═══════════════════════════════════════════════
                HERO — full-width dark green, bleeds to edges
            ════════════════════════════════════════════════ */}
            <div
                className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.18),transparent 70%)' }} />
                <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(134,239,172,.12),transparent 70%)' }} />
                {/* Subtle grid pattern overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 px-5 pt-6 pb-8 max-w-2xl mx-auto space-y-5">
                    {/* Label + user */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest">
                            Hubnovo Wallet
                            </p>
                            {displayName && (
                                <p className="text-white/75 text-sm font-medium mt-0.5">{displayName}</p>
                            )}
                        </div>
                        <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <Landmark className="w-4 h-4 text-green-300" />
                        </div>
                    </div>

                    {/* Balance */}
                    <div>
                        <p className="text-green-300/60 text-xs font-medium mb-1">Bold Balance</p>
                        <p className="text-[2.6rem] font-black text-white leading-none tracking-tight">
                            {fmt(balance)}
                        </p>
                    </div>

                    {/* Points card */}
                    <div
                        className="flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ background: 'linear-gradient(90deg,#d4a017,#f0c040)' }}
                    >
                        <div className="flex items-center gap-2.5">
                            <Star className="w-4 h-4 text-yellow-900 fill-yellow-900" />
                            <div>
                                <p className="text-yellow-900 text-[11px] font-semibold uppercase tracking-wide">
                                    Points Card
                                </p>
                                <p className="text-yellow-900 text-xl font-black leading-tight">
                                    {naijaPoints.toLocaleString()}
                                    <span className="text-sm font-bold ml-1">★</span>
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-yellow-900/60" />
                    </div>

                    {/* Action row */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Deposit', icon: ArrowDownLeft, action: () => setDepositOpen(true), primary: true },
                            { label: 'Send', icon: ArrowUpRight, action: () => setSendOpen(true), primary: false },
                            { label: 'Withdraw', icon: Banknote, action: () => setWithdrawOpen(true), primary: false },
                        ].map(({ label, icon: Icon, action, primary }) => (
                            <button
                                key={label}
                                onClick={action}
                                className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${primary
                                    ? 'bg-white text-green-800 hover:bg-green-50 shadow-md'
                                    : 'bg-white/12 text-white border border-white/25 hover:bg-white/20'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                SCROLLABLE CONTENT on #f0f2f5 bg
            ════════════════════════════════════════════════ */}
            <div className="bg-[#f0f2f5] px-4 py-5 max-w-2xl mx-auto space-y-5">

                {/* ── Quick Services ───────────────────────────── */}
                <section>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Quick Services
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                        <QuickTile icon={<Users className="w-5 h-5 text-green-700" />} label="Ajo Savings" href="/app/fintech/ajo" />
                        <QuickTile icon={<HandCoins className="w-5 h-5 text-green-700" />} label="Loans & Credit" href="/app/fintech/credit" />
                        <QuickTile icon={<BarChart3 className="w-5 h-5 text-green-700" />} label="Invest & Trade" href="/app/fintech" />
                        <QuickTile icon={<Building2 className="w-5 h-5 text-green-700" />} label="Cooperative Hub" href="/app/fintech" />
                    </div>
                </section>

                {/* ── Transaction Preview ───────────────────────── */}
                <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
                        <div>
                            <h2 className="font-bold text-gray-900 text-[15px]">Transaction Preview</h2>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                {recent.length > 0 ? `Showing ${recent.length} recent` : 'No transactions yet'}
                            </p>
                        </div>
                        <button className="flex items-center gap-0.5 text-xs font-bold text-green-700 hover:text-green-800">
                            See all <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {recent.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-14 text-gray-400">
                            <AlertCircle className="w-10 h-10 text-gray-200" />
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-600">No transactions yet</p>
                                <p className="text-xs mt-0.5">Deposit funds to get started</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {recent.map((tx) =>
                            {
                                const credit = isCredit(tx.type)
                                return (
                                    <div key={tx.id} className="flex items-center gap-3.5 px-5 py-3.5">
                                        {/* Avatar circle */}
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${credit ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                            {credit
                                                ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                                                : <TrendingDown className="w-4 h-4 text-rose-500" />}
                                        </div>

                                        {/* Label */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800">
                                                {TX_LABELS[tx.type] ?? tx.type}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Clock className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                                <span className="text-[11px] text-gray-400">{fmtDate(tx.created_at)}</span>
                                                {tx.description && (
                                                    <span className="text-[11px] text-gray-400 truncate max-w-[100px]">
                                                        · {tx.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right shrink-0">
                                            <p className={`text-sm font-black ${credit ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {credit ? '+' : '-'}{fmtCompact(tx.amount ?? 0)}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-0.5">
                                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot(tx.status)}`} />
                                                <span className="text-[10px] text-gray-400 capitalize">{tx.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    <div className="h-1" />
                </section>

                {/* ── Advanced Finance ─────────────────────────── */}
                <section>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Advanced Finance
                    </p>
                    <div className="space-y-3">
                        {/* Loans Center */}
                        <Link
                            href="/app/fintech/credit"
                            className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all group"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg,#e8f5ee,#d0ede0)' }}>
                                    <HandCoins className="w-5 h-5 text-green-700" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Loans Center</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Apply for micro-loans · Active loan status
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white"
                                    style={{ background: 'linear-gradient(90deg,#d4a017,#f0c040)', color: '#5a3e00' }}>
                                    Apply Now
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-700 transition-colors" />
                            </div>
                        </Link>

                        {/* Insurance Center */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 pt-4 pb-3 border-b border-gray-50">
                                <p className="text-sm font-bold text-gray-900">Insurance Center</p>
                            </div>
                            <div className="grid grid-cols-3 divide-x divide-gray-50">
                                {[
                                    { label: 'Health', icon: ShieldCheck, href: '/app/fintech/insure' },
                                    { label: 'Business', icon: Building2, href: '/app/fintech/insure' },
                                    { label: 'Asset', icon: CreditCard, href: '/app/fintech/insure' },
                                ].map(({ label, icon: Icon, href }) => (
                                    <Link
                                        key={label}
                                        href={href}
                                        className="flex flex-col items-center gap-2 py-4 hover:bg-green-50 transition-colors"
                                    >
                                        <Icon className="w-5 h-5 text-green-700" />
                                        <span className="text-xs font-semibold text-gray-600">{label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Special Features 2-col */}
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Special Features
                                </p>
                                <button className="text-xs font-bold text-green-700">See all</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/app/fintech/tradecred">
                                    <SpecialTile dark title="Trade Cred" subtitle="Secure card data · Secure cards" />
                                </Link>
                                <Link href="/app/fintech/safe">
                                    <SpecialTile title="Naija Safe" subtitle="Personal savings hub" />
                                </Link>
                            </div>
                        </div>

                        {/* Ajo & Savings Hub */}
                        <Link
                            href="/app/fintech/ajo"
                            className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all group"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg,#e8f5ee,#d0ede0)' }}>
                                    <PiggyBank className="w-5 h-5 text-green-700" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Ajo & Savings Hub</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Group savings · Personal goals
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-700 transition-colors" />
                        </Link>

                        {/* Learn */}
                        <Link
                            href="/app/learn"
                            className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all group"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg,#e8f5ee,#d0ede0)' }}>
                                    <BookOpen className="w-5 h-5 text-green-700" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Cooperative Hub Card</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Financial literacy · Training
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-700 transition-colors" />
                        </Link>
                    </div>
                </section>

                {/* Bottom safe area */}
                <div className="h-6" />
            </div>

            {/* ── Modals ────────────────────────────────────────────────────── */}
            <DepositModal open={depositOpen} onOpenChange={setDepositOpen} userEmail={userEmail} />
            <SendModal open={sendOpen} onOpenChange={setSendOpen} hasPin={hasPin} currentBalance={balance} />
            <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} hasPin={hasPin} currentBalance={balance} />
        </>
    )
}
