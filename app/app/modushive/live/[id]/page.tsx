import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BadgeCheck, Radio } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getLiveStream, getVideo } from '@/lib/modushive/queries'
import { isMuxConfigured, signPlayback } from '@/lib/modushive/mux'
import { presignDownload } from '@/lib/modushive/r2'
import { checkStreamTicketAccess, getViewerWalletBalance } from '@/lib/actions/creator-earnings'
import MuxVideoPlayer from '@/components/app/modushive/MuxVideoPlayer'
import LiveStreamLayout from '@/components/app/modushive/LiveStreamLayout'
import WorkshopTicketGate from '@/components/app/modushive/WorkshopTicketGate'
import PinnedProductOverlay from '@/components/app/modushive/PinnedProductOverlay'
import HostReplayAction from '@/components/app/modushive/HostReplayAction'
import { ProcessingRefresher } from '@/components/app/modushive/VideoActions'

export const dynamic = 'force-dynamic'

export default async function LiveStreamPage({ params }: { params: Promise<{ id: string }> })
{
    const { id } = await params
    const [{ profile }, stream, ticketAccess] = await Promise.all([
        getCurrentUser(),
        getLiveStream(id),
        checkStreamTicketAccess(id),
    ])
    if (!stream) notFound()

    const isLive = stream.status === 'live' && Boolean(stream.playback_id)
    const isLocked = ticketAccess.isPaid && !ticketAccess.hasAccess
    const tokens = !isLocked && isLive && stream.provider === 'mux' && stream.playback_id ? await signPlayback(stream.playback_id, stream.playback_policy) : undefined
    const host = stream.host
    const viewerWalletBalance = profile ? await getViewerWalletBalance() : 0

    // Fetch replay video if linked
    const replayVideo = stream.replay_video_id ? await getVideo(stream.replay_video_id).catch(() => null) : null
    const replayR2Url = replayVideo?.provider === 'r2' && replayVideo.source_r2_key ? await presignDownload(replayVideo.source_r2_key).catch(() => null) : null
    const replayMuxTokens = replayVideo && replayVideo.provider === 'mux' && replayVideo.playback_id ? await signPlayback(replayVideo.playback_id, replayVideo.playback_policy).catch(() => undefined) : undefined

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
                    isLocked ? (
                        <WorkshopTicketGate
                            liveStreamId={stream.id}
                            title={stream.title}
                            description={stream.description}
                            ticketPrice={ticketAccess.ticketPrice}
                            workshopTopics={ticketAccess.workshopTopics}
                            creatorName={host?.display_name ?? 'Creator'}
                            creatorAvatar={host?.avatar_url ?? undefined}
                            isLive={isLive}
                            viewerLoggedIn={Boolean(profile)}
                            viewerWalletBalance={viewerWalletBalance}
                        />
                    ) : isLive ? (
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
                    ) : stream.status === 'ended' && replayVideo && replayVideo.status === 'ready' ? (
                        replayVideo.provider === 'cloudflare' ? (
                            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
                                <iframe
                                    src={`https://iframe.videodelivery.net/${replayVideo.playback_id}?autoplay=false`}
                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                    allowFullScreen
                                    className="h-full w-full border-0"
                                />
                            </div>
                        ) : replayVideo.provider === 'mux' ? (
                            <MuxVideoPlayer playbackId={replayVideo.playback_id!} tokens={replayMuxTokens} title={stream.title} videoId={replayVideo.id} viewerId={profile?.id} />
                        ) : replayR2Url ? (
                            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
                                <video src={replayR2Url} controls playsInline className="h-full w-full" />
                            </div>
                        ) : null
                    ) : (
                        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted px-6 text-center">
                            <Radio className="h-7 w-7 text-muted-foreground" />
                            {stream.status === 'ended' ? (
                                <>
                                    <p className="text-sm font-semibold text-foreground">This stream has ended</p>
                                    <p className="text-xs text-muted-foreground">The replay recording will be available shortly.</p>
                                    {ticketAccess.isHost && (
                                        <div className="mt-2">
                                            <HostReplayAction stream={stream} />
                                        </div>
                                    )}
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
                            {ticketAccess.isPaid && (
                                ticketAccess.isHost ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                        👑 Workshop Host • ₦{ticketAccess.ticketPrice.toLocaleString('en-NG')}
                                    </span>
                                ) : ticketAccess.ticket ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        ✓ Verified Workshop Pass
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                        🎟️ Ticket Required • ₦{ticketAccess.ticketPrice.toLocaleString('en-NG')}
                                    </span>
                                )
                            )}
                            {stream.pinned_product_data && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    🛍️ Live Product: {stream.pinned_product_data.title}
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
                chatChannelId={!isLocked && stream.status !== 'ended' ? stream.chat_channel_id : null}
                hostId={stream.host_id}
                creatorName={host?.display_name ?? 'Creator'}
                creatorAvatar={host?.avatar_url ?? undefined}
                liveStreamId={stream.id}
                pinnedProductOverlay={
                    !isLocked && stream.pinned_product_data ? (
                        <PinnedProductOverlay
                            liveStreamId={stream.id}
                            product={stream.pinned_product_data}
                            viewerLoggedIn={Boolean(profile)}
                        />
                    ) : null
                }
            />
        </div>
    )
}
