'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { applyForLoan } from '@/lib/actions/fintech/credit'
import type { LoanProduct } from '@/lib/types'

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number
{
    // Simple interest calculation: total = principal + (principal * rate * months / 12)
    const totalInterest = (principal * (annualRate / 100) * months) / 12
    const totalAmount = principal + totalInterest
    return totalAmount / months
}

interface LoanApplicationFormProps
{
    product: LoanProduct
    onBack: () => void
    onSuccess: () => void
}

export default function LoanApplicationForm({
    product,
    onBack,
    onSuccess,
}: LoanApplicationFormProps)
{
    const schema = z.object({
        amount: z
            .number({ invalid_type_error: 'Enter a valid amount' })
            .min(product.min_amount, `Minimum is ${formatNGN(product.min_amount)}`)
            .max(product.max_amount, `Maximum is ${formatNGN(product.max_amount)}`),
        tenure_months: z.number({ invalid_type_error: 'Select a tenure' }).refine(
            (v) => product.tenure_options.includes(v),
            { message: 'Please select a valid tenure option' }
        ),
    })

    type FormValues = z.infer<typeof schema>

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            amount: product.min_amount,
            tenure_months: product.tenure_options[0],
        },
    })

    const watchedAmount = watch('amount') || 0
    const watchedTenure = watch('tenure_months') || product.tenure_options[0]
    const monthlyPayment = calculateMonthlyPayment(watchedAmount, product.interest_rate_pa, watchedTenure)
    const totalRepayment = monthlyPayment * watchedTenure

    async function onSubmit(values: FormValues)
    {
        const result = await applyForLoan({
            product_id: product.id,
            amount: values.amount,
            tenure_months: values.tenure_months,
        })

        if (result.success)
        {
            toast.success('Loan application submitted! We\'ll review it shortly.')
            onSuccess()
        } else
        {
            toast.error(result.error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Back button + header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <div>
                    <h2 className="font-semibold">Apply for {product.name}</h2>
                    <p className="text-xs text-muted-foreground">Fill in the details below to submit your application</p>
                </div>
            </div>

            {/* Product summary */}
            <div className="bento-card noise-bg p-4 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {formatNGN(product.min_amount)} – {formatNGN(product.max_amount)} · {product.interest_rate_pa}% p.a.
                    </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                    {product.tenure_options.join(', ')} months
                </Badge>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Amount */}
                <div className="space-y-1.5">
                    <Label htmlFor="amount">Loan Amount</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                        <Input
                            id="amount"
                            type="number"
                            min={product.min_amount}
                            max={product.max_amount}
                            step={1000}
                            className="pl-7"
                            placeholder={product.min_amount.toString()}
                            {...register('amount', { valueAsNumber: true })}
                            disabled={isSubmitting}
                        />
                    </div>
                    {errors.amount ? (
                        <p className="text-xs text-destructive">{errors.amount.message}</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Between {formatNGN(product.min_amount)} and {formatNGN(product.max_amount)}
                        </p>
                    )}
                </div>

                {/* Tenure */}
                <div className="space-y-1.5">
                    <Label>Repayment Tenure</Label>
                    <div className="flex flex-wrap gap-2">
                        {product.tenure_options.map((t) =>
                        {
                            const isSelected = watchedTenure === t
                            return (
                                <label
                                    key={t}
                                    className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${isSelected
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border bg-background hover:bg-muted/50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        className="sr-only"
                                        value={t}
                                        {...register('tenure_months', { valueAsNumber: true })}
                                        disabled={isSubmitting}
                                    />
                                    {t} months
                                </label>
                            )
                        })}
                    </div>
                    {errors.tenure_months && (
                        <p className="text-xs text-destructive">{errors.tenure_months.message}</p>
                    )}
                </div>

                {/* Repayment preview */}
                {watchedAmount > 0 && watchedTenure > 0 && (
                    <div className="bento-card noise-bg p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Repayment Preview
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[11px] text-muted-foreground">Monthly Payment</p>
                                <p className="text-base font-bold text-primary">
                                    {formatNGN(Math.round(monthlyPayment))}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-muted-foreground">Total Repayment</p>
                                <p className="text-base font-bold">
                                    {formatNGN(Math.round(totalRepayment))}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-muted-foreground">Interest Rate</p>
                                <p className="text-base font-bold">{product.interest_rate_pa}% p.a.</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-muted-foreground">Tenure</p>
                                <p className="text-base font-bold">{watchedTenure} months</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={onBack}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 gap-2 gradient-primary text-white"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Submitting…
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-4 w-4" />
                                Submit Application
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
