import Link from 'next/link'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { canGoLive, getLiveLimits, normalizeRole } from '@/lib/modushive/config'
import { isCloudflareStreamConfigured } from '@/lib/modushive/cloudflare'
import { isMuxConfigured } from '@/lib/modushive/mux'
import { listStudioStreams } from '@/lib/modushive/queries'
import { BrowserStudio } from '@/components/app/modushive/BrowserStudio'
import { EndStreamButton, GoLiveForm, StreamKeyPanel } from '@/components/app/modushive/StudioControls'
import { ProcessingRefresher } from '@/components/app/modushive/VideoActions'
import type { LiveStream } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Studio — ModusHive' }

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
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
            <ProcessingRefresher active={watching} intervalMs={10000} />

            <Link href="/app/modushive" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> ModusHive
            </Link>

            <div>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">Live studio</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Broadcast live directly from your web browser using your webcam and microphone, or connect via OBS.
                    Streams can run for up to {maxHours} {maxHours === 1 ? 'hour' : 'hours'}.
                </p>
            </div>

            {!isConfigured ? (
                <p className="rounded-2xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
                    Live streaming is not configured yet. Add your CLOUDFLARE_STREAM_TOKEN or Mux credentials to enable live streaming.
                </p>
            ) : activeStream ? (
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Broadcaster Studio</span>
                            <h2 className="truncate text-lg font-bold text-foreground">{activeStream.title}</h2>
                        </div>
                    </div>
                    <BrowserStudio
                        liveStreamId={activeStream.id}
                        streamTitle={activeStream.title}
                        initialStatus={activeStream.status}
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
                            <li key={s.id} className="space-y-4 rounded-2xl border border-border bg-card p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[s.status]}`}>
                                                {STATUS_LABELS[s.status]}
                                            </span>
                                            <p className="truncate text-sm font-semibold text-foreground">{s.title}</p>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Created {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/app/modushive/live/${s.id}`} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
                                            <ExternalLink className="h-3.5 w-3.5" /> View
                                        </Link>
                                        {s.status !== 'ended' && <EndStreamButton liveStreamId={s.id} />}
                                    </div>
                                </div>
                                {s.status !== 'ended' && <StreamKeyPanel liveStreamId={s.id} />}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}
