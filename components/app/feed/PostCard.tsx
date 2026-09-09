'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import
    {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu'
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
    } from 'lucide-react'
import MediaDisplay from './MediaDisplay'
import type { PostWithAuthor } from '@/lib/types'

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
}

export default function PostCard({ post, currentUserId, onReactionToggle }: PostCardProps)
{
    const router = useRouter()
    const [reacted, setReacted] = useState(post.user_reacted)
    const [reactionCount, setReactionCount] = useState(post.reaction_count)
    const [reactionPending, setReactionPending] = useState(false)
    const [saved, setSaved] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [following, setFollowing] = useState(false)
    const [followPending, setFollowPending] = useState(false)

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
        if (reactionPending) return
        const newReacted = !reacted
        const delta = newReacted ? 1 : -1
        setReacted(newReacted)
        setReactionCount((c) => c + delta)
        setReactionPending(true)
        onReactionToggle?.(post.id, newReacted, delta)
        try
        {
            const { toggleReaction } = await import('@/lib/actions/posts')
            await toggleReaction(post.id)
        } catch
        {
            setReacted(!newReacted)
            setReactionCount((c) => c - delta)
            onReactionToggle?.(post.id, !newReacted, -delta)
        } finally
        {
            setReactionPending(false)
        }
    }

    async function handleShare()
    {
        const url = `${window.location.origin}/app/feed/${post.id}`
        if (navigator.share)
        {
            try { await navigator.share({ title: 'Hubnovo post', url }) } catch { /* cancelled */ }
        } else
        {
            await navigator.clipboard.writeText(url)
        }
    }

    const captionText = post.caption ?? ''
    const captionNodes = parseCaption(captionText)

    return (
        <article className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden">
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
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleShare}>
                            <Link2 className="h-4 w-4 mr-2" /> Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/app/feed/${post.id}`)}>
                            <MessageCircle className="h-4 w-4 mr-2" /> View post
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

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

            {/* ── Reaction counts ─────────────────────────────────────────────── */}
            {(reactionCount > 0 || comment_count > 0) && (
                <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
                    {reactionCount > 0 && (
                        <div className="flex items-center gap-1">
                            {/* Emoji reaction pills */}
                            <span className="flex items-center">
                                <span className="text-sm">❤️</span>
                                {reactionCount > 1 && <span className="text-sm ml-0.5">😊</span>}
                                {reactionCount > 2 && <span className="text-sm ml-0.5">👍</span>}
                            </span>
                            <span className="ml-1">{reactionCount}</span>
                        </div>
                    )}
                    {comment_count > 0 && (
                        <button onClick={() => router.push(`/app/feed/${post.id}`)}
                            className="hover:underline ml-auto">
                            {comment_count} Comment{comment_count !== 1 ? 's' : ''}
                        </button>
                    )}
                </div>
            )}

            {/* Divider */}
            <div className="h-px bg-border mx-4" />

            {/* ── Action bar ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-around px-2 py-1">
                {/* Like */}
                <button
                    onClick={handleReaction}
                    disabled={reactionPending}
                    aria-label={reacted ? 'Remove like' : 'Like'}
                    aria-pressed={reacted}
                    className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium transition-colors hover:bg-muted ${reacted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <ThumbsUp className={`h-4 w-4 ${reacted ? 'fill-primary' : ''}`} />
                    <span>Like</span>
                </button>

                {/* Comment */}
                <button
                    onClick={() => router.push(`/app/feed/${post.id}`)}
                    aria-label="Comment"
                    className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <MessageCircle className="h-4 w-4" />
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
                    onClick={() => setSaved((s) => !s)}
                    aria-label={saved ? 'Unsave' : 'Save'}
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
