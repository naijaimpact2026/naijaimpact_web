import Link from 'next/link'
import { AlertCircle, Clapperboard, Loader2, Radio, Upload, Video as VideoIcon } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { listLiveNow, listMyPendingVideos, listReadyVideos } from '@/lib/modushive/queries'
import { normalizeRole } from '@/lib/modushive/config'
import { LiveCard, VideoCard } from '@/components/app/modushive/VideoCard'
import { DeleteVideoButton, ProcessingRefresher } from '@/components/app/modushive/VideoActions'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'ModusHive — HubNovo' }

export default async function ModusHivePage()
{
    const { profile } = await getCurrentUser()
    const isAdmin = normalizeRole(profile?.role) === 'admin'

    // Pending first: syncing it can flip a video to ready, which should then
    // show up in the grid on this same render.
    const pending = await listMyPendingVideos(profile?.id ?? '')
    const [live, videos] = await Promise.all([listLiveNow(), listReadyVideos()])
    const stillProcessing = pending.some((v) => v.status === 'uploading' || v.status === 'processing')

    return (
        <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
            <ProcessingRefresher active={stillProcessing} />

            {/* Header */}
            <section className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                        <Clapperboard className="h-5 w-5 text-primary" />
                    </span>
                    <div>
                        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">ModusHive</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">Short videos and live streams from the HubNovo community.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Link href="/app/modushive/studio" className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                            <Radio className="h-4 w-4 text-destructive" /> Studio
                        </Link>
                    )}
                    <Link href="/app/modushive/upload" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                        <Upload className="h-4 w-4" /> Upload
                    </Link>
                </div>
            </section>

            {/* Live now */}
            {live.length > 0 && (
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" /> Live now
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-6">
                        {live.map((s) => <LiveCard key={s.id} stream={s} />)}
                    </div>
                </section>
            )}

            {/* The viewer's own uploads that aren't public yet */}
            {pending.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-base font-bold text-foreground">Your uploads</h2>
                    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
                        {pending.map((v) => (
                            <li key={v.id} className="flex items-center gap-3 px-4 py-3">
                                {v.status === 'errored'
                                    ? <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                                    : <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-foreground">{v.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {v.status === 'errored'
                                            ? `Failed${v.error_message ? ` — ${v.error_message}` : ''}`
                                            : v.status === 'uploading' ? 'Upload not finished' : 'Processing — this usually takes a minute or two'}
                                    </p>
                                </div>
                                {v.status !== 'processing' && <DeleteVideoButton videoId={v.id} />}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Latest videos */}
            <section className="space-y-3">
                <h2 className="text-base font-bold text-foreground">Latest videos</h2>
                {videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-6">
                        {videos.map((v) => <VideoCard key={v.id} video={v} />)}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <VideoIcon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                        </span>
                        <p className="text-sm font-semibold text-foreground">No videos yet</p>
                        <p className="mt-1 max-w-xs text-xs text-muted-foreground">Be the first to share a short video with the community.</p>
                        <Link href="/app/modushive/upload" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                            <Upload className="h-4 w-4" /> Upload a video
                        </Link>
                    </div>
                )}
            </section>
        </div>
    )
}
