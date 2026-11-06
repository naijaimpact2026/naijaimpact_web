'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    CheckCircle2,
    Download,
    ExternalLink,
    Film,
    Heart,
    Loader2,
    Play,
    Radio,
    Share2,
    ShoppingBag,
    Users,
    X,
} from 'lucide-react'
import { toast } from '@/components/toast'
import {
    publishStreamAsVideo,
    createStreamRecordingUpload,
    finalizeStreamRecordingUpload,
} from '@/lib/actions/modushive'

interface StudioEndBroadcastModalProps {
    isOpen: boolean
    onClose: () => void
    liveStreamId: string
    title: string
    durationSeconds: number
    viewerCount: number
    snapshotUrl?: string | null
    recordedBlob?: Blob | null
}

export default function StudioEndBroadcastModal({
    isOpen,
    onClose,
    liveStreamId,
    title,
    durationSeconds,
    viewerCount,
    snapshotUrl,
    recordedBlob,
}: StudioEndBroadcastModalProps) {
    const router = useRouter()
    const [publishing, setPublishing] = useState(false)
    const [publishedVideoId, setPublishedVideoId] = useState<string | null>(null)

    if (!isOpen || typeof document === 'undefined') return null

    const formatDuration = (sec: number) => {
        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = sec % 60
        if (h > 0) return `${h}h ${m}m ${s}s`
        return `${m}m ${s}s`
    }

    const handleDownloadRecording = () => {
        if (!recordedBlob) {
            toast.error('No local recording available for download.')
            return
        }
        const url = URL.createObjectURL(recordedBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-recording.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Broadcast recording downloaded!')
    }

    const handlePublishAsVideo = async () => {
        setPublishing(true)
        try {
            if (recordedBlob && recordedBlob.size > 0) {
                const upRes = await createStreamRecordingUpload(liveStreamId, {
                    contentType: 'video/webm',
                    sizeBytes: recordedBlob.size,
                    durationS: durationSeconds,
                })
                if (upRes.ok && upRes.uploadUrl) {
                    await fetch(upRes.uploadUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'video/webm' },
                        body: recordedBlob,
                    })
                    await finalizeStreamRecordingUpload(upRes.videoId)
                    setPublishedVideoId(upRes.videoId)
                    toast.success('Live stream recorded and published to your channel videos!')
                    router.refresh()
                    return
                }
            }

            const res = await publishStreamAsVideo(liveStreamId, { title })
            if (!res.ok) {
                toast.error(res.error || 'Could not publish video.')
                return
            }
            setPublishedVideoId(res.videoId)
            toast.success('Live stream published to your channel videos!')
            router.refresh()
        } catch {
            toast.error('Unexpected error while publishing video.')
        } finally {
            setPublishing(false)
        }
    }

    return createPortal(
        <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card text-card-foreground dark:bg-[#121824] p-5 sm:p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Radio className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-extrabold text-foreground">
                            Broadcast Concluded
                        </h2>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            {title}
                        </p>
                    </div>
                </div>

                {/* Session Snapshot & Highlights */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Thumbnail Snapshot Preview */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-inner">
                        {snapshotUrl ? (
                            <Image
                                src={snapshotUrl}
                                alt={title}
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground">
                                <Film className="h-8 w-8 opacity-40" />
                            </div>
                        )}
                        <span className="absolute bottom-2 left-2 rounded-md bg-black/75 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                            Stream Capture
                        </span>
                    </div>

                    {/* Stats Tiles */}
                    <div className="flex flex-col justify-between gap-2">
                        <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duration</span>
                            <p className="text-sm font-extrabold text-foreground">{formatDuration(durationSeconds)}</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Peak Audience</span>
                            <p className="text-sm font-extrabold text-foreground">{viewerCount} {viewerCount === 1 ? 'Viewer' : 'Viewers'}</p>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="mt-5 space-y-2.5">
                    {publishedVideoId ? (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center justify-between gap-3 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-foreground">Published to Channel Videos</p>
                                    <p className="text-[11px] text-muted-foreground truncate">Replay is now active for viewers</p>
                                </div>
                            </div>
                            <Link
                                href={`/app/modushive/${publishedVideoId}`}
                                onClick={onClose}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                            >
                                <Play className="h-3 w-3 fill-white" /> Watch Replay
                            </Link>
                        </div>
                    ) : (
                        <button
                            type="button"
                            disabled={publishing}
                            onClick={handlePublishAsVideo}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                            {publishing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Publishing Replay Video...</span>
                                </>
                            ) : (
                                <>
                                    <Film className="h-4 w-4" />
                                    <span>🎬 Publish Past Stream as Channel Video</span>
                                </>
                            )}
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {recordedBlob ? (
                            <button
                                type="button"
                                onClick={handleDownloadRecording}
                                className="flex items-center justify-center gap-1.5 rounded-2xl border border-border/80 bg-background/50 hover:bg-muted px-3 py-2.5 text-xs font-bold text-foreground transition-colors"
                            >
                                <Download className="h-4 w-4 text-primary" />
                                <span>Save HD File</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        <Link
                            href={`/app/modushive/live/${liveStreamId}`}
                            onClick={onClose}
                            className="flex items-center justify-center gap-1.5 rounded-2xl border border-border/80 bg-background/50 hover:bg-muted px-3 py-2.5 text-xs font-bold text-foreground transition-colors"
                        >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            <span>Watch Page</span>
                        </Link>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Replays appear under Videos & Replays on ModuHive</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-semibold text-primary hover:underline"
                    >
                        Return to Studio
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
