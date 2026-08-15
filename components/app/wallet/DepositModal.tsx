'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import
    {
        Form,
        FormControl,
        FormField,
        FormItem,
        FormLabel,
        FormMessage,
    } from '@/components/ui/form'
import { depositCallback } from '@/lib/actions/wallet'

// ─── PaystackPop global type ──────────────────────────────────────────────────

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

// ─── Schema ───────────────────────────────────────────────────────────────────

const depositSchema = z.object({
    amount: z
        .number({ invalid_type_error: 'Please enter a valid amount' })
        .min(100, 'Minimum deposit is ₦100')
        .max(10_000_000, 'Maximum deposit is ₦10,000,000'),
})

type DepositFormValues = z.infer<typeof depositSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface DepositModalProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    userEmail: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DepositModal({ open, onOpenChange, userEmail }: DepositModalProps)
{
    const [inFlight, setInFlight] = useState(false)
    const [success, setSuccess] = useState(false)

    const form = useForm<DepositFormValues>({
        resolver: zodResolver(depositSchema),
        defaultValues: { amount: 1000 },
    })

    async function onSubmit(values: DepositFormValues)
    {
        setInFlight(true)

        try
        {
            const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
            if (!paystackKey) throw new Error('Payment configuration error')
            if (!window.PaystackPop) throw new Error('Paystack not loaded. Please refresh and try again.')

            // Generate a unique reference
            const ref = `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

            const handler = window.PaystackPop.setup({
                key: paystackKey,
                email: userEmail,
                amount: Math.round(values.amount * 100), // kobo
                ref,
                metadata: {
                    type: 'deposit',
                    userId: undefined, // webhook resolves via email/user lookup; userId populated server-side
                },
                onSuccess: async (transaction) =>
                {
                    // Notify server-side (actual crediting done by webhook)
                    await depositCallback(transaction.reference)
                    setInFlight(false)
                    setSuccess(true)
                    form.reset()
                    setTimeout(() =>
                    {
                        setSuccess(false)
                        onOpenChange(false)
                    }, 2500)
                },
                onClose: () =>
                {
                    setInFlight(false)
                },
            })

            handler.openIframe()
        } catch (err: unknown)
        {
            setInFlight(false)
            const message = err instanceof Error ? err.message : 'Something went wrong'
            form.setError('root', { message })
        }
    }

    function handleOpenChange(val: boolean)
    {
        if (inFlight) return // block close while payment popup is open
        if (!val)
        {
            form.reset()
            setSuccess(false)
        }
        onOpenChange(val)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Deposit Funds</DialogTitle>
                    <DialogDescription>Add money to your NaijaImpact wallet via Paystack</DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-10 text-center space-y-2">
                        <div className="text-5xl">🎉</div>
                        <p className="font-semibold text-emerald-600">Deposit initiated!</p>
                        <p className="text-sm text-muted-foreground">
                            Your balance will be updated shortly after payment confirmation.
                        </p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (NGN)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium select-none">
                                                    ₦
                                                </span>
                                                <Input
                                                    type="number"
                                                    min={100}
                                                    step={100}
                                                    className="pl-7"
                                                    placeholder="1000"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    disabled={inFlight}
                                                    aria-label="Deposit amount in Naira"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Quick-pick amounts */}
                            <div className="flex gap-2 flex-wrap" role="group" aria-label="Quick amount selection">
                                {[500, 1000, 5000, 10000, 50000].map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        className="px-3 py-1 rounded-full text-xs border border-border hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                                        onClick={() => form.setValue('amount', amt, { shouldValidate: true })}
                                        disabled={inFlight}
                                        aria-label={`Set amount to ₦${amt.toLocaleString()}`}
                                    >
                                        ₦{amt.toLocaleString()}
                                    </button>
                                ))}
                            </div>

                            {form.formState.errors.root && (
                                <p className="text-sm text-destructive" role="alert">
                                    {form.formState.errors.root.message}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full gradient-primary text-white"
                                disabled={inFlight || form.formState.isSubmitting}
                                aria-busy={inFlight}
                            >
                                {inFlight ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Opening payment…
                                    </>
                                ) : (
                                    'Deposit now'
                                )}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                Secured by Paystack. Your payment is safe.
                            </p>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    )
}
