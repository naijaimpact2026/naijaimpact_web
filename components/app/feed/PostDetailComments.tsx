'use client'

import { useMemo, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import CommentInput, { type CommentResult } from './CommentInput'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, CornerDownRight, Lock } from 'lucide-react'
import
{
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteComment } from '@/lib/actions/posts'

// ─── Props ──────────────────────────────────────────────────────────────────

interface PostDetailCommentsProps
{
    postId: string
    initialComments: CommentResult[]
    commentCount: number
    currentUser?: {
        username: string
        display_name: string
        avatar_url: string | null
    } | null
    allowComments?: boolean
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
    currentUser?: {
        username: string
        display_name: string
        avatar_url: string | null
    } | null
    allowComments?: boolean
    onStartReply: (commentId: string) => void
    onCancelReply: () => void
    onReplyAdded: (comment: CommentResult) => void
    onReplyConfirmed?: (tempId: string, confirmed: CommentResult) => void
    onReplyFailed?: (tempId: string, restoredText: string) => void
    onDeleteComment: (commentId: string) => void
}

function CommentItem({
    postId,
    comment,
    replies,
    replyingToId,
    currentUser,
    allowComments = true,
    onStartReply,
    onCancelReply,
    onReplyAdded,
    onReplyConfirmed,
    onReplyFailed,
    onDeleteComment,
}: CommentItemProps)
{
    const initials = getInitials(comment.author.display_name || comment.author.username)
    const isReplying = replyingToId === comment.id
    const isOwnComment = !!(currentUser?.username && currentUser.username === comment.author.username)

    return (
        <li className="flex gap-3" aria-label={`Comment by ${comment.author.display_name}`}>
            <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                <AvatarImage src={comment.author.avatar_url ?? undefined} alt={comment.author.display_name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className={`bg-elevated rounded-xl px-3 py-2 space-y-0.5 transition-opacity duration-200 ${comment.isOptimistic ? 'opacity-85' : 'opacity-100'}`}>
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
                    {comment.isOptimistic ? (
                        <span className="text-xs text-muted-foreground/70 italic flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Posting…
                        </span>
                    ) : (
                        <time dateTime={comment.created_at} className="text-xs text-muted-foreground">
                            {timeAgo(comment.created_at)}
                        </time>
                    )}
                    {!comment.isOptimistic && (
                        <div className="flex items-center gap-3">
                            {allowComments && (
                                <button
                                    onClick={() => (isReplying ? onCancelReply() : onStartReply(comment.id))}
                                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Reply
                                </button>
                            )}
                            {isOwnComment && (
                                <button
                                    onClick={() => onDeleteComment(comment.id)}
                                    className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
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
                                        <div className={`bg-elevated rounded-xl px-3 py-1.5 space-y-0.5 transition-opacity duration-200 ${reply.isOptimistic ? 'opacity-85' : 'opacity-100'}`}>
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
                                        {reply.isOptimistic ? (
                                            <span className="text-[11px] text-muted-foreground/70 italic mt-0.5 pl-1 flex items-center gap-1">
                                                <span className="inline-block w-1 h-1 rounded-full bg-primary animate-pulse" />
                                                Posting…
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-3 mt-0.5 pl-1">
                                                <time dateTime={reply.created_at} className="text-[11px] text-muted-foreground">
                                                    {timeAgo(reply.created_at)}
                                                </time>
                                                {currentUser?.username && currentUser.username === reply.author.username && (
                                                    <button
                                                        onClick={() => onDeleteComment(reply.id)}
                                                        className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
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
                                currentUser={currentUser}
                                parentCommentId={comment.id}
                                replyingToName={comment.author.username}
                                placeholder={`Reply to @${comment.author.username}…`}
                                autoFocus
                                compact
                                onCancel={onCancelReply}
                                onCommentAdded={onReplyAdded}
                                onCommentConfirmed={onReplyConfirmed}
                                onCommentFailed={onReplyFailed}
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
    currentUser,
    allowComments = true,
}: PostDetailCommentsProps)
{
    const [comments, setComments] = useState<CommentResult[]>(initialComments)
    const [count, setCount] = useState(commentCount)
    const [replyingToId, setReplyingToId] = useState<string | null>(null)
    const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null)
    const [isDeletingComment, setIsDeletingComment] = useState(false)

    async function handleConfirmDelete()
    {
        if (!commentToDeleteId || isDeletingComment) return
        const targetId = commentToDeleteId
        setCommentToDeleteId(null)
        setIsDeletingComment(true)

        // 1. Optimistic removal
        const previousComments = [...comments]
        const previousCount = count

        const removedCount = previousComments.filter(
            (c) => c.id === targetId || c.parent_comment_id === targetId
        ).length

        setComments((prev) => prev.filter((c) => c.id !== targetId && c.parent_comment_id !== targetId))
        setCount((c) => Math.max(0, c - (removedCount || 1)))

        // 2. Background server execution
        try
        {
            await deleteComment(targetId)
            const { toast } = await import('sonner')
            toast.success('Comment deleted')
        }
        catch (err)
        {
            console.error('Failed to delete comment:', err)
            // 3. Rollback on failure
            setComments(previousComments)
            setCount(previousCount)
            const { toast } = await import('sonner')
            toast.error('Could not delete comment. Please try again.')
        }
        finally
        {
            setIsDeletingComment(false)
        }
    }

    function handleCommentAdded(comment: CommentResult)
    {
        setComments((prev) => [comment, ...prev])
        setCount((c) => c + 1)
    }

    function handleCommentConfirmed(tempId: string, confirmed: CommentResult)
    {
        setComments((prev) =>
            prev.map((c) => (c.id === tempId ? confirmed : c))
        )
    }

    function handleCommentFailed(tempId: string)
    {
        setComments((prev) => prev.filter((c) => c.id !== tempId))
        setCount((c) => Math.max(0, c - 1))
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

            {/* Comment input or locked banner */}
            {allowComments === false ? (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-muted/60 border border-border/80 text-muted-foreground text-sm">
                    <Lock className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span>Comments have been turned off for this post.</span>
                </div>
            ) : (
                <CommentInput
                    postId={postId}
                    currentUser={currentUser}
                    onCommentAdded={handleCommentAdded}
                    onCommentConfirmed={handleCommentConfirmed}
                    onCommentFailed={handleCommentFailed}
                />
            )}

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
                            currentUser={currentUser}
                            allowComments={allowComments}
                            onStartReply={setReplyingToId}
                            onCancelReply={() => setReplyingToId(null)}
                            onReplyAdded={handleCommentAdded}
                            onReplyConfirmed={handleCommentConfirmed}
                            onReplyFailed={handleCommentFailed}
                            onDeleteComment={setCommentToDeleteId}
                        />
                    ))}
                </ul>
            )}

            {/* Delete comment confirmation modal */}
            <AlertDialog open={!!commentToDeleteId} onOpenChange={(open) => !open && setCommentToDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this comment? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingComment}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleConfirmDelete() }}
                            disabled={isDeletingComment}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingComment ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    )
}
