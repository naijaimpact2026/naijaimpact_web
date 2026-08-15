'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff, Search, CheckCircle, ArrowLeft } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import
    {
        Form,
        FormControl,
        FormField,
        FormItem,
        FormLabel,
        FormMessage,
    } from '@/components/ui/form'
import { sendFunds, lookupUser } from '@/lib/actions/wallet'
import Link from 'next/link'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const recipientSchema = z.object({
    username: z
        .string()
        .min(1, 'Username is required')
        .max(30, 'Username too long')
        .regex(/^[a-z0-9_]+$/, 'Enter a valid username (lowercase, numbers, underscores)'),
})

const sendSchema = z.object({
    amount: z
        .number({ invalid_type_error: 'Please enter a valid amount' })
        .min(50, 'Minimum transfer is ₦50'),
})

const pinSchema = z.object({
    pin: z
        .string()
        .length(6, 'PIN must be exactly 6 digits')
        .regex(/^\d{6}$/, 'PIN must contain only digits'),
})

type RecipientFormValues = z.infer<typeof recipientSchema>
type SendFormValues = z.infer<typeof sendSchema>
type PinFormValues = z.infer<typeof pinSchema>

type Step = 'recipient' | 'amount' | 'pin' | 'success'

interface RecipientInfo
{
    id: string
    display_name: string
    avatar_url: string | null
    username: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SendModalProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    hasPin: boolean
    currentBalance: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SendModal({
    open,
    onOpenChange,
    hasPin,
    currentBalance,
}: SendModalProps)
{
    const [step, setStep] = useState<Step>('recipient')
    const [loading, setLoading] = useState(false)
    const [recipient, setRecipient] = useState<RecipientInfo | null>(null)
    const [sendAmount, setSendAmount] = useState(0)
    const [showPin, setShowPin] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Forms
    const recipientForm = useForm<RecipientFormValues>({
        resolver: zodResolver(recipientSchema),
        defaultValues: { username: '' },
    })

    const sendForm = useForm<SendFormValues>({
        resolver: zodResolver(sendSchema),
        defaultValues: { amount: 500 },
    })

    const pinForm = useForm<PinFormValues>({
        resolver: zodResolver(pinSchema),
        defaultValues: { pin: '' },
    })

    // ── Step: recipient lookup ─────────────────────────────────────────────────
    async function onLookupRecipient(values: RecipientFormValues)
    {
        setLoading(true)
        setError(null)
        try
        {
            const result = await lookupUser(values.username)
            if (!result.success)
            {
                recipientForm.setError('username', { message: result.error })
                return
            }
            setRecipient({ ...result.data!, username: values.username })
            setStep('amount')
        } catch
        {
            setError('Failed to look up user. Please try again.')
        } finally
        {
            setLoading(false)
        }
    }

    // ── Step: amount ──────────────────────────────────────────────────────────
    function onConfirmAmount(values: SendFormValues)
    {
        setSendAmount(values.amount)
        setStep('pin')
    }

    // ── Step: PIN + send ──────────────────────────────────────────────────────
    async function onConfirmPin(values: PinFormValues)
    {
        if (!recipient) return
        setLoading(true)
        setError(null)
        try
        {
            const result = await sendFunds(recipient.username, sendAmount, values.pin)
            if (!result.success)
            {
                if (result.error.toLowerCase().includes('incorrect pin') || result.error.toLowerCase().includes('pin'))
                {
                    pinForm.setError('pin', { message: result.error })
                } else if (result.error.toLowerCase().includes('insufficient'))
                {
                    setError(result.error)
                    setStep('amount')
                } else if (result.error.toLowerCase().includes('locked'))
                {
                    setError(result.error)
                    pinForm.setError('root', { message: result.error })
                } else
                {
                    setError(result.error)
                }
                return
            }
            setStep('success')
        } catch
        {
            setError('Transfer failed. Please try again.')
        } finally
        {
            setLoading(false)
        }
    }

    // ── Reset and close ────────────────────────────────────────────────────────
    function handleClose()
    {
        setStep('recipient')
        setRecipient(null)
        setSendAmount(0)
        setError(null)
        setShowPin(false)
        recipientForm.reset()
        sendForm.reset()
        pinForm.reset()
        onOpenChange(false)
    }

    function handleOpenChange(val: boolean)
    {
        if (!val) handleClose()
        else onOpenChange(val)
    }

    // ── No PIN set — prompt to set one ────────────────────────────────────────
    if (!hasPin)
    {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Send Funds</DialogTitle>
                        <DialogDescription>You need a wallet PIN to send funds.</DialogDescription>
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
                            <DialogTitle>Transfer Complete</DialogTitle>
                        </DialogHeader>
                        <div className="py-10 text-center space-y-3">
                            <div className="flex justify-center">
                                <CheckCircle className="h-16 w-16 text-emerald-500" />
                            </div>
                            <p className="font-semibold text-lg">
                                {formatNGN(sendAmount)} sent to @{recipient?.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                The funds have been transferred successfully.
                            </p>
                            <Button onClick={handleClose} className="w-full mt-4">
                                Done
                            </Button>
                        </div>
                    </>
                )}

                {/* ── Step 1: Recipient ── */}
                {step === 'recipient' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Send Funds</DialogTitle>
                            <DialogDescription>Enter the username of who you want to send to</DialogDescription>
                        </DialogHeader>
                        <Form {...recipientForm}>
                            <form
                                onSubmit={recipientForm.handleSubmit(onLookupRecipient)}
                                className="space-y-5"
                                noValidate
                            >
                                <FormField
                                    control={recipientForm.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Recipient Username</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none">
                                                        @
                                                    </span>
                                                    <Input
                                                        className="pl-7"
                                                        placeholder="username"
                                                        autoCapitalize="none"
                                                        autoCorrect="off"
                                                        disabled={loading}
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                                                        aria-label="Recipient username"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {error && (
                                    <p className="text-sm text-destructive" role="alert">
                                        {error}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading}
                                    aria-busy={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Looking up…
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-4 w-4 mr-2" />
                                            Find Recipient
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </>
                )}

                {/* ── Step 2: Amount ── */}
                {step === 'amount' && recipient && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Send Funds</DialogTitle>
                            <DialogDescription>Enter the amount to send</DialogDescription>
                        </DialogHeader>

                        {/* Recipient preview */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={recipient.avatar_url ?? undefined} />
                                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                    {recipient.display_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-semibold">{recipient.display_name}</p>
                                <p className="text-xs text-muted-foreground">@{recipient.username}</p>
                            </div>
                        </div>

                        <Form {...sendForm}>
                            <form onSubmit={sendForm.handleSubmit(onConfirmAmount)} className="space-y-5" noValidate>
                                <FormField
                                    control={sendForm.control}
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
                                                        min={50}
                                                        step={50}
                                                        className="pl-7"
                                                        placeholder="500"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                        aria-label="Amount to send in Naira"
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

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() =>
                                        {
                                            setStep('recipient')
                                            setError(null)
                                        }}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Back
                                    </Button>
                                    <Button type="submit" className="flex-1 gradient-primary text-white">
                                        Continue
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </>
                )}

                {/* ── Step 3: PIN ── */}
                {step === 'pin' && recipient && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Confirm Transfer</DialogTitle>
                            <DialogDescription>
                                Sending {formatNGN(sendAmount)} to @{recipient.username}
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...pinForm}>
                            <form onSubmit={pinForm.handleSubmit(onConfirmPin)} className="space-y-5" noValidate>
                                <FormField
                                    control={pinForm.control}
                                    name="pin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Wallet PIN</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPin ? 'text' : 'password'}
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        placeholder="······"
                                                        className="pr-10 tracking-[0.5em] text-center"
                                                        disabled={loading}
                                                        {...field}
                                                        aria-label="Wallet PIN"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPin((v) => !v)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                                                    >
                                                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {pinForm.formState.errors.root && (
                                    <p className="text-sm text-destructive" role="alert">
                                        {pinForm.formState.errors.root.message}
                                    </p>
                                )}

                                {error && (
                                    <p className="text-sm text-destructive" role="alert">
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
                                            setStep('amount')
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
                                                Sending…
                                            </>
                                        ) : (
                                            'Send Funds'
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
