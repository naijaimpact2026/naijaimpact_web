'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    Banknote,
    ChevronRight,
    Eye,
    EyeOff,
    HandCoins,
    KeyRound,
    Lock,
    PiggyBank,
    Plus,
    Star,
    Users,
    Gauge,
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

function fmtDate(iso: string): string
{
    return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TX_LABELS: Record<string, string> = {
    deposit: 'Added money',
    topup: 'Added money',
    withdrawal: 'Withdrawal',
    transfer_debit: 'Sent',
    transfer: 'Sent',
    transfer_credit: 'Received',
    receive: 'Received',
    escrow_hold: 'Paid into escrow',
    escrow_release: 'Job payment received',
    escrow_refund: 'Escrow refund',
    marketplace_purchase: 'Marketplace order',
    course_purchase: 'Course',
    course_sale: 'Course sale',
    campaign_donation: 'Donation',
    campaign_payout: 'Campaign payout',
    loan_disbursement: 'Loan',
    loan_repayment: 'Loan repayment',
    insurance_premium: 'Insurance',
    ajo_contribution: 'Ajo contribution',
    ajo_payout: 'Ajo payout',
    savings_topup: 'Savings',
    savings_withdrawal: 'Savings withdrawal',
}

const CREDIT_TYPES = new Set([
    'deposit', 'topup', 'transfer_credit', 'receive', 'escrow_release', 'escrow_refund',
    'course_sale', 'campaign_payout', 'loan_disbursement', 'ajo_payout', 'savings_withdrawal',
])

const isCredit = (type: string) => CREDIT_TYPES.has(type)

const STATUS_TONE: Record<string, string> = {
    success: 'text-emerald-600 dark:text-emerald-400',
    pending: 'text-amber-600 dark:text-amber-400',
}

const COMING_SOON = [
    { label: 'Savings', icon: PiggyBank },
    { label: 'Ajo circles', icon: Users },
    { label: 'Credit', icon: Gauge },
    { label: 'Crowdfunding', icon: HandCoins },
] as const

type Filter = 'all' | 'in' | 'out'

// ─── Props ────────────────────────────────────────────────────────────────────

interface WalletPanelProps
{
    wallet: WalletType
    transactions: Transaction[]
    userEmail: string
    hasPin: boolean
    displayName?: string
    naijaPoints?: number
    /** kobo: what you've paid into escrow for jobs, and what's waiting to be released to you */
    escrow?: { payingKobo: number; earningKobo: number }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WalletPanel({
    wallet,
    transactions,
    userEmail,
    hasPin,
    displayName,
    naijaPoints = 0,
    escrow = { payingKobo: 0, earningKobo: 0 },
}: WalletPanelProps)
{
    const [depositOpen, setDepositOpen] = useState(false)
    const [sendOpen, setSendOpen] = useState(false)
    const [withdrawOpen, setWithdrawOpen] = useState(false)
    const [hidden, setHidden] = useState(false)
    const [filter, setFilter] = useState<Filter>('all')

    const balance = wallet?.balance ?? 0
    const mask = (s: string) => (hidden ? '₦ ••••••' : s)
    const hasEscrow = escrow.payingKobo > 0 || escrow.earningKobo > 0

    const shown = transactions.filter((tx) =>
        filter === 'all' ? true : filter === 'in' ? isCredit(tx.type) : !isCredit(tx.type)
    )

    const actions = [
        { label: 'Add money', icon: Plus, onClick: () => setDepositOpen(true) },
        { label: 'Send', icon: ArrowUpRight, onClick: () => setSendOpen(true) },
        { label: 'Withdraw', icon: Banknote, onClick: () => setWithdrawOpen(true) },
    ]

    return (
        <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">Wallet</h1>
                    {displayName && <p className="mt-0.5 text-sm text-muted-foreground">{displayName}</p>}
                </div>
                {naijaPoints > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <Star className="h-3.5 w-3.5 fill-current" /> {naijaPoints.toLocaleString()} points
                    </span>
                )}
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="space-y-5">
                    {/* ── Balance card ─────────────────────────────────────────────── */}
                    <section className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-md sm:p-6">
                        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-primary-foreground/10" />
                        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full border border-primary-foreground/10" />

                        <div className="relative">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-primary-foreground/75">Available balance</p>
                                <button
                                    type="button"
                                    onClick={() => setHidden((h) => !h)}
                                    aria-label={hidden ? 'Show balance' : 'Hide balance'}
                                    className="rounded-full p-1 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                                >
                                    {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="mt-1 font-display text-4xl font-bold tracking-tight">{mask(fmt(balance))}</p>

                            {hasEscrow && (
                                <Link
                                    href="/app/artisans/jobs"
                                    className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-primary-foreground/10 p-3 text-sm transition-colors hover:bg-primary-foreground/15"
                                >
                                    <div>
                                        <p className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
                                            <Lock className="h-3 w-3" /> In escrow
                                        </p>
                                        <p className="mt-0.5 font-semibold">{mask(fmt(escrow.payingKobo / 100))}</p>
                                    </div>
                                    <div>
                                        <p className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
                                            <ArrowDownLeft className="h-3 w-3" /> Coming to you
                                        </p>
                                        <p className="mt-0.5 font-semibold">{mask(fmt(escrow.earningKobo / 100))}</p>
                                    </div>
                                </Link>
                            )}

                            <div className="mt-5 grid grid-cols-3 gap-2.5">
                                {actions.map(({ label, icon: Icon, onClick }, i) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={onClick}
                                        className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-semibold transition-all active:scale-95 sm:flex-row sm:justify-center sm:gap-2 sm:text-sm ${
                                            i === 0
                                                ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                                                : 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ── PIN nudge ─────────────────────────────────────────────────── */}
                    {!hasPin && (
                        <Link
                            href="/app/settings"
                            className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 transition-colors hover:bg-amber-500/10"
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                <KeyRound className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">Set a wallet PIN</p>
                                <p className="text-xs text-muted-foreground">You need it to send, withdraw and pay artisans.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    )}

                    {/* ── Coming soon (honest: not usable yet) ─────────────────────── */}
                    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[15px] font-semibold text-foreground">Coming soon</h2>
                            <span className="text-xs text-muted-foreground">We&apos;ll notify you</span>
                        </div>
                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {COMING_SOON.map(({ label, icon: Icon }) => (
                                <div key={label} className="flex flex-col items-center gap-2 text-center">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="text-[11px] font-medium leading-tight text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ── Transactions ──────────────────────────────────────────────── */}
                <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                        <h2 className="text-[15px] font-semibold text-foreground">Transactions</h2>
                        <div className="inline-flex rounded-xl bg-muted p-0.5 text-xs font-semibold" role="tablist">
                            {(['all', 'in', 'out'] as Filter[]).map((f) => (
                                <button
                                    key={f}
                                    role="tab"
                                    aria-selected={filter === f}
                                    onClick={() => setFilter(f)}
                                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                                        filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {f === 'all' ? 'All' : f === 'in' ? 'Money in' : 'Money out'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {shown.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                            <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm font-semibold text-foreground">No transactions yet</p>
                            <p className="text-xs text-muted-foreground">Add money to get started.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {shown.map((tx) =>
                            {
                                const credit = isCredit(tx.type)
                                return (
                                    <li key={tx.id} className="flex items-center gap-3.5 px-5 py-3.5">
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                                                credit ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-foreground'
                                            }`}
                                        >
                                            {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {TX_LABELS[tx.type] ?? tx.type.replace(/_/g, ' ')}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                {fmtDate(tx.created_at)}
                                                {tx.ref ? ` · ${tx.ref}` : ''}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className={`text-sm font-bold ${credit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                                                {credit ? '+' : '−'}{mask(fmt(tx.amount))}
                                            </p>
                                            <p className={`mt-0.5 text-[11px] capitalize ${STATUS_TONE[tx.status] ?? 'text-rose-600 dark:text-rose-400'}`}>
                                                {tx.status}
                                            </p>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                    {transactions.length > 0 && (
                        <p className="border-t border-border px-5 py-3 text-center text-xs text-muted-foreground">
                            Showing your latest {transactions.length} transactions
                        </p>
                    )}
                </section>
            </div>

            {/* ── Modals ────────────────────────────────────────────────────── */}
            <DepositModal open={depositOpen} onOpenChange={setDepositOpen} userEmail={userEmail} />
            <SendModal open={sendOpen} onOpenChange={setSendOpen} hasPin={hasPin} currentBalance={balance} />
            <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} hasPin={hasPin} currentBalance={balance} />
        </div>
    )
}
