'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, Target, Loader2, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
    } from '@/components/ui/dialog'
import { createGoalSavings, contributeToGoal } from '@/lib/actions/fintech/safe'
import type { SafeGoalSavings } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string
{
    return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function progressPercent(current: number, target: number): number
{
    if (target === 0) return 0
    return Math.min(100, Math.round((current / target) * 100))
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const tomorrow = (() =>
{
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
})()

const createGoalSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
    target_amount: z
        .number({ invalid_type_error: 'Enter a valid amount' })
        .positive('Target must be greater than 0'),
    target_date: z.string().optional().refine((v) =>
    {
        if (!v || v.trim() === '') return true
        const d = new Date(v)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return d > today
    }, 'Target date must be in the future'),
})

const contributeSchema = z.object({
    amount: z
        .number({ invalid_type_error: 'Enter a valid amount' })
        .positive('Amount must be greater than 0'),
})

type CreateGoalFormValues = z.infer<typeof createGoalSchema>
type ContributeFormValues = z.infer<typeof contributeSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface GoalsTabProps
{
    goals: SafeGoalSavings[]
}

// ─── Contribute Modal ─────────────────────────────────────────────────────────

function ContributeModal({
    goal,
    open,
    onOpenChange,
}: {
    goal: SafeGoalSavings | null
    open: boolean
    onOpenChange: (v: boolean) => void
})
{
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContributeFormValues>({ resolver: zodResolver(contributeSchema) })

    async function handleFormSubmit(values: ContributeFormValues)
    {
        if (!goal) return
        const result = await contributeToGoal(goal.id, values.amount)
        if (result.success)
        {
            const newTotal = goal.current_amount + values.amount
            if (newTotal >= goal.target_amount)
            {
                toast.success(`🎉 Goal achieved! "${goal.name}" is complete!`)
            } else
            {
                toast.success(`₦${values.amount.toLocaleString()} added to "${goal.name}"`)
            }
            reset()
            onOpenChange(false)
        } else
        {
            toast.error(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Contribute to Goal — {goal?.name}</DialogTitle>
                </DialogHeader>
                {goal && (
                    <div className="mb-2 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{progressPercent(goal.current_amount, goal.target_amount)}%</span>
                        </div>
                        <Progress value={progressPercent(goal.current_amount, goal.target_amount)} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatNGN(goal.current_amount)}</span>
                            <span>of {formatNGN(goal.target_amount)}</span>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="contrib-amount">Amount (NGN)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                            <Input
                                id="contrib-amount"
                                type="number"
                                min={1}
                                step={100}
                                className="pl-7"
                                placeholder="5000"
                                {...register('amount', { valueAsNumber: true })}
                                disabled={isSubmitting}
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 gradient-primary text-white" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Adding…</> : 'Contribute'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoalsTab({ goals }: GoalsTabProps)
{
    const [showCreate, setShowCreate] = useState(false)
    const [contributeTarget, setContributeTarget] = useState<SafeGoalSavings | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CreateGoalFormValues>({
        resolver: zodResolver(createGoalSchema),
        defaultValues: { name: '', target_amount: undefined, target_date: '' },
    })

    async function handleCreate(values: CreateGoalFormValues)
    {
        const result = await createGoalSavings({
            name: values.name,
            target_amount: values.target_amount,
            target_date: values.target_date && values.target_date.trim() !== '' ? values.target_date : null,
        })

        if (result.success)
        {
            toast.success('Savings goal created!')
            setShowCreate(false)
            reset()
        } else
        {
            toast.error(result.error)
        }
    }

    const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0)
    const activeGoals = goals.filter((g) => g.status === 'active')
    const achievedGoals = goals.filter((g) => g.status === 'achieved')

    return (
        <div className="space-y-6">
            {/* Summary + Create */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">Total Saved Toward Goals</p>
                    <p className="text-2xl font-bold text-primary">{formatNGN(totalSaved)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {activeGoals.length} active · {achievedGoals.length} achieved
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="gap-2 gradient-primary text-white">
                    <PlusCircle className="h-4 w-4" />
                    Create Goal
                </Button>
            </div>

            {/* Goals list */}
            {goals.length === 0 ? (
                <div className="bento-card noise-bg p-8 text-center space-y-3">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 mx-auto">
                        <Target className="h-7 w-7 text-secondary" />
                    </div>
                    <p className="font-medium">No savings goals yet</p>
                    <p className="text-sm text-muted-foreground">Set a target and track your progress toward it.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {goals.map((goal) =>
                    {
                        const pct = progressPercent(goal.current_amount, goal.target_amount)
                        const isAchieved = goal.status === 'achieved'

                        return (
                            <div
                                key={goal.id}
                                className={`bento-card noise-bg p-5 space-y-4 ${isAchieved ? 'border-emerald-500/30' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold flex items-center gap-1.5">
                                            {isAchieved && <Trophy className="h-4 w-4 text-amber-500 shrink-0" />}
                                            {goal.name}
                                        </p>
                                        {goal.target_date && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Target: {formatDate(goal.target_date)}
                                            </p>
                                        )}
                                    </div>
                                    {isAchieved ? (
                                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20 shrink-0">
                                            Achieved
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-secondary border-secondary/40 shrink-0">
                                            Active
                                        </Badge>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{formatNGN(goal.current_amount)}</span>
                                        <span className="font-medium text-foreground">{pct}%</span>
                                        <span>{formatNGN(goal.target_amount)}</span>
                                    </div>
                                    <Progress
                                        value={pct}
                                        className={`h-2.5 ${isAchieved ? '[&>div]:bg-emerald-500' : '[&>div]:gradient-primary'}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {isAchieved
                                            ? 'Goal completed 🎉'
                                            : `₦${(goal.target_amount - goal.current_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })} remaining`}
                                    </p>
                                </div>

                                {!isAchieved && (
                                    <Button
                                        size="sm"
                                        className="w-full gap-1.5 gradient-primary text-white"
                                        onClick={() => setContributeTarget(goal)}
                                    >
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        Contribute
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create goal dialog */}
            <Dialog open={showCreate} onOpenChange={(v) => { if (!v) reset(); setShowCreate(v) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Savings Goal</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="goal-name">Goal Name</Label>
                            <Input id="goal-name" placeholder="e.g. New Laptop" {...register('name')} disabled={isSubmitting} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>

                        {/* Target Amount */}
                        <div className="space-y-1.5">
                            <Label htmlFor="goal-target">Target Amount (NGN)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                                <Input
                                    id="goal-target"
                                    type="number"
                                    min={1}
                                    step={100}
                                    className="pl-7"
                                    placeholder="50000"
                                    {...register('target_amount', { valueAsNumber: true })}
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.target_amount && <p className="text-xs text-destructive">{errors.target_amount.message}</p>}
                        </div>

                        {/* Target Date (optional) */}
                        <div className="space-y-1.5">
                            <Label htmlFor="goal-date">
                                Target Date <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                            </Label>
                            <Input
                                id="goal-date"
                                type="date"
                                min={tomorrow}
                                {...register('target_date')}
                                disabled={isSubmitting}
                            />
                            {errors.target_date && <p className="text-xs text-destructive">{errors.target_date.message}</p>}
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 gradient-primary text-white" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</> : 'Create Goal'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Contribute modal */}
            <ContributeModal
                goal={contributeTarget}
                open={!!contributeTarget}
                onOpenChange={(v) => { if (!v) setContributeTarget(null) }}
            />
        </div>
    )
}
