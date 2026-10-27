import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { BadgeCheck, Clapperboard, Radio } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDuration } from '@/lib/modushive/config'
import type { LiveStreamWithHost, VideoOwner, VideoWithOwner } from '@/lib/types'

/**
 * Listing cards. Static thumbnails only — never an autoplaying preview —
 * so browsing the grid costs no Mux delivery minutes.
 */

function initials(name: string | null | undefined)
{
    return (name ?? 'U').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

function Thumbnail({ src, alt }: { src: string | null; alt: string })
{
    if (!src)
    {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Clapperboard className="w-8 h-8 text-muted-foreground/40" strokeWidth={1.5} />
            </div>
        )
    }
    // Signed URLs carry a per-request token, so skip the optimizer cache.
    return <Image src={src} alt={alt} fill unoptimized sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
}

function Byline({ person, at }: { person: VideoOwner | null; at: string })
{
    return (
        <div className="flex items-start gap-2.5 mt-3">
            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
                <AvatarImage src={person?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">{initials(person?.display_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground truncate">
                    {person?.display_name ?? 'HubNovo member'}
                    {person?.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                </p>
                <p className="text-[11px] text-muted-foreground/80">{formatDistanceToNow(new Date(at), { addSuffix: true })}</p>
            </div>
        </div>
    )
}

export function VideoCard({ video }: { video: VideoWithOwner })
{
    return (
        <Link href={`/app/modushive/${video.id}`} className="group block">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
                <Thumbnail src={video.thumbnail_url} alt={video.title} />
                {video.kind === 'live_replay' && (
                    <span className="absolute top-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Replay</span>
                )}
                <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                    {formatDuration(video.duration_s)}
                </span>
            </div>
            <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">{video.title}</h3>
            <Byline person={video.owner} at={video.created_at} />
        </Link>
    )
}

export function LiveCard({ stream }: { stream: LiveStreamWithHost })
{
    return (
        <Link href={`/app/modushive/live/${stream.id}`} className="group block">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-destructive/40 bg-muted">
                <Thumbnail src={stream.thumbnail_url} alt={stream.title} />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        <Radio className="w-3 h-3" /> Live
                    </span>
                    {stream.is_paid && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/95 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                            🎟️ ₦{Number(stream.ticket_price).toLocaleString('en-NG')}
                        </span>
                    )}
                </div>
            </div>
            <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">{stream.title}</h3>
            <Byline person={stream.host} at={stream.started_at ?? stream.created_at} />
        </Link>
    )
}
