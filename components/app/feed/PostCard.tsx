'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import
    {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu'
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
import
    {
        ThumbsUp,
        MessageCircle,
        Share2,
        Bookmark,
        MoreHorizontal,
        BadgeCheck,
        Link2,
        UserPlus,
        UserCheck,
        UserX,
        Trash2,
        Lock,
    } from 'lucide-react'
import MediaDisplay from './MediaDisplay'
import type { PostWithAuthor } from '@/lib/types'
import { toggleReaction, toggleSavePost, deletePost } from '@/lib/actions/posts'

// ─── Caption parser ────────────────────────────────────────────────────────

function parseCaption(caption: string): React.ReactNode[]
{
    const parts = caption.split(/(#\w+|@\w+)/g)
    return parts.map((part, i) =>
    {
        if (part.startsWith('#'))
        {
            return (
                <Link key={i} href={`/app/search?q=${encodeURIComponent(part)}`}
                    className="text-primary hover:underline font-medium">
                    {part}
                </Link>
            )
        }
        if (part.startsWith('@'))
        {
            return (
                <Link key={i} href={`/app/profile/${part.slice(1)}`}
                    className="text-primary hover:underline font-medium">
                    {part}
                </Link>
            )
        }
        return <span key={i}>{part}</span>
    })
}

function timeAgo(dateStr: string): string
{
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

interface PostCardProps
{
    post: PostWithAuthor
    currentUserId: string
    onReactionToggle?: (postId: string, reacted: boolean, delta: number) => void
    onSaveToggle?: (postId: string, saved: boolean) => void
    onHide?: (postId: string) => void
}

export default function PostCard({ post, currentUserId, onReactionToggle, onSaveToggle, onHide }: PostCardProps)
{
    const router = useRouter()
    const [reacted, setReacted] = useState(post.user_reacted)
    const [reactionCount, setReactionCount] = useState(post.reaction_count)
    const [isLiking, setIsLiking] = useState(false)
    const [isUnliking, setIsUnliking] = useState(false)
    const [saved, setSaved] = useState(post.user_saved)
    const [isSaving, setIsSaving] = useState(false)
    const [isUnsaving, setIsUnsaving] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [following, setFollowing] = useState(post.is_following_author ?? false)
    const [followPending, setFollowPending] = useState(false)
    const [blockDialogOpen, setBlockDialogOpen] = useState(false)
    const [blocking, setBlocking] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() =>
    {
        setReacted(post.user_reacted)
        setReactionCount(post.reaction_count)
        setSaved(post.user_saved)
    }, [post.user_reacted, post.reaction_count, post.user_saved])

    const { author, medias, comment_count } = post
    const authorInitials = author.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    async function handleFollowToggle()
    {
        if (followPending) return
    
        setFollowPending(true)
    
        const newFollowing = !following
        setFollowing(newFollowing)
    
        try
        {
            const { followUser, unfollowUser } = await import('@/lib/actions/profile')
    
            const result = newFollowing
                ? await followUser(author.id)
                : await unfollowUser(author.id)
    
            if (!result.success)
            {
                setFollowing(!newFollowing)
            }
        }
        catch
        {
            setFollowing(!newFollowing)
        }
        finally
        {
            setFollowPending(false)
        }
    }    

    async function handleReaction()
    {
        const newReacted = !reacted
        const delta = newReacted ? 1 : -1

        // 1. Instant optimistic UI update
        setReacted(newReacted)
        setReactionCount((c) => Math.max(0, c + delta))
        if (newReacted)
        {
            setIsLiking(true)
            setTimeout(() => setIsLiking(false), 450)
        }
        else
        {
            setIsUnliking(true)
            setTimeout(() => setIsUnliking(false), 350)
        }
        onReactionToggle?.(post.id, newReacted, delta)

        // 2. Server mutation in the background (no blocking/loading state)
        try
        {
            await toggleReaction(post.id)
        } catch (err)
        {
            // 3. Rollback only if the server explicitly fails
            console.error('Failed to toggle reaction:', err)
            setReacted(!newReacted)
            setReactionCount((c) => Math.max(0, c - delta))
            onReactionToggle?.(post.id, !newReacted, -delta)
            const { toast } = await import('sonner')
            toast.error('Could not update like. Please try again.')
        }
    }

    async function handleSaveToggle()
    {
        const newSaved = !saved

        // 1. Instant optimistic UI update
        setSaved(newSaved)
        if (newSaved)
        {
            setIsSaving(true)
            setTimeout(() => setIsSaving(false), 450)
        }
        else
        {
            setIsUnsaving(true)
            setTimeout(() => setIsUnsaving(false), 350)
        }
        onSaveToggle?.(post.id, newSaved)

        // 2. Server mutation in the background (no blocking/loading state)
        try
        {
            await toggleSavePost(post.id)
        }
        catch (err)
        {
            // 3. Rollback only if server fails
            console.error('Failed to toggle save post:', err)
            setSaved(!newSaved)
            onSaveToggle?.(post.id, !newSaved)
            const { toast } = await import('sonner')
            toast.error(newSaved ? 'Could not save post. Please try again.' : 'Could not unsave post. Please try again.')
        }
    }

    async function handleBlock()
    {
        if (blocking) return
        setBlocking(true)

        try
        {
            const { blockUser } = await import('@/lib/actions/profile')
            const result = await blockUser(author.id)

            if (result.success)
            {
                setBlockDialogOpen(false)
                onHide?.(post.id)
                router.refresh()
            }
        }
        finally
        {
            setBlocking(false)
        }
    }

    async function handleDelete()
    {
        if (deleting) return
        setDeleting(true)

        try
        {
            await deletePost(post.id)
            setDeleteDialogOpen(false)
            onHide?.(post.id)
            const { toast } = await import('sonner')
            toast.success('Post deleted')

            if (typeof window !== 'undefined' && window.location.pathname.includes(`/app/feed/${post.id}`))
            {
                router.push('/app/feed')
            }
        }
        catch (err)
        {
            console.error('Failed to delete post:', err)
            const { toast } = await import('sonner')
            toast.error('Could not delete post. Please try again.')
        }
        finally
        {
            setDeleting(false)
        }
    }

    async function copyToClipboard(text: string): Promise<boolean>
    {
        try
        {
            if (navigator.clipboard?.writeText)
            {
                await navigator.clipboard.writeText(text)
                return true
            }
        }
        catch { /* fall through to legacy fallback below */ }

        // Fallback for browsers/contexts without the async Clipboard API
        // (e.g. non-HTTPS, older Safari)
        try
        {
            const textarea = document.createElement('textarea')
            textarea.value = text
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.select()
            const ok = document.execCommand('copy')
            document.body.removeChild(textarea)
            return ok
        }
        catch
        {
            return false
        }
    }

    async function handleCopyLink()
    {
        if (post.allow_sharing === false)
        {
            const { toast } = await import('sonner')
            toast.error('Sharing has been disabled for this post by the author')
            return
        }
        const url = `${window.location.origin}/app/feed/${post.id}`
        const { toast } = await import('sonner')
        const ok = await copyToClipboard(url)
        if (ok) toast.success('Link copied to clipboard')
        else toast.error('Could not copy link')
    }

    async function handleShare()
    {
        if (post.allow_sharing === false)
        {
            const { toast } = await import('sonner')
            toast.error('Sharing has been disabled for this post by the author')
            return
        }
        const url = `${window.location.origin}/app/feed/${post.id}`

        if (navigator.share)
        {
            try
            {
                await navigator.share({ title: 'HubNovo post', url })
            }
            catch
            {
                /* user cancelled the share sheet — not an error */
            }
            return
        }

        await handleCopyLink()
    }

    const captionText = post.caption ?? ''
    const captionNodes = parseCaption(captionText)

    return (
        <article className="bg-card rounded-2xl border border-border shadow-sm dark:shadow-none overflow-hidden">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 pt-3.5 sm:pt-4 pb-2">
                <Link href={`/app/profile/${author.username}`} className="shrink-0">
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-border">
                        <AvatarImage src={author.avatar_url ?? undefined} alt={author.display_name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm font-bold">
                            {authorInitials}
                        </AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                        <Link href={`/app/profile/${author.username}`}
                            className="font-semibold text-xs sm:text-sm hover:underline truncate text-foreground">
                            {author.display_name}
                        </Link>
                        {author.verified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
                        <span>@{author.username}</span>
                        <span>·</span>
                        <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
                    </div>
                </div>

                {/* FOLLOW BUTTON */}
                {currentUserId !== author.id && (
                    <Button
                        variant={following ? 'outline' : 'default'}
                        size="sm"
                        onClick={handleFollowToggle}
                        disabled={followPending}
                        className="shrink-0 rounded-full gap-1 sm:gap-1.5 px-2.5 sm:px-3 text-xs h-7 sm:h-8"
                    >
                        {following ? (
                            <>
                                <UserCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="hidden xs:inline">Following</span>
                                <span className="xs:hidden">✓</span>
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span>Follow</span>
                            </>
                        )}
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Post options</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={6} className="w-48">
                        <DropdownMenuItem onClick={handleCopyLink}>
                            <Link2 className="h-4 w-4 mr-2" /> Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/app/feed/${post.id}`)}>
                            <MessageCircle className="h-4 w-4 mr-2" /> View post
                        </DropdownMenuItem>
                        {currentUserId !== author.id ? (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setBlockDialogOpen(true)}
                                >
                                    <UserX className="h-4 w-4 mr-2" /> Block @{author.username}
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete post
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this post and all its interactions. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete() }}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Block @{author.username}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You won&apos;t see posts or comments from {author.display_name} anymore, and they won&apos;t
                            be able to follow you. You can unblock them later from Settings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={blocking}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleBlock() }}
                            disabled={blocking}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {blocking ? 'Blocking…' : 'Block'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Caption ─────────────────────────────────────────────────────── */}
            {captionText.length > 0 && (
                <div className="px-4 pb-2 text-sm leading-relaxed text-foreground">
                    <p className={!expanded ? 'line-clamp-4' : undefined}>
                        {captionNodes}
                    </p>
                    {captionText.length > 200 && (
                        <button onClick={() => setExpanded((v) => !v)}
                            className="text-primary text-xs mt-0.5 font-medium hover:underline">
                            {expanded ? 'See less' : 'See more'}
                        </button>
                    )}
                </div>
            )}

            {/* ── Media ───────────────────────────────────────────────────────── */}
            {medias && medias.length > 0 && (
                <div className="mt-1">
                    <MediaDisplay medias={medias} caption={post.caption} />
                </div>
            )}

            {/* Divider */}
            <div className="h-px bg-border mx-4" />

            {/* ── Action bar — counts shown as badges on their icon ─────────────── */}
            <div className="flex items-center justify-around px-1 sm:px-2 py-1">
                {/* Like / Unlike */}
                <button
                    type="button"
                    onClick={handleReaction}
                    aria-label={reacted ? 'Remove like' : 'Like'}
                    aria-pressed={reacted}
                    className={`flex items-center gap-1 sm:gap-1.5 flex-1 justify-center py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 group hover:bg-muted ${
                        reacted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <span className="relative flex items-center justify-center">
                        <ThumbsUp
                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-200 ${
                                reacted
                                    ? 'fill-primary stroke-primary'
                                    : 'stroke-current fill-transparent'
                            } ${
                                isLiking
                                    ? 'scale-125 -rotate-12'
                                    : isUnliking
                                    ? 'scale-90 rotate-6 text-muted-foreground'
                                    : 'group-hover:scale-110'
                            }`}
                        />
                        <span
                            className={`absolute -top-2 -right-2.5 flex h-3.5 min-w-3.5 sm:h-4 sm:min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[8px] sm:text-[9px] font-bold leading-none text-primary-foreground transition-all duration-200 ${
                                reactionCount > 0 ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
                            } ${isLiking ? 'scale-110' : ''}`}
                        >
                            {reactionCount > 99 ? '99+' : reactionCount}
                        </span>
                    </span>
                    <span className={`transition-colors duration-200 ${reacted ? 'font-semibold text-primary' : ''}`}>
                        {reacted ? 'Liked' : 'Like'}
                    </span>
                </button>

                {/* Comment */}
                <button
                    onClick={() => router.push(`/app/feed/${post.id}`)}
                    aria-label={post.allow_comments === false ? 'Comments are disabled' : 'Comment'}
                    title={post.allow_comments === false ? 'Comments are disabled for this post' : 'Comment'}
                    className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-center py-2 rounded-xl text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <span className="relative flex items-center">
                        {post.allow_comments === false ? (
                            <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/70" />
                        ) : (
                            <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                        {post.allow_comments !== false && comment_count > 0 && (
                            <span className="absolute -top-2 -right-2.5 flex h-3.5 min-w-3.5 sm:h-4 sm:min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[8px] sm:text-[9px] font-bold leading-none text-primary-foreground">
                                {comment_count > 99 ? '99+' : comment_count}
                            </span>
                        )}
                    </span>
                    <span>{post.allow_comments === false ? 'Off' : 'Comment'}</span>
                </button>

                {/* Share */}
                <button
                    onClick={handleShare}
                    aria-label={post.allow_sharing === false ? 'Sharing disabled' : 'Share'}
                    title={post.allow_sharing === false ? 'Sharing is disabled for this post' : 'Share'}
                    className={`flex items-center gap-1 sm:gap-1.5 flex-1 justify-center py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                        post.allow_sharing === false
                            ? 'text-muted-foreground/60 hover:text-muted-foreground cursor-not-allowed'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                    <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Share</span>
                </button>

                {/* Save / Unsave */}
                <button
                    type="button"
                    onClick={handleSaveToggle}
                    aria-label={saved ? 'Unsave post' : 'Save post'}
                    aria-pressed={saved}
                    className={`flex items-center gap-1 sm:gap-1.5 flex-1 justify-center py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 group hover:bg-muted ${
                        saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <span className="relative flex items-center justify-center">
                        <Bookmark
                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-200 ${
                                saved
                                    ? 'fill-primary stroke-primary'
                                    : 'stroke-current fill-transparent'
                            } ${
                                isSaving
                                    ? 'scale-125 -rotate-6'
                                    : isUnsaving
                                    ? 'scale-90 rotate-6 text-muted-foreground'
                                    : 'group-hover:scale-110'
                            }`}
                        />
                    </span>
                    <span className={`transition-colors duration-200 ${saved ? 'font-semibold text-primary' : ''}`}>
                        {saved ? 'Saved' : 'Save'}
                    </span>
                </button>
            </div>
        </article>
    )
}
