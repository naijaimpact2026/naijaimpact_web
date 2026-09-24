'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, Lock, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
    } from '@/components/ui/dialog'
import
    {
        Alert,
        AlertDescription,
    } from '@/components/ui/alert'
import { createLockedSavings } from '@/lib/actions/fintech/safe'
import type { SafeLockedSavings } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string
{
    return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isMatured(lockUntil: string): boolean
{
    return new Date(lockUntil) <= new Date()
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const tomorrow = (() =>
{
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
})()

const lockedSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
    amount: z
        .number({ invalid_type_error: 'Enter a valid amount' })
        .positive('Amount must be greater than 0'),
    lock_until: z.string().min(1, 'Lock-until date is required').refine((v) =>
    {
        const d = new Date(v)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return d > today
    }, 'Date must be in the future'),
    interest_rate: z
        .number({ invalid_type_error: 'Enter a valid rate' })
        .min(0, 'Min 0%')
        .max(100, 'Max 100%'),
})

type LockedFormValues = z.infer<typeof lockedSchema>

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, lockUntil }: { status: SafeLockedSavings['status']; lockUntil: string })
{
    // Auto-detect matured even if DB hasn't been updated
    const effectiveStatus = status === 'locked' && isMatured(lockUntil) ? 'matured' : status

    if (effectiveStatus === 'locked')
    {
        return (
            <Badge variant="outline" className="text-amber-600 border-amber-500/40 bg-amber-50 dark:bg-amber-900/20 shrink-0">
                Locked
            </Badge>
        )
    }
    if (effectiveStatus === 'matured')
    {
        return (
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20 shrink-0">
                Matured
            </Badge>
        )
    }
    return (
        <Badge variant="outline" className="text-muted-foreground shrink-0">
            Withdrawn
        </Badge>
    )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LockedTabProps
{
    savings: SafeLockedSavings[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LockedTab({ savings }: LockedTabProps)
{
    const [showCreate, setShowCreate] = useState(false)
    const [penaltyWarningItem, setPenaltyWarningItem] = useState<SafeLockedSavings | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<LockedFormValues>({
        resolver: zodResolver(lockedSchema),
        defaultValues: { name: '', amount: undefined, lock_until: '', interest_rate: 0 },
    })

    async function handleCreate(values: LockedFormValues)
    {
        const result = await createLockedSavings({
            name: values.name,
            amount: values.amount,
            lock_until: values.lock_until,
            interest_rate: values.interest_rate,
        })

        if (result.success)
        {
            toast.success('Locked savings created!')
            setShowCreate(false)
            reset()
        } else
        {
            toast.error(result.error)
        }
    }

    const totalLocked = savings
        .filter((s) => s.status !== 'withdrawn')
        .reduce((sum, s) => sum + s.amount, 0)

    return (
        <div className="space-y-6">
            {/* Summary + Create */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">Total Locked</p>
                    <p className="text-2xl font-bold text-primary">{formatNGN(totalLocked)}</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="gap-2 gradient-primary text-white">
                    <PlusCircle className="h-4 w-4" />
                    Create Locked Savings
                </Button>
            </div>

            {/* Savings list */}
            {savings.length === 0 ? (
                <div className="bento-card noise-bg p-8 text-center space-y-3">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto">
                        <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="font-medium">No locked savings yet</p>
                    <p className="text-sm text-muted-foreground">Lock funds for a set period to earn interest.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {savings.map((item) =>
                    {
                        const matured = isMatured(item.lock_until)
                        const isLocked = item.status === 'locked' && !matured

                        return (
                            <div key={item.id} className="bento-card noise-bg p-5 space-y-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {item.interest_rate}% p.a. · Locked until {formatDate(item.lock_until)}
                                        </p>
                                    </div>
                                    <StatusBadge status={item.status} lockUntil={item.lock_until} />
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">Amount</p>
                                    <p className="text-3xl font-bold tracking-tight mt-0.5">{formatNGN(item.amount)}</p>
                                </div>

                                {/* Show early withdrawal warning button if still locked */}
                                {isLocked && item.status !== 'withdrawn' && (
                                    <button
                                        type="button"
                                        onClick={() => setPenaltyWarningItem(item)}
                                        className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline transition-colors"
                                    >
                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                        Early withdrawal info
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create locked savings dialog */}
            <Dialog open={showCreate} onOpenChange={(v) => { if (!v) reset(); setShowCreate(v) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Locked Savings</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ls-name">Name</Label>
                            <Input id="ls-name" placeholder="e.g. 3-Month Lock" {...register('name')} disabled={isSubmitting} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>

                        {/* Amount */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ls-amount">Amount (NGN)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                                <Input
                                    id="ls-amount"
                                    type="number"
                                    min={1}
                                    step={100}
                                    className="pl-7"
                                    placeholder="10000"
                                    {...register('amount', { valueAsNumber: true })}
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                        </div>

                        {/* Lock Until */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ls-lock-until">Lock Until</Label>
                            <Input
                                id="ls-lock-until"
                                type="date"
                                min={tomorrow}
                                {...register('lock_until')}
                                disabled={isSubmitting}
                            />
                            {errors.lock_until && <p className="text-xs text-destructive">{errors.lock_until.message}</p>}
                        </div>

                        {/* Interest Rate */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ls-rate">Interest Rate (% p.a.)</Label>
                            <Input
                                id="ls-rate"
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                placeholder="5"
                                {...register('interest_rate', { valueAsNumber: true })}
                                disabled={isSubmitting}
                            />
                            {errors.interest_rate && <p className="text-xs text-destructive">{errors.interest_rate.message}</p>}
                        </div>

                        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
                                Funds will be locked until the specified date. Early withdrawal may incur a penalty.
                            </AlertDescription>
                        </Alert>

                        <div className="flex gap-3">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 gradient-primary text-white" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</> : 'Lock Funds'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Early withdrawal penalty warning */}
            <Dialog open={!!penaltyWarningItem} onOpenChange={(v) => { if (!v) setPenaltyWarningItem(null) }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Early Withdrawal Warning
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                            <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
                                <strong>{penaltyWarningItem?.name}</strong> is locked until{' '}
                                <strong>{penaltyWarningItem ? formatDate(penaltyWarningItem.lock_until) : ''}</strong>.
                                <br /><br />
                                Withdrawing before the lock date may result in a penalty and loss of accrued interest.
                                Please wait until the lock period expires to avoid penalties.
                            </AlertDescription>
                        </Alert>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setPenaltyWarningItem(null)}
                        >
                            Understood
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
