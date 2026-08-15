'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import CommentInput, { type CommentResult } from './CommentInput'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle } from 'lucide-react'

// ─── Props ──────────────────────────────────────────────────────────────────

interface PostDetailCommentsProps
{
    postId: string
    initialComments: CommentResult[]
    commentCount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string
{
    try
    {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch
    {
        return ''
    }
}

function getInitials(name: string): string
{
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PostDetailComments({
    postId,
    initialComments,
    commentCount,
}: PostDetailCommentsProps)
{
    const [comments, setComments] = useState<CommentResult[]>(initialComments)
    const [count, setCount] = useState(commentCount)

    function handleCommentAdded(comment: CommentResult)
    {
        setComments((prev) =>
        {
            // Avoid duplicates
            if (prev.some((c) => c.id === comment.id)) return prev
            // Prepend newest first
            return [comment, ...prev]
        })
        setCount((c) => c + 1)
    }

    return (
        <section className="space-y-4" aria-label="Comments">
            {/* Header */}
            <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">
                    {count === 1 ? '1 Comment' : `${count} Comments`}
                </h2>
            </div>

            {/* Comment input */}
            <CommentInput postId={postId} onCommentAdded={handleCommentAdded} />

            {/* Comment list */}
            {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                    No comments yet. Be the first to comment!
                </p>
            ) : (
                <ul className="space-y-3" aria-label="Comment list">
                    {comments.map((comment) =>
                    {
                        const initials = getInitials(comment.author.display_name || comment.author.username)
                        return (
                            <li
                                key={comment.id}
                                className="flex gap-3"
                                aria-label={`Comment by ${comment.author.display_name}`}
                            >
                                {/* Avatar */}
                                <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                                    <AvatarImage
                                        src={comment.author.avatar_url ?? undefined}
                                        alt={comment.author.display_name}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Bubble */}
                                <div className="flex-1 min-w-0">
                                    <div className="bento-card noise-bg px-3 py-2 space-y-0.5">
                                        <div className="flex items-baseline gap-1.5 flex-wrap">
                                            <span className="text-sm font-semibold leading-tight truncate">
                                                {comment.author.display_name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                @{comment.author.username}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed break-words">
                                            {comment.body}
                                        </p>
                                    </div>
                                    <time
                                        dateTime={comment.created_at}
                                        className="text-xs text-muted-foreground mt-0.5 pl-1 block"
                                    >
                                        {timeAgo(comment.created_at)}
                                    </time>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
