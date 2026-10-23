import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Clapperboard, Coins, ExternalLink, Play } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { canGoLive, getLiveLimits, normalizeRole } from '@/lib/modushive/config'
import { isCloudflareStreamConfigured } from '@/lib/modushive/cloudflare'
import { isMuxConfigured } from '@/lib/modushive/mux'
import { listStudioStreams } from '@/lib/modushive/queries'
import { BrowserStudio } from '@/components/app/modushive/BrowserStudio'
import { EndStreamButton, GoLiveForm } from '@/components/app/modushive/StudioControls'
import { ProcessingRefresher } from '@/components/app/modushive/VideoActions'
import type { LiveStream } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Studio — Livestream' }

const STATUS_STYLES: Record<LiveStream['status'], string> = {
    idle: 'bg-muted text-muted-foreground',
    live: 'bg-destructive text-white',
    ended: 'bg-muted text-muted-foreground',
}

const STATUS_LABELS: Record<LiveStream['status'], string> = {
    idle: 'Waiting for signal',
    live: 'Live',
    ended: 'Ended',
}

export default async function StudioPage()
{
    const { profile } = await getCurrentUser()
    if (!profile || !canGoLive(profile.role)) redirect('/app/modushive')

    // Admins oversee every stream; everyone else sees only their own.
    const isAdmin = normalizeRole(profile.role) === 'admin'
    const streams = await listStudioStreams(isAdmin ? undefined : profile.id)
    const activeStream = streams.find((s) => s.host_id === profile.id && s.status !== 'ended')
    const maxHours = getLiveLimits(profile.role).maxDurationS / 3600
    // Keep polling while a stream is waiting/live, or just ended and its replay isn't in yet.
    const recentlyEnded = (endedAt: string | null) => !!endedAt && Date.now() - new Date(endedAt).getTime() < 15 * 60_000
    const watching = streams.some((s) => s.status !== 'ended' || (!s.replay_video_id && recentlyEnded(s.ended_at)))
    const isConfigured = isCloudflareStreamConfigured() || isMuxConfigured()

    return (
        <div className={`w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 ${activeStream ? 'max-w-[1440px]' : 'max-w-3xl'}`}>
            <ProcessingRefresher active={watching} intervalMs={10000} />

            {/* Studio Navigation & Breadcrumbs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Link
                        href="/app/modushive"
                        className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Livestream
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-foreground">Live Studio</span>
                    {activeStream && (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive border border-destructive/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Broadcast Ready
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Link
                        href="/app/modushive/earnings"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1 font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                    >
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        Earnings Hub
                    </Link>
                    <span className="hidden sm:inline">
                        Max broadcast: <span className="font-semibold text-foreground">{maxHours} {maxHours === 1 ? 'hour' : 'hours'}</span>
                    </span>
                </div>
            </div>

            {!activeStream && (
                <div>
                    <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">Live studio</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Broadcast live directly from your web browser using your webcam and microphone.
                        Streams can run for up to {maxHours} {maxHours === 1 ? 'hour' : 'hours'}.
                    </p>
                </div>
            )}

            {!isConfigured ? (
                <p className="rounded-2xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
                    Live streaming is not configured yet. Add your CLOUDFLARE_STREAM_TOKEN or Mux credentials to enable live streaming.
                </p>
            ) : activeStream ? (
                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald animate-pulse" />
                                    Active Broadcast Session
                                </span>
                                {activeStream.is_paid && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                        🎟️ Paid Workshop (₦{Number(activeStream.ticket_price).toLocaleString('en-NG')}/ticket)
                                    </span>
                                )}
                            </div>
                            <h2 className="truncate text-lg sm:text-xl font-extrabold text-foreground">
                                {activeStream.title}
                            </h2>
                            {activeStream.description && (
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                    {activeStream.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <BrowserStudio
                        liveStreamId={activeStream.id}
                        streamTitle={activeStream.title}
                        streamDescription={activeStream.description}
                        initialStatus={activeStream.status}
                        chatChannelId={activeStream.chat_channel_id}
                        hostId={activeStream.host_id}
                    />
                </section>
            ) : (
                <GoLiveForm />
            )}

            <section className="space-y-3">
                <h2 className="text-base font-bold text-foreground">{isAdmin ? 'All streams' : 'Your streams'}</h2>
                {streams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No streams yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {streams.map((s) => (
                            <li key={s.id} className="space-y-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-border/80">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        {/* Replay Thumbnail */}
                                        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                                            {s.thumbnail_url ? (
                                                <Image
                                                    src={s.thumbnail_url}
                                                    alt={s.title}
                                                    fill
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-muted/80">
                                                    <Clapperboard className="h-5 w-5 text-muted-foreground/50" />
                                                </div>
                                            )}
                                            {s.status === 'ended' && s.replay_video_id && (
                                                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[8px] font-bold text-white uppercase">
                                                    Replay
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[s.status]}`}>
                                                    {STATUS_LABELS[s.status]}
                                                </span>
                                                {s.is_paid && (
                                                    <span className="rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                                                        🎟️ ₦{Number(s.ticket_price).toLocaleString('en-NG')}
                                                    </span>
                                                )}
                                                <p className="truncate text-sm font-semibold text-foreground">{s.title}</p>
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Created {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                                                {s.ended_at && ` • Ended ${formatDistanceToNow(new Date(s.ended_at), { addSuffix: true })}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        {s.status === 'ended' && s.replay_video_id ? (
                                            <Link
                                                href={`/app/modushive/${s.replay_video_id}`}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold transition-colors"
                                            >
                                                <Play className="h-3.5 w-3.5 fill-primary text-primary" />
                                                Watch Replay
                                            </Link>
                                        ) : (
                                            <Link
                                                href={`/app/modushive/live/${s.id}`}
                                                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" /> View
                                            </Link>
                                        )}
                                        {s.status !== 'ended' && <EndStreamButton liveStreamId={s.id} />}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}
