'use client'

import { useState } from 'react'
import { Loader2, Shield, CheckCircle2 } from 'lucide-react'
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { purchasePolicy } from '@/lib/actions/fintech/insure'
import type { InsureProduct } from '@/lib/types'

// Paystack global type declaration
declare global
{
    interface Window
    {
        PaystackPop: {
            setup(config: {
                key: string
                email: string
                amount: number
                ref: string
                metadata?: Record<string, unknown>
                onSuccess: (transaction: { reference: string }) => void
                onClose: () => void
            }): { openIframe(): void }
        }
    }
}

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}

interface PurchasePolicyModalProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    product: InsureProduct | null
    userEmail: string
    onSuccess: () => void
}

export default function PurchasePolicyModal({
    open,
    onOpenChange,
    product,
    userEmail,
    onSuccess,
}: PurchasePolicyModalProps)
{
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    if (!product) return null

    const premium = product.premium_monthly ?? (product as any).monthly_premium ?? 0
    const durationMonths = product.coverage_months ?? (product as any).duration_months ?? 12

    async function handleConfirm()
    {
        if (!product) return
        setIsLoading(true)
        setError(null)

        try
        {
            const { reference } = await purchasePolicy(product.id, premium)

            const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
            if (!paystackKey) throw new Error('Payment configuration error')

            if (!window.PaystackPop)
            {
                throw new Error('Paystack not loaded. Please refresh and try again.')
            }

            const handler = window.PaystackPop.setup({
                key: paystackKey,
                email: userEmail,
                amount: Math.round(premium * 100), // kobo
                ref: reference,
                metadata: {
                    type: 'insurance_premium',
                    productId: product.id,
                    productName: product.name,
                },
                onSuccess: () =>
                {
                    setIsLoading(false)
                    setSuccessMessage('Policy purchased successfully!')
                    setTimeout(() =>
                    {
                        onOpenChange(false)
                        setSuccessMessage(null)
                        onSuccess()
                    }, 2000)
                },
                onClose: () =>
                {
                    setIsLoading(false)
                },
            })

            handler.openIframe()
        } catch (err: unknown)
        {
            setIsLoading(false)
            setError(err instanceof Error ? err.message : 'Something went wrong')
        }
    }

    function handleOpenChange(nextOpen: boolean)
    {
        if (!nextOpen)
        {
            setError(null)
            setSuccessMessage(null)
            setIsLoading(false)
        }
        onOpenChange(nextOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Purchase Policy
                    </DialogTitle>
                    <DialogDescription>{product.name}</DialogDescription>
                </DialogHeader>

                {successMessage ? (
                    <div className="py-8 text-center space-y-2">
                        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                        <p className="font-semibold text-emerald-600">{successMessage}</p>
                        <p className="text-sm text-muted-foreground">Your policy is now active.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Policy summary */}
                        <div className="bento-card noise-bg p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Coverage amount</span>
                                <span className="font-semibold">{formatNGN(product.coverage_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Monthly premium</span>
                                <span className="font-semibold text-primary">{formatNGN(premium)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Duration</span>
                                <span className="font-semibold">{durationMonths} months</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total cost</span>
                                <span className="font-bold">{formatNGN(premium * durationMonths)}</span>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            You will be charged <strong>{formatNGN(premium)}</strong> now for the first month's
                            premium. Secured by Paystack.
                        </p>

                        {error && <p className="text-sm text-destructive text-center">{error}</p>}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 gradient-primary text-white"
                                onClick={handleConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Processing…
                                    </>
                                ) : (
                                    `Pay ${formatNGN(premium)}`
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
