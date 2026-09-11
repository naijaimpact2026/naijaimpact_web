'use client'

import { useMemo, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import CommentInput, { type CommentResult } from './CommentInput'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, CornerDownRight } from 'lucide-react'

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

// ─── Single comment (and its replies) ──────────────────────────────────────────

interface CommentItemProps
{
    postId: string
    comment: CommentResult
    replies: CommentResult[]
    replyingToId: string | null
    onStartReply: (commentId: string) => void
    onCancelReply: () => void
    onReplyAdded: (comment: CommentResult) => void
}

function CommentItem({
    postId,
    comment,
    replies,
    replyingToId,
    onStartReply,
    onCancelReply,
    onReplyAdded,
}: CommentItemProps)
{
    const initials = getInitials(comment.author.display_name || comment.author.username)
    const isReplying = replyingToId === comment.id

    return (
        <li className="flex gap-3" aria-label={`Comment by ${comment.author.display_name}`}>
            <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                <AvatarImage src={comment.author.avatar_url ?? undefined} alt={comment.author.display_name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="bg-elevated rounded-xl px-3 py-2 space-y-0.5">
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

                <div className="flex items-center gap-3 mt-0.5 pl-1">
                    <time dateTime={comment.created_at} className="text-xs text-muted-foreground">
                        {timeAgo(comment.created_at)}
                    </time>
                    <button
                        onClick={() => (isReplying ? onCancelReply() : onStartReply(comment.id))}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Reply
                    </button>
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                    <ul className="mt-3 space-y-3 border-l-2 border-border pl-3" aria-label="Replies">
                        {replies.map((reply) =>
                        {
                            const replyInitials = getInitials(reply.author.display_name || reply.author.username)
                            return (
                                <li key={reply.id} className="flex gap-2.5" aria-label={`Reply by ${reply.author.display_name}`}>
                                    <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                                        <AvatarImage src={reply.author.avatar_url ?? undefined} alt={reply.author.display_name} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                            {replyInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="bg-elevated rounded-xl px-3 py-1.5 space-y-0.5">
                                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                                <span className="text-xs font-semibold leading-tight truncate">
                                                    {reply.author.display_name}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    @{reply.author.username}
                                                </span>
                                            </div>
                                            <p className="text-xs leading-relaxed break-words">
                                                {reply.body}
                                            </p>
                                        </div>
                                        <time dateTime={reply.created_at} className="text-[11px] text-muted-foreground mt-0.5 pl-1 block">
                                            {timeAgo(reply.created_at)}
                                        </time>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}

                {/* Inline reply box */}
                {isReplying && (
                    <div className="mt-3 flex items-start gap-2 pl-1">
                        <CornerDownRight className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                        <div className="flex-1">
                            <CommentInput
                                postId={postId}
                                parentCommentId={comment.id}
                                replyingToName={comment.author.username}
                                placeholder={`Reply to @${comment.author.username}…`}
                                autoFocus
                                compact
                                onCancel={onCancelReply}
                                onCommentAdded={onReplyAdded}
                            />
                        </div>
                    </div>
                )}
            </div>
        </li>
    )
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
    const [replyingToId, setReplyingToId] = useState<string | null>(null)

    function handleCommentAdded(comment: CommentResult)
    {
        setComments((prev) =>
        {
            if (prev.some((c) => c.id === comment.id)) return prev
            return [comment, ...prev]
        })
        setCount((c) => c + 1)
    }

    const { topLevel, repliesByParent } = useMemo(() =>
    {
        const top: CommentResult[] = []
        const byParent = new Map<string, CommentResult[]>()

        for (const c of comments)
        {
            if (c.parent_comment_id)
            {
                const list = byParent.get(c.parent_comment_id) ?? []
                list.push(c)
                byParent.set(c.parent_comment_id, list)
            }
            else
            {
                top.push(c)
            }
        }

        // Replies read oldest-first within a thread
        for (const list of byParent.values()) list.reverse()

        return { topLevel: top, repliesByParent: byParent }
    }, [comments])

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
            {topLevel.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                    No comments yet. Be the first to comment!
                </p>
            ) : (
                <ul className="space-y-4" aria-label="Comment list">
                    {topLevel.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            postId={postId}
                            comment={comment}
                            replies={repliesByParent.get(comment.id) ?? []}
                            replyingToId={replyingToId}
                            onStartReply={setReplyingToId}
                            onCancelReply={() => setReplyingToId(null)}
                            onReplyAdded={handleCommentAdded}
                        />
                    ))}
                </ul>
            )}
        </section>
    )
}
