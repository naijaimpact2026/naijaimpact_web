'use client'

import { useState } from 'react'
import { Calendar, CreditCard, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import RepaymentModal from './RepaymentModal'
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

function LoanStatusBadge({ status }: { status: Loan['status'] })
{
    if (status === 'active')
        return (
            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
                Active
            </Badge>
        )
    if (status === 'completed')
        return (
            <Badge className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-0 text-xs">
                Completed
            </Badge>
        )
    if (status === 'defaulted')
        return (
            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-xs">
                Defaulted
            </Badge>
        )
    return (
        <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0 text-xs">
            Pending
        </Badge>
    )
}

interface ActiveLoanCardProps
{
    loan: Loan
    repayments: LoanRepayment[]
}

export default function ActiveLoanCard({ loan, repayments }: ActiveLoanCardProps)
{
    const [showModal, setShowModal] = useState(false)

    const loanRepayments = repayments.filter((r) => r.loan_id === loan.id)

    const outstandingBalance = loanRepayments
        .filter((r) => r.status === 'pending' || r.status === 'overdue')
        .reduce((sum, r) => sum + r.amount + r.late_fee, 0)

    const nextRepayment = loanRepayments
        .filter((r) => r.status === 'pending' || r.status === 'overdue')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

    const hasOverdue = loanRepayments.some((r) => r.status === 'overdue')

    const paidCount = loanRepayments.filter((r) => r.status === 'paid').length
    const progress = loanRepayments.length > 0 ? (paidCount / loanRepayments.length) * 100 : 0

    return (
        <>
            <div className={`bento-card noise-bg p-5 space-y-4 ${hasOverdue ? 'border-red-300 dark:border-red-800' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-semibold">Loan #{loan.id.slice(-6).toUpperCase()}</p>
                        {loan.disbursed_at && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Disbursed {formatDate(loan.disbursed_at)}
                            </p>
                        )}
                    </div>
                    <LoanStatusBadge status={loan.status} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[11px] text-muted-foreground">Principal</p>
                        <p className="text-sm font-bold">{formatNGN(loan.principal)}</p>
                    </div>
                    <div>
                        <p className="text-[11px] text-muted-foreground">Outstanding</p>
                        <p className={`text-sm font-bold ${hasOverdue ? 'text-red-500' : 'text-primary'}`}>
                            {formatNGN(outstandingBalance)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] text-muted-foreground">Tenure</p>
                        <p className="text-sm font-bold">{loan.tenure_months} months</p>
                    </div>
                    {nextRepayment && (
                        <div>
                            <p className="text-[11px] text-muted-foreground">Next Due</p>
                            <p className="text-sm font-bold flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {formatDate(nextRepayment.due_date)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                {loanRepayments.length > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" />
                                Repayment progress
                            </span>
                            <span>{paidCount}/{loanRepayments.length} installments</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                            <div
                                className="h-1.5 rounded-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Action */}
                {loan.status !== 'completed' && loan.status !== 'defaulted' && (
                    <Button
                        className="w-full gap-2 gradient-primary text-white"
                        onClick={() => setShowModal(true)}
                    >
                        <CreditCard className="h-4 w-4" />
                        Make Repayment
                    </Button>
                )}
            </div>

            <RepaymentModal
                open={showModal}
                onOpenChange={setShowModal}
                loan={loan}
                repayments={repayments}
            />
        </>
    )
}
