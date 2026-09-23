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
    } from 'lucide-react'
import MediaDisplay from './MediaDisplay'
import type { PostWithAuthor } from '@/lib/types'
import { toggleReaction } from '@/lib/actions/posts'

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
    onHide?: (postId: string) => void
}

export default function PostCard({ post, currentUserId, onReactionToggle, onHide }: PostCardProps)
{
    const router = useRouter()
    const [reacted, setReacted] = useState(post.user_reacted)
    const [reactionCount, setReactionCount] = useState(post.reaction_count)
    const [isLiking, setIsLiking] = useState(false)
    const [isUnliking, setIsUnliking] = useState(false)
    const [saved, setSaved] = useState(post.user_saved)
    const [savePending, setSavePending] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [following, setFollowing] = useState(post.is_following_author ?? false)
    const [followPending, setFollowPending] = useState(false)
    const [blockDialogOpen, setBlockDialogOpen] = useState(false)
    const [blocking, setBlocking] = useState(false)

    useEffect(() =>
    {
        setReacted(post.user_reacted)
        setReactionCount(post.reaction_count)
    }, [post.user_reacted, post.reaction_count])

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
        if (savePending) return
        setSavePending(true)

        const newSaved = !saved
        setSaved(newSaved)

        try
        {
            const { toggleSavePost } = await import('@/lib/actions/posts')
            const result = await toggleSavePost(post.id)
            setSaved(result.saved)
        }
        catch
        {
            setSaved(!newSaved)
            const { toast } = await import('sonner')
            toast.error(newSaved ? 'Could not save post' : 'Could not unsave post')
        }
        finally
        {
            setSavePending(false)
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
        const url = `${window.location.origin}/app/feed/${post.id}`
        const { toast } = await import('sonner')
        const ok = await copyToClipboard(url)
        if (ok) toast.success('Link copied to clipboard')
        else toast.error('Could not copy link')
    }

    async function handleShare()
    {
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
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <Link href={`/app/profile/${author.username}`} className="shrink-0">
                    <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={author.avatar_url ?? undefined} alt={author.display_name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                            {authorInitials}
                        </AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                        <Link href={`/app/profile/${author.username}`}
                            className="font-semibold text-sm hover:underline truncate text-foreground">
                            {author.display_name}
                        </Link>
                        {author.verified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
                        className="shrink-0 rounded-full gap-1.5 px-3"
                    >
                        {following ? (
                            <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Following
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-3.5 w-3.5" />
                                Follow
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
                        {currentUserId !== author.id && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setBlockDialogOpen(true)}
                                >
                                    <UserX className="h-4 w-4 mr-2" /> Block @{author.username}
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

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
            <div className="flex items-center justify-around px-2 py-1">
                {/* Like / Unlike */}
                <button
                    type="button"
                    onClick={handleReaction}
                    aria-label={reacted ? 'Remove like' : 'Like'}
                    aria-pressed={reacted}
                    className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 group hover:bg-muted ${
                        reacted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <span className="relative flex items-center justify-center">
                        <ThumbsUp
                            className={`h-4 w-4 transition-all duration-200 ${
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
                            className={`absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground transition-all duration-200 ${
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
                    aria-label="Comment"
                    className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <span className="relative">
                        <MessageCircle className="h-4 w-4" />
                        {comment_count > 0 && (
                            <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                                {comment_count > 99 ? '99+' : comment_count}
                            </span>
                        )}
                    </span>
                    <span>Comment</span>
                </button>

                {/* Share */}
                <button
                    onClick={handleShare}
                    aria-label="Share"
                    className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                </button>

                {/* Save */}
                <button
                    onClick={handleSaveToggle}
                    disabled={savePending}
                    aria-label={saved ? 'Unsave' : 'Save'}
                    aria-pressed={saved}
                    className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium transition-colors hover:bg-muted ${saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Bookmark className={`h-4 w-4 ${saved ? 'fill-primary' : ''}`} />
                    <span>Save</span>
                </button>
            </div>
        </article>
    )
}
