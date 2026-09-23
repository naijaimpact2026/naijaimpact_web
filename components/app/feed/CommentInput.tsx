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
    isOptimistic?: boolean
}

interface CommentInputProps
{
    postId: string
    onCommentAdded: (comment: CommentResult) => void
    onCommentConfirmed?: (tempId: string, confirmed: CommentResult) => void
    onCommentFailed?: (tempId: string, restoredText: string) => void
    currentUser?: {
        username: string
        display_name: string
        avatar_url: string | null
    } | null
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
    onCommentConfirmed,
    onCommentFailed,
    currentUser,
    parentCommentId = null,
    placeholder,
    replyingToName,
    onCancel,
    autoFocus = false,
    compact = false,
}: CommentInputProps)
{
    const [body, setBody] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() =>
    {
        if (autoFocus) textareaRef.current?.focus()
    }, [autoFocus])

    const trimmed = body.trim()
    const isDisabled = !trimmed || trimmed.length > 1000
    const isOverLimit = trimmed.length > 1000

    async function handleSubmit(e: React.FormEvent)
    {
        e.preventDefault()
        const textToSubmit = body.trim()
        if (!textToSubmit || textToSubmit.length > 1000) return

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const optimisticComment: CommentResult = {
            id: tempId,
            body: textToSubmit,
            created_at: new Date().toISOString(),
            parent_comment_id: parentCommentId,
            author: {
                username: currentUser?.username ?? 'you',
                display_name: currentUser?.display_name ?? 'You',
                avatar_url: currentUser?.avatar_url ?? null,
            },
            isOptimistic: true,
        }

        // 1. Instantly display in UI (0ms loading delay)
        onCommentAdded(optimisticComment)
        setBody('')
        if (parentCommentId)
        {
            onCancel?.()
        }
        else
        {
            textareaRef.current?.focus()
        }

        // 2. Perform background server mutation
        try
        {
            const confirmed = await addComment(postId, textToSubmit, parentCommentId)
            onCommentConfirmed?.(tempId, confirmed)
        }
        catch (err)
        {
            console.error('addComment error:', err)
            // 3. Rollback on failure and restore text
            onCommentFailed?.(tempId, textToSubmit)
            if (!parentCommentId)
            {
                setBody(textToSubmit)
            }
            toast.error('Failed to post comment. Your message was restored.')
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
                        {parentCommentId ? 'Reply' : 'Comment'}
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
