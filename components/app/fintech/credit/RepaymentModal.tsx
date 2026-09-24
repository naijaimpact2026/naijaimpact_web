'use client'

import { useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/toast'
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { makeRepayment } from '@/lib/actions/fintech/credit'
import type { LoanRepayment, Loan } from '@/lib/types'

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

interface RepaymentModalProps
{
    open: boolean
    onOpenChange: (v: boolean) => void
    loan: Loan
    repayments: LoanRepayment[]
}

export default function RepaymentModal({
    open,
    onOpenChange,
    loan,
    repayments,
}: RepaymentModalProps)
{
    const [paying, setPaying] = useState<string | null>(null)

    // Filter to unpaid repayments, sorted by installment
    const unpaidRepayments = repayments
        .filter((r) => r.loan_id === loan.id && r.status !== 'paid')
        .sort((a, b) => a.installment - b.installment)

    // The next repayment to pay is the first unpaid/overdue one
    const nextRepayment = unpaidRepayments[0] ?? null

    async function handlePay(repayment: LoanRepayment)
    {
        setPaying(repayment.id)
        try
        {
            const result = await makeRepayment(repayment.id)
            if (result.success)
            {
                toast.success(`Installment ${repayment.installment} paid successfully!`)
                onOpenChange(false)
            } else
            {
                toast.error(result.error)
            }
        } finally
        {
            setPaying(null)
        }
    }

    const statusBadge = (status: LoanRepayment['status']) =>
    {
        if (status === 'paid')
            return <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-[10px]">Paid</Badge>
        if (status === 'overdue')
            return <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-[10px]">Overdue</Badge>
        return <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0 text-[10px]">Pending</Badge>
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Make Repayment</DialogTitle>
                    <DialogDescription>
                        Principal: {formatNGN(loan.principal)} · {loan.tenure_months} months
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Next repayment prompt */}
                    {nextRepayment ? (
                        <div className="bento-card noise-bg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                {nextRepayment.status === 'overdue' ? (
                                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                )}
                                <p className="text-sm font-medium">
                                    {nextRepayment.status === 'overdue' ? 'Overdue payment' : 'Next payment due'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[11px] text-muted-foreground">Installment</p>
                                    <p className="text-sm font-bold">#{nextRepayment.installment}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground">Due Date</p>
                                    <p className="text-sm font-bold">{formatDate(nextRepayment.due_date)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground">Amount</p>
                                    <p className="text-sm font-bold text-primary">{formatNGN(nextRepayment.amount)}</p>
                                </div>
                                {nextRepayment.late_fee > 0 && (
                                    <div>
                                        <p className="text-[11px] text-muted-foreground">Late Fee</p>
                                        <p className="text-sm font-bold text-red-500">{formatNGN(nextRepayment.late_fee)}</p>
                                    </div>
                                )}
                            </div>
                            {nextRepayment.late_fee > 0 && (
                                <div className="pt-1 border-t border-border/50">
                                    <p className="text-xs text-muted-foreground">Total due</p>
                                    <p className="text-lg font-bold">
                                        {formatNGN(nextRepayment.amount + nextRepayment.late_fee)}
                                    </p>
                                </div>
                            )}
                            <Button
                                className="w-full gradient-primary text-white gap-2"
                                disabled={!!paying}
                                onClick={() => handlePay(nextRepayment)}
                            >
                                {paying === nextRepayment.id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing…
                                    </>
                                ) : (
                                    `Pay ${formatNGN(nextRepayment.amount + nextRepayment.late_fee)}`
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-6 space-y-2">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                            <p className="font-medium">All repayments complete!</p>
                            <p className="text-sm text-muted-foreground">This loan has been fully repaid.</p>
                        </div>
                    )}

                    {/* Full schedule */}
                    {repayments.filter((r) => r.loan_id === loan.id).length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                All Installments
                            </p>
                            <div className="divide-y divide-border/50 rounded-lg border border-border/50 overflow-hidden">
                                {repayments
                                    .filter((r) => r.loan_id === loan.id)
                                    .sort((a, b) => a.installment - b.installment)
                                    .map((rep) => (
                                        <div
                                            key={rep.id}
                                            className="flex items-center justify-between px-3 py-2.5 text-sm bg-background"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground w-4">#{rep.installment}</span>
                                                <span className="text-xs text-muted-foreground">{formatDate(rep.due_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium">{formatNGN(rep.amount)}</span>
                                                {statusBadge(rep.status)}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
