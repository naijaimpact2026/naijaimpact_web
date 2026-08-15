'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, FileText, BarChart3, AlertCircle, Calendar } from 'lucide-react'
import LoanProductCard from './LoanProductCard'
import LoanApplicationForm from './LoanApplicationForm'
import ActiveLoanCard from './ActiveLoanCard'
import RepaymentSchedule from './RepaymentSchedule'
import type {
    LoanProduct,
    LoanApplication,
    Loan,
    LoanRepayment,
} from '@/lib/types'

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

interface CreditDashboardProps
{
    loanProducts: LoanProduct[]
    loanApplications: LoanApplication[]
    loans: Loan[]
    repayments: LoanRepayment[]
    pendingApplicationsCount: number
    activeLoansCount: number
    totalOutstandingBalance: number
    nextRepaymentDate: string | null
}

export default function CreditDashboard({
    loanProducts,
    loanApplications,
    loans,
    repayments,
    pendingApplicationsCount,
    activeLoansCount,
    totalOutstandingBalance,
    nextRepaymentDate,
}: CreditDashboardProps)
{
    const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null)
    const [activeTab, setActiveTab] = useState('apply')

    function handleApplicationSuccess()
    {
        setSelectedProduct(null)
        setActiveTab('active')
    }

    return (
        <div className="space-y-8">
            {/* ── Header ───────────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">NaijaCredit</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Micro-lending — apply for loans and manage repayments
                    </p>
                </div>
            </div>

            {/* ── Summary bar ──────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bento-card noise-bg p-4 text-center space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-1">
                        <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending Apps</p>
                    <p className="text-lg font-bold">{pendingApplicationsCount}</p>
                </div>

                <div className="bento-card noise-bg p-4 text-center space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mb-1">
                        <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Loans</p>
                    <p className="text-lg font-bold">{activeLoansCount}</p>
                </div>

                <div className="bento-card noise-bg p-4 text-center space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-1">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Outstanding</p>
                    <p className="text-sm font-bold leading-tight">{formatNGN(totalOutstandingBalance)}</p>
                </div>

                <div className="bento-card noise-bg p-4 text-center space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 mb-1">
                        <Calendar className="h-4 w-4 text-secondary" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next Due</p>
                    <p className="text-sm font-bold leading-tight">
                        {nextRepaymentDate ? formatDate(nextRepaymentDate) : '—'}
                    </p>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="apply" className="flex-1 sm:flex-none gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Apply
                        {pendingApplicationsCount > 0 && (
                            <span className="ml-1 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full px-1.5 py-0.5 font-semibold">
                                {pendingApplicationsCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex-1 sm:flex-none gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        Active Loans
                        {activeLoansCount > 0 && (
                            <span className="ml-1 text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-semibold">
                                {activeLoansCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="repayments" className="flex-1 sm:flex-none gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Repayments
                    </TabsTrigger>
                </TabsList>

                {/* ── Apply tab ──────────────────────────────────────────────────────── */}
                <TabsContent value="apply" className="mt-6">
                    {selectedProduct ? (
                        <LoanApplicationForm
                            product={selectedProduct}
                            onBack={() => setSelectedProduct(null)}
                            onSuccess={handleApplicationSuccess}
                        />
                    ) : (
                        <div className="space-y-6">
                            {/* Pending applications */}
                            {loanApplications.filter((a) => a.status === 'pending').length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-muted-foreground">Pending Applications</p>
                                    <div className="divide-y divide-border/50 rounded-xl border border-border/50 overflow-hidden">
                                        {loanApplications
                                            .filter((a) => a.status === 'pending')
                                            .map((app) =>
                                            {
                                                const product = loanProducts.find((p) => p.id === app.product_id)
                                                return (
                                                    <div
                                                        key={app.id}
                                                        className="flex items-center justify-between gap-3 px-4 py-3 bg-background"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {product?.name ?? 'Loan Product'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatNGN(app.amount)} · {app.tenure_months} months ·{' '}
                                                                {new Date(app.created_at).toLocaleDateString('en-NG')}
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full px-2 py-0.5 font-semibold shrink-0">
                                                            Under Review
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Loan products */}
                            <div className="space-y-3">
                                <p className="text-sm font-medium">Available Loan Products</p>
                                {loanProducts.length === 0 ? (
                                    <div className="bento-card noise-bg p-8 text-center space-y-3">
                                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
                                            <CreditCard className="h-7 w-7 text-primary" />
                                        </div>
                                        <p className="font-medium">No loan products available</p>
                                        <p className="text-sm text-muted-foreground">
                                            Check back later for available micro-loan options.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {loanProducts.map((product) => (
                                            <LoanProductCard
                                                key={product.id}
                                                product={product}
                                                onSelect={setSelectedProduct}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ── Active Loans tab ───────────────────────────────────────────────── */}
                <TabsContent value="active" className="mt-6">
                    {loans.length === 0 ? (
                        <div className="bento-card noise-bg p-8 text-center space-y-3">
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
                                <CreditCard className="h-7 w-7 text-primary" />
                            </div>
                            <p className="font-medium">No active loans</p>
                            <p className="text-sm text-muted-foreground">
                                Apply for a loan to get started. Approved loans will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {loans.map((loan) => (
                                <ActiveLoanCard key={loan.id} loan={loan} repayments={repayments} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ── Repayments tab ─────────────────────────────────────────────────── */}
                <TabsContent value="repayments" className="mt-6">
                    <RepaymentSchedule
                        loans={loans.filter((l) => l.status === 'active' || l.status === 'completed')}
                        repayments={repayments}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
