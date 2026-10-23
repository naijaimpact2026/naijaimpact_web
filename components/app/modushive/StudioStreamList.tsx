'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, Film, Play } from 'lucide-react'
import StreamThumbnail from '@/components/app/modushive/StreamThumbnail'
import PublishStreamVideoModal from '@/components/app/modushive/PublishStreamVideoModal'
import { EndStreamButton } from '@/components/app/modushive/StudioControls'
import type { LiveStreamWithHost } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = {
    idle: 'Setup',
    live: 'Live now',
    ended: 'Ended',
}

const STATUS_STYLES: Record<string, string> = {
    idle: 'bg-muted text-muted-foreground',
    live: 'bg-destructive/15 text-destructive border border-destructive/25',
    ended: 'bg-muted text-muted-foreground',
}

interface StudioStreamListProps {
    streams: LiveStreamWithHost[]
}

export default function StudioStreamList({ streams }: StudioStreamListProps) {
    const [selectedStreamForPublish, setSelectedStreamForPublish] = useState<LiveStreamWithHost | null>(null)

    return (
        <>
            <ul className="space-y-3">
                {streams.map((s) => (
                    <li
                        key={s.id}
                        className="space-y-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-border/80"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                                {/* Safe Resilient Replay Thumbnail */}
                                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                                    <StreamThumbnail
                                        title={s.title}
                                        thumbnailUrl={s.thumbnail_url}
                                        status={s.status}
                                        isReplay={s.status === 'ended'}
                                        isPaid={s.is_paid}
                                        ticketPrice={s.ticket_price}
                                    />
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

                            <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                                {s.status === 'ended' && s.replay_video_id ? (
                                    <Link
                                        href={`/app/modushive/${s.replay_video_id}`}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold transition-colors"
                                    >
                                        <Play className="h-3.5 w-3.5 fill-current" />
                                        Watch Replay
                                    </Link>
                                ) : s.status === 'ended' ? (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStreamForPublish(s)}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 text-xs font-bold transition-colors"
                                    >
                                        <Film className="h-3.5 w-3.5" />
                                        <span>Publish as Video</span>
                                    </button>
                                ) : null}

                                <Link
                                    href={`/app/modushive/live/${s.id}`}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" /> View
                                </Link>

                                {s.status !== 'ended' && <EndStreamButton liveStreamId={s.id} />}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {selectedStreamForPublish && (
                <PublishStreamVideoModal
                    isOpen={Boolean(selectedStreamForPublish)}
                    onClose={() => setSelectedStreamForPublish(null)}
                    stream={selectedStreamForPublish}
                />
            )}
        </>
    )
}
