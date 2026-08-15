'use client'

import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Loan, LoanRepayment } from '@/lib/types'

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string
{
    return new Date(dateStr).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function StatusIcon({ status }: { status: LoanRepayment['status'] })
{
    if (status === 'paid')
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
    if (status === 'overdue')
        return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
    return <Clock className="h-4 w-4 text-amber-500 shrink-0" />
}

function StatusBadge({ status }: { status: LoanRepayment['status'] })
{
    if (status === 'paid')
        return (
            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-[10px]">
                Paid
            </Badge>
        )
    if (status === 'overdue')
        return (
            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-[10px]">
                Overdue
            </Badge>
        )
    return (
        <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0 text-[10px]">
            Pending
        </Badge>
    )
}

interface RepaymentScheduleProps
{
    loans: Loan[]
    repayments: LoanRepayment[]
}

export default function RepaymentSchedule({ loans, repayments }: RepaymentScheduleProps)
{
    if (loans.length === 0)
    {
        return (
            <div className="bento-card noise-bg p-8 text-center space-y-3">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
                    <Clock className="h-7 w-7 text-primary" />
                </div>
                <p className="font-medium">No repayment schedules yet</p>
                <p className="text-sm text-muted-foreground">
                    Repayment schedules will appear here once your loan is approved and disbursed.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {loans.map((loan) =>
            {
                const loanRepayments = repayments
                    .filter((r) => r.loan_id === loan.id)
                    .sort((a, b) => a.installment - b.installment)

                const paidCount = loanRepayments.filter((r) => r.status === 'paid').length
                const totalCount = loanRepayments.length
                const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0

                if (loanRepayments.length === 0) return null

                return (
                    <div key={loan.id} className="space-y-3">
                        {/* Loan header */}
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold">
                                    Loan #{loan.id.slice(-6).toUpperCase()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Principal: {formatNGN(loan.principal)} · {loan.tenure_months} months
                                </p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                                {paidCount}/{totalCount} paid
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 w-full rounded-full bg-muted">
                            <div
                                className="h-1.5 rounded-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Repayment rows */}
                        <div className="rounded-xl border border-border/50 overflow-hidden">
                            {/* Table header */}
                            <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_auto] gap-2 px-3 py-2 bg-muted/40 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                <span>#</span>
                                <span>Due Date</span>
                                <span>Amount</span>
                                <span className="hidden sm:block">Late Fee</span>
                                <span>Status</span>
                            </div>

                            {/* Rows */}
                            {loanRepayments.map((rep) => (
                                <div
                                    key={rep.id}
                                    className={`grid grid-cols-[1.5rem_1fr_1fr_1fr_auto] gap-2 items-center px-3 py-3 text-sm border-t border-border/30 first:border-t-0 transition-colors ${rep.status === 'overdue'
                                            ? 'bg-red-50/50 dark:bg-red-950/20'
                                            : rep.status === 'paid'
                                                ? 'bg-emerald-50/30 dark:bg-emerald-950/10 opacity-70'
                                                : 'bg-background'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <StatusIcon status={rep.status} />
                                    </div>
                                    <span className="text-xs">{formatDate(rep.due_date)}</span>
                                    <span className="text-xs font-medium">{formatNGN(rep.amount)}</span>
                                    <span className={`text-xs hidden sm:block ${rep.late_fee > 0 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                        {rep.late_fee > 0 ? formatNGN(rep.late_fee) : '—'}
                                    </span>
                                    <StatusBadge status={rep.status} />
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
