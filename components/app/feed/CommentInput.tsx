'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addComment } from '@/lib/actions/posts'
import { Send } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CommentResult
{
    id: string
    body: string
    created_at: string
    author: {
        username: string
        display_name: string
        avatar_url: string | null
    }
}

interface CommentInputProps
{
    postId: string
    onCommentAdded: (comment: CommentResult) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommentInput({ postId, onCommentAdded }: CommentInputProps)
{
    const [body, setBody] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const trimmed = body.trim()
    const isDisabled = !trimmed || trimmed.length > 1000 || isSubmitting
    const isOverLimit = trimmed.length > 1000

    async function handleSubmit(e: React.FormEvent)
    {
        e.preventDefault()
        if (isDisabled) return

        setIsSubmitting(true)
        try
        {
            const comment = await addComment(postId, trimmed)
            setBody('')
            textareaRef.current?.focus()
            onCommentAdded(comment)
        } catch (err)
        {
            console.error('addComment error:', err)
            toast.error('Failed to post comment. Please try again.')
        } finally
        {
            setIsSubmitting(false)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>)
    {
        // Cmd/Ctrl + Enter to submit
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter')
        {
            e.preventDefault()
            if (!isDisabled)
            {
                handleSubmit(e as unknown as React.FormEvent)
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a comment…"
                    rows={2}
                    maxLength={1100} // hard cap slightly above limit to allow counter feedback
                    className="resize-none pr-12"
                    disabled={isSubmitting}
                    aria-label="Write a comment"
                />
            </div>

            <div className="flex items-center justify-between gap-2">
                {/* Character counter */}
                <span
                    className={`text-xs tabular-nums ${isOverLimit
                            ? 'text-destructive font-medium'
                            : body.length > 900
                                ? 'text-amber-500'
                                : 'text-muted-foreground'
                        }`}
                    aria-live="polite"
                >
                    {body.length} / 1000
                </span>

                <Button
                    type="submit"
                    size="sm"
                    disabled={isDisabled}
                    className="gap-1.5"
                    aria-label="Post comment"
                >
                    <Send className="h-3.5 w-3.5" />
                    {isSubmitting ? 'Posting…' : 'Comment'}
                </Button>
            </div>

            {isOverLimit && (
                <p className="text-xs text-destructive" role="alert">
                    Comment is too long. Max 1000 characters.
                </p>
            )}
        </form>
    )
}
