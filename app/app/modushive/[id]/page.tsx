import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, BadgeCheck, Film, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getVideo } from '@/lib/modushive/queries'
import { isMuxConfigured, signPlayback } from '@/lib/modushive/mux'
import { presignDownload } from '@/lib/modushive/r2'
import { getCloudflareLiveInputVideos } from '@/lib/modushive/cloudflare'
import { normalizeRole } from '@/lib/modushive/config'
import MuxVideoPlayer from '@/components/app/modushive/MuxVideoPlayer'
import { DeleteVideoButton } from '@/components/app/modushive/VideoActions'
import AttachRecordingButton from '@/components/app/modushive/AttachRecordingButton'

export const dynamic = 'force-dynamic'

export default async function VideoPage({ params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    const [{ profile }, video] = await Promise.all([getCurrentUser(), getVideo(id)])
    if (!video) notFound()

    const isOwner = Boolean(profile && (profile.id === video.owner_id || normalizeRole(profile.role) === 'admin'))

    let cfPlaybackId = video.playback_id
    let isUnrecordedLiveReplay = false

    if (video.kind === 'live_replay' && video.provider === 'cloudflare' && !video.playback_id?.startsWith('http')) {
        const cfVideos = await getCloudflareLiveInputVideos(video.playback_id!).catch(() => [])
        if (cfVideos && cfVideos.length > 0 && cfVideos[0]?.uid) {
            cfPlaybackId = cfVideos[0].uid
        } else {
            isUnrecordedLiveReplay = true
        }
    }

    const isCloudflare = video.provider === 'cloudflare' && Boolean(cfPlaybackId) && !isUnrecordedLiveReplay && !cfPlaybackId?.startsWith('http')
    const isMux = video.provider === 'mux' && Boolean(video.playback_id) && isMuxConfigured()
    const isR2 = video.provider === 'r2' && Boolean(video.source_r2_key)
    const isSupabase = (video.provider === 'supabase' || video.playback_id?.startsWith('http')) && Boolean(video.playback_id)
    const r2Url = isR2 ? await presignDownload(video.source_r2_key!).catch(() => null) : null
    const directVideoUrl = isSupabase ? video.playback_id : r2Url

    const canPlay = video.status === 'ready' && (isCloudflare || isMux || Boolean(directVideoUrl))
    const tokens = isMux ? await signPlayback(video.playback_id!, video.playback_policy) : undefined
    const canDelete = isOwner
    const owner = video.owner

    return (
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
            <Link href="/app/modushive" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Livestream
            </Link>

            {canPlay ? (
                isCloudflare ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
                        <iframe
                            src={`https://iframe.videodelivery.net/${cfPlaybackId}?autoplay=false`}
                            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                            allowFullScreen
                            className="h-full w-full border-0"
                        />
                    </div>
                ) : isMux ? (
                    <MuxVideoPlayer playbackId={video.playback_id!} tokens={tokens} title={video.title} videoId={video.id} viewerId={profile?.id} />
                ) : directVideoUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
                        <video src={directVideoUrl} controls playsInline className="h-full w-full" />
                    </div>
                ) : null
            ) : isUnrecordedLiveReplay ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 flex flex-col items-center justify-center text-center shadow-lg">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                        <Film className="h-7 w-7" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                        Broadcast Replay Recording Pending
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground max-w-md leading-relaxed">
                        {isOwner
                            ? 'This live broadcast has ended. Upload your MP4 or WebM recording below so your audience can watch the replay anytime.'
                            : 'This live broadcast has ended. The host has not uploaded the recording yet. Please check back later!'}
                    </p>

                    {isOwner && (
                        <div className="mt-4">
                            <AttachRecordingButton videoId={video.id} videoTitle={video.title} />
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-muted text-center">
                    {video.status === 'errored'
                        ? <p className="text-sm font-semibold text-destructive">This video could not be processed.</p>
                        : <>
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">This video is still processing.</p>
                        </>}
                </div>
            )}

            <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="text-lg sm:text-xl font-bold text-foreground">{video.title}</h1>
                    <div className="flex items-center gap-2">
                        {isOwner && video.kind === 'live_replay' && canPlay && (
                            <AttachRecordingButton
                                videoId={video.id}
                                videoTitle={video.title}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                            />
                        )}
                        {canDelete && <DeleteVideoButton videoId={video.id} redirectTo="/app/modushive" />}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link href={owner?.username ? `/app/profile/${owner.username}` : '#'} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-1 ring-border">
                            <AvatarImage src={owner?.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                {(owner?.display_name ?? 'U').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                                {owner?.display_name ?? 'HubNovo member'}
                                {owner?.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {video.kind === 'live_replay' ? 'Streamed ' : 'Posted '}
                                {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </Link>
                </div>

                {video.description && (
                    <p className="whitespace-pre-wrap rounded-2xl bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground">{video.description}</p>
                )}
            </div>
        </div>
    )
}
