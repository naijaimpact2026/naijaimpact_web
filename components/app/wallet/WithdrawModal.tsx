'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
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
import
    {
        InputOTP,
        InputOTPGroup,
        InputOTPSlot,
    } from '@/components/ui/input-otp'
import { requestWithdrawal } from '@/lib/actions/wallet'
import Link from 'next/link'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const bankSchema = z.object({
    bankName: z.string().min(2, 'Bank name is required').max(100),
    accountNumber: z
        .string()
        .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
    accountName: z.string().min(2, 'Account name is required').max(100),
    amount: z
        .number({ invalid_type_error: 'Please enter a valid amount' })
        .min(100, 'Minimum withdrawal is ₦100'),
})

const withdrawPinSchema = z.object({
    pin: z
        .string()
        .length(6, 'PIN must be exactly 6 digits')
        .regex(/^\d{6}$/, 'PIN must contain only digits'),
})

type BankFormValues = z.infer<typeof bankSchema>
type WithdrawPinFormValues = z.infer<typeof withdrawPinSchema>

type Step = 'bank' | 'pin' | 'success'

// ─── Props ────────────────────────────────────────────────────────────────────

interface WithdrawModalProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    hasPin: boolean
    currentBalance: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WithdrawModal({
    open,
    onOpenChange,
    hasPin,
    currentBalance,
}: WithdrawModalProps)
{
    const [step, setStep] = useState<Step>('bank')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Captured bank details to pass to step 2
    const [bankDetails, setBankDetails] = useState<BankFormValues | null>(null)

    const bankForm = useForm<BankFormValues>({
        resolver: zodResolver(bankSchema),
        defaultValues: {
            bankName: '',
            accountNumber: '',
            accountName: '',
            amount: undefined as unknown as number,
        },
    })

    const pinForm = useForm<WithdrawPinFormValues>({
        resolver: zodResolver(withdrawPinSchema),
        defaultValues: { pin: '' },
    })

    // ── Step 1: Bank details ──────────────────────────────────────────────────
    function onConfirmBank(values: BankFormValues)
    {
        if (values.amount > currentBalance)
        {
            bankForm.setError('amount', { message: 'Insufficient balance.' })
            return
        }
        setBankDetails(values)
        setError(null)
        setStep('pin')
    }

    // ── Step 2: PIN + submit ──────────────────────────────────────────────────
    async function onConfirmPin(values: WithdrawPinFormValues)
    {
        if (!bankDetails) return
        setLoading(true)
        setError(null)

        try
        {
            const result = await requestWithdrawal(
                bankDetails.bankName,
                bankDetails.accountNumber,
                bankDetails.accountName,
                bankDetails.amount,
                values.pin
            )

            if (!result.success)
            {
                const msg = result.error
                if (msg.toLowerCase().includes('pin') || msg.toLowerCase().includes('incorrect'))
                {
                    pinForm.setError('pin', { message: msg })
                } else if (msg.toLowerCase().includes('insufficient'))
                {
                    setError(msg)
                    setStep('bank')
                } else
                {
                    setError(msg)
                }
                return
            }

            setStep('success')
        } catch
        {
            setError('Withdrawal request failed. Please try again.')
        } finally
        {
            setLoading(false)
        }
    }

    // ── Reset + close ─────────────────────────────────────────────────────────
    function handleClose()
    {
        setStep('bank')
        setBankDetails(null)
        setError(null)
        bankForm.reset()
        pinForm.reset()
        onOpenChange(false)
    }

    function handleOpenChange(val: boolean)
    {
        if (!val) handleClose()
        else onOpenChange(val)
    }

    // ── No PIN — redirect to settings ─────────────────────────────────────────
    if (!hasPin)
    {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Withdraw Funds</DialogTitle>
                        <DialogDescription>You need a wallet PIN to withdraw funds.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Set a 6-digit PIN in Settings to secure your transactions.
                        </p>
                        <Button asChild className="w-full gradient-primary text-white">
                            <Link href="/app/settings" onClick={handleClose}>
                                Go to Settings
                            </Link>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">

                {/* ── Success ── */}
                {step === 'success' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Withdrawal Requested</DialogTitle>
                        </DialogHeader>
                        <div className="py-10 text-center space-y-3">
                            <div className="flex justify-center">
                                <CheckCircle className="h-16 w-16 text-emerald-500" />
                            </div>
                            <p className="font-semibold text-lg">
                                {formatNGN(bankDetails?.amount ?? 0)} withdrawal pending
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Your withdrawal to {bankDetails?.bankName} ({bankDetails?.accountNumber}) is being processed.
                            </p>
                            <Button onClick={handleClose} className="w-full mt-4">
                                Done
                            </Button>
                        </div>
                    </>
                )}

                {/* ── Step 1: Bank details ── */}
                {step === 'bank' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Withdraw Funds</DialogTitle>
                            <DialogDescription>Enter your bank account details</DialogDescription>
                        </DialogHeader>

                        <Form {...bankForm}>
                            <form
                                onSubmit={bankForm.handleSubmit(onConfirmBank)}
                                className="space-y-4"
                                noValidate
                            >
                                <FormField
                                    control={bankForm.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. First Bank"
                                                    {...field}
                                                    aria-label="Bank name"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={bankForm.control}
                                    name="accountNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                    placeholder="10-digit account number"
                                                    {...field}
                                                    aria-label="Bank account number"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={bankForm.control}
                                    name="accountName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Name on the account"
                                                    {...field}
                                                    aria-label="Bank account name"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={bankForm.control}
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
                                                        aria-label="Withdrawal amount in Naira"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-xs text-muted-foreground">
                                                Available balance: {formatNGN(currentBalance)}
                                            </p>
                                        </FormItem>
                                    )}
                                />

                                {error && (
                                    <p className="text-sm text-destructive" role="alert">
                                        {error}
                                    </p>
                                )}

                                <Button type="submit" className="w-full gradient-primary text-white">
                                    Continue
                                </Button>
                            </form>
                        </Form>
                    </>
                )}

                {/* ── Step 2: PIN ── */}
                {step === 'pin' && bankDetails && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Confirm Withdrawal</DialogTitle>
                            <DialogDescription>
                                Withdrawing {formatNGN(bankDetails.amount)} to {bankDetails.bankName}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Bank details summary */}
                        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Bank</span>
                                <span className="font-medium">{bankDetails.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Account</span>
                                <span className="font-medium">{bankDetails.accountNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Name</span>
                                <span className="font-medium">{bankDetails.accountName}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-border mt-1">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-semibold text-rose-600 dark:text-rose-400">
                                    -{formatNGN(bankDetails.amount)}
                                </span>
                            </div>
                        </div>

                        <Form {...pinForm}>
                            <form
                                onSubmit={pinForm.handleSubmit(onConfirmPin)}
                                className="space-y-5"
                                noValidate
                            >
                                <FormField
                                    control={pinForm.control}
                                    name="pin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-center block">Enter Wallet PIN</FormLabel>
                                            <FormControl>
                                                <div className="flex justify-center">
                                                    <InputOTP
                                                        maxLength={6}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        disabled={loading}
                                                        aria-label="Wallet PIN"
                                                    >
                                                        <InputOTPGroup>
                                                            <InputOTPSlot index={0} />
                                                            <InputOTPSlot index={1} />
                                                            <InputOTPSlot index={2} />
                                                            <InputOTPSlot index={3} />
                                                            <InputOTPSlot index={4} />
                                                            <InputOTPSlot index={5} />
                                                        </InputOTPGroup>
                                                    </InputOTP>
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-center" />
                                        </FormItem>
                                    )}
                                />

                                {pinForm.formState.errors.root && (
                                    <p className="text-sm text-destructive text-center" role="alert">
                                        {pinForm.formState.errors.root.message}
                                    </p>
                                )}

                                {error && (
                                    <p className="text-sm text-destructive text-center" role="alert">
                                        {error}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() =>
                                        {
                                            setStep('bank')
                                            setError(null)
                                            pinForm.reset()
                                        }}
                                        disabled={loading}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 gradient-primary text-white"
                                        disabled={loading}
                                        aria-busy={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Processing…
                                            </>
                                        ) : (
                                            'Withdraw'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
