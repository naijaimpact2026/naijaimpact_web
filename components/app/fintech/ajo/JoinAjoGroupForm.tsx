'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinAjoGroup } from '@/lib/actions/fintech/ajo'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface JoinAjoGroupFormProps
{
    onSuccess: () => void
    onCancel: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JoinAjoGroupForm({ onSuccess, onCancel }: JoinAjoGroupFormProps)
{
    const [token, setToken] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent)
    {
        e.preventDefault()
        setError(null)

        if (!token.trim())
        {
            setError('Please enter a Group ID or invite token.')
            return
        }

        setIsSubmitting(true)
        try
        {
            const result = await joinAjoGroup(token.trim())
            if (result.success)
            {
                toast.success('You have joined the Ajo group!')
                onSuccess()
            } else
            {
                setError(result.error)
            }
        } finally
        {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="invite_token">Group ID or Invite Token</Label>
                <Input
                    id="invite_token"
                    placeholder="Paste the Group ID here"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                    Ask the group creator to share their Group ID with you.
                </p>
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

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
                    disabled={isSubmitting || !token.trim()}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Joining…
                        </>
                    ) : (
                        'Join Group'
                    )}
                </Button>
            </div>
        </form>
    )
}
