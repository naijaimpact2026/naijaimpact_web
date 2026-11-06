'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import
    {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '@/components/ui/select'
import { createAjoGroup } from '@/lib/actions/fintech/ajo'

// ─── Schema ───────────────────────────────────────────────────────────────────

const createGroupSchema = z.object({
    name: z.string().min(1, 'Group name is required').max(100, 'Name must be 100 characters or fewer'),
    contribution_amount: z
        .number({ invalid_type_error: 'Enter a valid amount' })
        .min(1, 'Contribution amount must be greater than 0'),
    frequency: z.enum(['weekly', 'biweekly', 'monthly'], {
        required_error: 'Please select a frequency',
    }),
    member_limit: z
        .number({ invalid_type_error: 'Enter a valid number' })
        .int()
        .min(2, 'Minimum 2 members')
        .max(20, 'Maximum 20 members'),
    start_date: z.string().min(1, 'Start date is required'),
})

type CreateGroupFormValues = z.infer<typeof createGroupSchema>

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CreateAjoGroupFormProps
{
    onSuccess: () => void
    onCancel: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateAjoGroupForm({ onSuccess, onCancel }: CreateAjoGroupFormProps)
{
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<CreateGroupFormValues>({
        resolver: zodResolver(createGroupSchema),
        defaultValues: {
            name: '',
            contribution_amount: undefined,
            frequency: undefined,
            member_limit: 5,
            start_date: '',
        },
    })

    const frequency = watch('frequency')

    // Compute tomorrow's date for the min attribute on the date input
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = tomorrow.toISOString().split('T')[0]

    async function onSubmit(values: CreateGroupFormValues)
    {
        // Extra client-side check: start_date must be future
        const startDate = new Date(values.start_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (startDate <= today)
        {
            return
        }

        const result = await createAjoGroup({
            name: values.name,
            contribution_amount: values.contribution_amount,
            frequency: values.frequency,
            member_limit: values.member_limit,
            start_date: values.start_date,
        })

        if (result.success)
        {
            toast.success('Ajo group created! Share your Group ID with members.')
            onSuccess()
        }
        // Errors are shown inline — no need for toast on error
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
                <Label htmlFor="name">Group Name</Label>
                <Input
                    id="name"
                    placeholder="e.g. Monday Ladies Ajo"
                    {...register('name')}
                    disabled={isSubmitting}
                />
                {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
            </div>

            {/* Contribution Amount */}
            <div className="space-y-1.5">
                <Label htmlFor="contribution_amount">Contribution Amount (NGN)</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        ₦
                    </span>
                    <Input
                        id="contribution_amount"
                        type="number"
                        min={1}
                        step={100}
                        className="pl-7"
                        placeholder="5000"
                        {...register('contribution_amount', { valueAsNumber: true })}
                        disabled={isSubmitting}
                    />
                </div>
                {errors.contribution_amount && (
                    <p className="text-xs text-destructive">{errors.contribution_amount.message}</p>
                )}
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select
                    value={frequency}
                    onValueChange={(val) =>
                        setValue('frequency', val as 'weekly' | 'biweekly' | 'monthly', {
                            shouldValidate: true,
                        })
                    }
                    disabled={isSubmitting}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                </Select>
                {errors.frequency && (
                    <p className="text-xs text-destructive">{errors.frequency.message}</p>
                )}
            </div>

            {/* Member Limit */}
            <div className="space-y-1.5">
                <Label htmlFor="member_limit">Member Limit (2–20)</Label>
                <Input
                    id="member_limit"
                    type="number"
                    min={2}
                    max={20}
                    {...register('member_limit', { valueAsNumber: true })}
                    disabled={isSubmitting}
                />
                {errors.member_limit && (
                    <p className="text-xs text-destructive">{errors.member_limit.message}</p>
                )}
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                    id="start_date"
                    type="date"
                    min={minDate}
                    {...register('start_date', {
                        validate: (v) =>
                        {
                            const d = new Date(v)
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            return d > today || 'Start date must be a future date'
                        },
                    })}
                    disabled={isSubmitting}
                />
                {errors.start_date && (
                    <p className="text-xs text-destructive">{errors.start_date.message}</p>
                )}
            </div>

            {/* Root error */}
            {errors.root && (
                <p className="text-sm text-destructive">{errors.root.message}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="flex-1 gradient-primary text-white"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Creating…
                        </>
                    ) : (
                        'Create Group'
                    )}
                </Button>
            </div>
        </form>
    )
}
