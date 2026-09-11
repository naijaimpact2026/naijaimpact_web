'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addComment } from '@/lib/actions/posts'
import { Send, X } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CommentResult
{
    id: string
    body: string
    created_at: string
    parent_comment_id: string | null
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
    parentCommentId?: string | null
    placeholder?: string
    replyingToName?: string
    onCancel?: () => void
    autoFocus?: boolean
    compact?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommentInput({
    postId,
    onCommentAdded,
    parentCommentId = null,
    placeholder,
    replyingToName,
    onCancel,
    autoFocus = false,
    compact = false,
}: CommentInputProps)
{
    const [body, setBody] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() =>
    {
        if (autoFocus) textareaRef.current?.focus()
    }, [autoFocus])

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
            const comment = await addComment(postId, trimmed, parentCommentId)
            setBody('')
            onCommentAdded(comment)
            if (parentCommentId) onCancel?.()
            else textareaRef.current?.focus()
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
        if (e.key === 'Escape' && onCancel)
        {
            onCancel()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            {replyingToName && (
                <div className="flex items-center justify-between rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
                    <span>
                        Replying to <span className="font-semibold text-foreground">@{replyingToName}</span>
                    </span>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            aria-label="Cancel reply"
                            className="rounded-full p-0.5 hover:bg-background transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            )}

            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder ?? 'Write a comment…'}
                    rows={compact ? 1 : 2}
                    maxLength={1100} // hard cap slightly above limit to allow counter feedback
                    className="resize-none pr-12"
                    disabled={isSubmitting}
                    aria-label={parentCommentId ? 'Write a reply' : 'Write a comment'}
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

                <div className="flex items-center gap-2">
                    {onCancel && !replyingToName && (
                        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isDisabled}
                        className="gap-1.5"
                        aria-label={parentCommentId ? 'Post reply' : 'Post comment'}
                    >
                        <Send className="h-3.5 w-3.5" />
                        {isSubmitting ? 'Posting…' : parentCommentId ? 'Reply' : 'Comment'}
                    </Button>
                </div>
            </div>

            {isOverLimit && (
                <p className="text-xs text-destructive" role="alert">
                    Comment is too long. Max 1000 characters.
                </p>
            )}
        </form>
    )
}
