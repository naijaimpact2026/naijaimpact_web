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
import { donateToCampaign } from '@/lib/actions/funding'

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

const donateSchema = z.object({
    amount: z
        .number({ invalid_type_error: 'Please enter a valid amount' })
        .min(100, 'Minimum donation is ₦100')
        .max(10_000_000, 'Maximum donation is ₦10,000,000'),
})

type DonateFormValues = z.infer<typeof donateSchema>

interface DonateModalProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    campaignId: string
    campaignTitle: string
    userEmail: string
}

export default function DonateModal({
    open,
    onOpenChange,
    campaignId,
    campaignTitle,
    userEmail,
}: DonateModalProps)
{
    const [isPaystackOpen, setIsPaystackOpen] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const form = useForm<DonateFormValues>({
        resolver: zodResolver(donateSchema),
        defaultValues: { amount: 1000 },
    })

    async function onSubmit(values: DonateFormValues)
    {
        setIsPaystackOpen(true)
        setSuccessMessage(null)

        try
        {
            const { reference } = await donateToCampaign(campaignId, values.amount)

            const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
            if (!paystackKey)
            {
                throw new Error('Payment configuration error')
            }

            if (!window.PaystackPop)
            {
                throw new Error('Paystack not loaded. Please refresh and try again.')
            }

            const handler = window.PaystackPop.setup({
                key: paystackKey,
                email: userEmail,
                amount: Math.round(values.amount * 100), // kobo
                ref: reference,
                metadata: {
                    type: 'campaign_donation',
                    campaignId,
                    campaignTitle,
                },
                onSuccess: () =>
                {
                    setIsPaystackOpen(false)
                    setSuccessMessage('Thank you for your donation!')
                    form.reset()
                    // Close modal after a short delay
                    setTimeout(() =>
                    {
                        onOpenChange(false)
                        setSuccessMessage(null)
                    }, 2000)
                },
                onClose: () =>
                {
                    setIsPaystackOpen(false)
                },
            })

            handler.openIframe()
        } catch (err: unknown)
        {
            setIsPaystackOpen(false)
            const message = err instanceof Error ? err.message : 'Something went wrong'
            form.setError('root', { message })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Donate to campaign</DialogTitle>
                    <DialogDescription className="line-clamp-2">{campaignTitle}</DialogDescription>
                </DialogHeader>

                {successMessage ? (
                    <div className="py-8 text-center space-y-2">
                        <div className="text-4xl">🎉</div>
                        <p className="font-semibold text-green-600">{successMessage}</p>
                        <p className="text-sm text-muted-foreground">Your donation is being processed.</p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (NGN)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
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
                                                    disabled={isPaystackOpen}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Quick amount buttons */}
                            <div className="flex gap-2 flex-wrap">
                                {[500, 1000, 5000, 10000].map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        className="px-3 py-1 rounded-full text-xs border border-border hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                                        onClick={() => form.setValue('amount', amt)}
                                        disabled={isPaystackOpen}
                                    >
                                        ₦{amt.toLocaleString()}
                                    </button>
                                ))}
                            </div>

                            {form.formState.errors.root && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.root.message}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full gradient-primary text-white"
                                disabled={isPaystackOpen || form.formState.isSubmitting}
                            >
                                {isPaystackOpen ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Opening payment…
                                    </>
                                ) : (
                                    'Donate now'
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
