import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BadgeCheck, Radio } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getLiveStream } from '@/lib/modushive/queries'
import { isMuxConfigured, signPlayback } from '@/lib/modushive/mux'
import MuxVideoPlayer from '@/components/app/modushive/MuxVideoPlayer'
import LiveStreamLayout from '@/components/app/modushive/LiveStreamLayout'
import { ProcessingRefresher } from '@/components/app/modushive/VideoActions'

export const dynamic = 'force-dynamic'

export default async function LiveStreamPage({ params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    const [{ profile }, stream] = await Promise.all([getCurrentUser(), getLiveStream(id)])
    if (!stream) notFound()

    const isLive = stream.status === 'live' && Boolean(stream.playback_id)
    const tokens = isLive && stream.provider === 'mux' && stream.playback_id ? await signPlayback(stream.playback_id, stream.playback_policy) : undefined
    const host = stream.host

    return (
        <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 space-y-3 sm:space-y-4">
            {/* Pick up going live, or the replay arriving, without a manual reload.
                Never while playing — a refresh would re-sign tokens and reload the player. */}
            <ProcessingRefresher active={stream.status === 'idle' || (stream.status === 'ended' && !stream.replay_video_id)} intervalMs={10000} />

            <LiveStreamLayout
                backLink={
                    <Link href="/app/modushive" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Livestream
                    </Link>
                }
                videoSlot={
                    isLive ? (
                        stream.provider === 'cloudflare' ? (
                            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
                                <iframe
                                    src={`https://iframe.videodelivery.net/${stream.playback_id}?autoplay=true`}
                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                    allowFullScreen
                                    className="h-full w-full border-0"
                                />
                            </div>
                        ) : (
                            <MuxVideoPlayer live playbackId={stream.playback_id!} tokens={tokens} title={stream.title} videoId={stream.id} viewerId={profile?.id} />
                        )
                    ) : (
                        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted px-6 text-center">
                            <Radio className="h-7 w-7 text-muted-foreground" />
                            {stream.status === 'ended' ? (
                                <>
                                    <p className="text-sm font-semibold text-foreground">This stream has ended</p>
                                    {stream.replay_video_id
                                        ? <Link href={`/app/modushive/${stream.replay_video_id}`} className="text-sm font-semibold text-primary hover:underline">Watch the replay</Link>
                                        : <p className="text-xs text-muted-foreground">The replay will be available shortly.</p>}
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-semibold text-foreground">Starting soon</p>
                                    <p className="text-xs text-muted-foreground">This page will update when the stream goes live.</p>
                                </>
                            )}
                        </div>
                    )
                }
                infoSlot={
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {stream.status === 'live' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    <Radio className="h-3 w-3" /> Live
                                </span>
                            )}
                            <h1 className="text-lg sm:text-xl font-bold text-foreground">{stream.title}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-1 ring-border">
                                <AvatarImage src={host?.avatar_url ?? undefined} />
                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                    {(host?.display_name ?? 'H').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                                {host?.display_name ?? 'HubNovo'}
                                {host?.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                            </p>
                        </div>
                        {stream.description && (
                            <p className="whitespace-pre-wrap rounded-2xl bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground">{stream.description}</p>
                        )}
                    </div>
                }
                chatChannelId={stream.status !== 'ended' ? stream.chat_channel_id : null}
                hostId={stream.host_id}
            />
        </div>
    )
}
