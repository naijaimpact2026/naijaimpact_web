'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
    CheckCircle2,
    Film,
    Loader2,
    Play,
    Radio,
    UploadCloud,
    X,
} from 'lucide-react'
import { toast } from '@/components/toast'
import {
    createStreamRecordingUpload,
    finalizeStreamRecordingUpload,
    publishStreamAsVideo,
} from '@/lib/actions/modushive'
import type { LiveStreamWithHost } from '@/lib/types'

interface PublishStreamVideoModalProps {
    isOpen: boolean
    onClose: () => void
    stream: LiveStreamWithHost
    onPublished?: () => void
}

function putFile(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
    })
}

export default function PublishStreamVideoModal({
    isOpen,
    onClose,
    stream,
    onPublished,
}: PublishStreamVideoModalProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [title, setTitle] = useState(stream.title)
    const [description, setDescription] = useState(stream.description || '')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isSuccess, setIsSuccess] = useState(false)

    if (!isOpen || typeof document === 'undefined') return null

    const handleQuickPublish = async () => {
        setLoading(true)
        try {
            const res = await publishStreamAsVideo(stream.id, {
                title: title.trim(),
                description: description.trim(),
            })
            if (!res.ok) {
                toast.error(res.error || 'Failed to publish video.')
                return
            }
            setIsSuccess(true)
            toast.success(`Published "${title}" to your channel videos!`)
            if (onPublished) onPublished()
            router.refresh()
            setTimeout(() => onClose(), 1500)
        } catch {
            toast.error('Unexpected error while publishing video.')
        } finally {
            setLoading(false)
        }
    }

    const handleUploadAndPublish = async () => {
        if (!selectedFile) {
            toast.error('Please choose a video file to upload.')
            return
        }

        setLoading(true)
        setUploadProgress(5)

        try {
            // 1. Initiate recording upload
            const initRes = await createStreamRecordingUpload(stream.id, {
                contentType: selectedFile.type || 'video/mp4',
                sizeBytes: selectedFile.size,
                durationS: 60,
            })

            if (!initRes.ok) {
                toast.error(initRes.error || 'Failed to initialize upload.')
                setLoading(false)
                return
            }

            // 2. Upload file to R2
            await putFile(initRes.uploadUrl, selectedFile, (pct) => {
                setUploadProgress(Math.min(90, Math.max(10, pct)))
            })

            setUploadProgress(95)

            // 3. Finalize upload
            await finalizeStreamRecordingUpload(initRes.videoId).catch(() => {})

            setIsSuccess(true)
            toast.success('Recording uploaded and published as stream replay!')
            if (onPublished) onPublished()
            router.refresh()
            setTimeout(() => onClose(), 1500)
        } catch (err: any) {
            toast.error(err.message || 'Error during video upload.')
        } finally {
            setLoading(false)
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
                        <Film className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-extrabold text-foreground">
                            Publish Stream as Video
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Add this past live broadcast to your ModuHive channel video catalog
                        </p>
                    </div>
                </div>

                {isSuccess ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center gap-3 animate-in zoom-in-95 duration-200">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-base font-bold text-foreground">Replay Video Published!</h3>
                        <p className="text-xs text-muted-foreground max-w-xs">
                            Your stream is now listed under Recorded Replays & Videos for community viewing.
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 space-y-4">
                        {/* Title Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Video Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={120}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Enter video title..."
                            />
                        </div>

                        {/* Description Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Description (optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                placeholder="What was covered in this broadcast?"
                            />
                        </div>

                        {/* File Upload Zone */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>Attach Broadcast Recording</span>
                                <span className="text-[11px] font-normal text-primary">Recommended</span>
                            </label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 p-4 text-center hover:bg-muted/40 cursor-pointer transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) setSelectedFile(f)
                                    }}
                                />
                                <UploadCloud className="h-6 w-6 text-muted-foreground/60 mb-1" />
                                {selectedFile ? (
                                    <p className="text-xs font-bold text-primary truncate max-w-xs">
                                        Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-xs font-semibold text-foreground">
                                            Click to select MP4 or WebM recording
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Upload your recorded video file so community viewers can watch the replay anytime
                                        </p>
                                    </>
                                )}
                            </div>
                            {!selectedFile && (
                                <p className="text-[11px] text-muted-foreground px-1">
                                    💡 You can also publish now and attach the recording file later from the video page.
                                </p>
                            )}
                        </div>

                        {loading && uploadProgress > 0 && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                    <span>Uploading recording...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary transition-all duration-150"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>

                            {selectedFile ? (
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleUploadAndPublish}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                                    <span>Upload & Publish Replay</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleQuickPublish}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Film className="h-3.5 w-3.5" />}
                                    <span>Publish to Channel Videos</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}
