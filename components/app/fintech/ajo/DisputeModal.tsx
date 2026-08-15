'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { raiseDispute } from '@/lib/actions/fintech/ajo'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface DisputeModalProps
{
    groupId: string
    groupName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DisputeModal({
    groupId,
    groupName,
    open,
    onOpenChange,
}: DisputeModalProps)
{
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const MAX_LENGTH = 1000
    const remaining = MAX_LENGTH - description.length

    async function handleSubmit(e: React.FormEvent)
    {
        e.preventDefault()
        setError(null)

        if (!description.trim())
        {
            setError('Please describe the dispute.')
            return
        }
        if (description.trim().length > MAX_LENGTH)
        {
            setError(`Description must be ${MAX_LENGTH} characters or fewer.`)
            return
        }

        setIsSubmitting(true)
        try
        {
            const result = await raiseDispute(groupId, description)
            if (result.success)
            {
                toast.success('Dispute raised. Group members have been notified.')
                setDescription('')
                onOpenChange(false)
            } else
            {
                setError(result.error)
            }
        } finally
        {
            setIsSubmitting(false)
        }
    }

    function handleOpenChange(open: boolean)
    {
        if (!isSubmitting)
        {
            if (!open)
            {
                setDescription('')
                setError(null)
            }
            onOpenChange(open)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Raise a Dispute</DialogTitle>
                    <DialogDescription className="line-clamp-2">
                        {groupName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="dispute_description">Describe the dispute</Label>
                        <Textarea
                            id="dispute_description"
                            placeholder="Describe the issue in detail — what happened, when, and what resolution you are seeking."
                            rows={5}
                            maxLength={MAX_LENGTH}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isSubmitting}
                            className="resize-none"
                        />
                        <div className="flex items-center justify-between">
                            {error ? (
                                <p className="text-xs text-destructive">{error}</p>
                            ) : (
                                <span />
                            )}
                            <p
                                className={`text-xs ml-auto ${remaining < 100 ? 'text-amber-500' : 'text-muted-foreground'
                                    }`}
                            >
                                {remaining} remaining
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            className="flex-1"
                            disabled={isSubmitting || !description.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Submitting…
                                </>
                            ) : (
                                'Raise Dispute'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
