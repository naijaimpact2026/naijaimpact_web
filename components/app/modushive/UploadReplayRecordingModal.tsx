'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
    CheckCircle2,
    Film,
    Loader2,
    UploadCloud,
    X,
} from 'lucide-react'
import { toast } from '@/components/toast'
import {
    createVideoRecordingUpload,
    finalizeStreamRecordingUpload,
} from '@/lib/actions/modushive'

interface UploadReplayRecordingModalProps {
    isOpen: boolean
    onClose: () => void
    videoId: string
    videoTitle?: string
    onUploaded?: () => void
}

function putFile(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
    })
}

export default function UploadReplayRecordingModal({
    isOpen,
    onClose,
    videoId,
    videoTitle,
    onUploaded,
}: UploadReplayRecordingModalProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isSuccess, setIsSuccess] = useState(false)

    if (!isOpen || typeof document === 'undefined') return null

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please choose a video file to upload.')
            return
        }

        setLoading(true)
        setUploadProgress(5)

        try {
            // 1. Initiate recording upload for the video row
            const initRes = await createVideoRecordingUpload(videoId, {
                contentType: selectedFile.type || 'video/mp4',
                sizeBytes: selectedFile.size,
                durationS: 60,
            })

            if (!initRes.ok) {
                toast.error(initRes.error || 'Failed to prepare video upload.')
                setLoading(false)
                return
            }

            // 2. Upload file via PUT to presigned URL
            await putFile(initRes.uploadUrl, selectedFile, (pct) => {
                setUploadProgress(Math.min(90, Math.max(10, pct)))
            })

            setUploadProgress(95)

            // 3. Finalize upload
            const finRes = await finalizeStreamRecordingUpload(videoId)
            if (!finRes.ok) {
                toast.error(finRes.error || 'Failed to finalize video.')
                setLoading(false)
                return
            }

            setIsSuccess(true)
            toast.success('Recording attached! Your replay is now ready to play.')
            if (onUploaded) onUploaded()
            router.refresh()
            setTimeout(() => {
                onClose()
            }, 1200)
        } catch (err: any) {
            toast.error(err.message || 'Error uploading video recording.')
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
                    disabled={loading}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
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
                            Upload Stream Recording
                        </h2>
                        <p className="text-xs text-muted-foreground truncate max-w-sm">
                            {videoTitle ? `Attach recording to "${videoTitle}"` : 'Attach an MP4 or WebM video recording'}
                        </p>
                    </div>
                </div>

                {isSuccess ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center gap-3 animate-in zoom-in-95 duration-200">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-base font-bold text-foreground">Recording Attached!</h3>
                        <p className="text-xs text-muted-foreground max-w-xs">
                            Your stream replay is ready to watch. Reloading the player now...
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 space-y-4">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Upload your local recording file (MP4 or WebM) for this broadcast. Once uploaded, it will play smoothly for anyone watching this replay.
                        </p>

                        {/* File Upload Zone */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center hover:bg-muted/40 cursor-pointer transition-colors"
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
                            <UploadCloud className="h-8 w-8 text-muted-foreground/60 mb-2" />
                            {selectedFile ? (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-primary truncate max-w-xs">
                                        Selected: {selectedFile.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Size: {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-foreground">
                                        Click to choose recording file
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Accepts MP4 or WebM video files
                                    </p>
                                </div>
                            )}
                        </div>

                        {loading && uploadProgress > 0 && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                    <span>Uploading video...</span>
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

                            <button
                                type="button"
                                disabled={loading || !selectedFile}
                                onClick={handleUpload}
                                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                                <span>Upload Recording</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}
