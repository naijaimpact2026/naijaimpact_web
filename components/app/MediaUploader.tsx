'use client'

// components/app/MediaUploader.tsx
// Multi-image/video uploader with thumbnail grid preview, drag-and-drop,
// per-file progress, retry/remove, and an "Add more" inline button.

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react'
import Image from 'next/image'
import
    {
        CheckCircle2, XCircle, RotateCcw, Trash2, Upload,
        ImageIcon, VideoIcon, Plus, Loader2,
    } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Public types ───────────────────────────────────────────────────────────────

export interface UploadedFile
{
    secure_url: string
    public_id: string
    width?: number
    height?: number
    duration?: number
    mediaType: 'image' | 'video'
}

// ─── Internal per-file state ────────────────────────────────────────────────────

interface FileEntry
{
    id: string
    file: File
    /** Local object URL for instant preview (revoked on removal) */
    previewUrl: string
    status: 'pending' | 'uploading' | 'done' | 'error'
    progress: number
    result?: UploadedFile
    error?: string
}

// ─── Props ──────────────────────────────────────────────────────────────────────

interface MediaUploaderProps
{
    onUploadComplete: (urls: UploadedFile[]) => void
    maxImages?: number
    maxVideos?: number
    className?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function humanSize(bytes: number): string
{
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageMime(mime: string)
{
    return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)
}

function isVideoMime(mime: string)
{
    return ['video/mp4', 'video/quicktime', 'video/webm'].includes(mime)
}

function genId() { return Math.random().toString(36).slice(2) }

// ─── Component ──────────────────────────────────────────────────────────────────

export function MediaUploader({
    onUploadComplete,
    maxImages = 10,
    maxVideos = 1,
    className,
}: MediaUploaderProps)
{
    const [entries, setEntries] = useState<FileEntry[]>([])
    const [dragging, setDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const acceptAttr = [
        ...(maxImages > 0 ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] : []),
        ...(maxVideos > 0 ? ['video/mp4', 'video/quicktime', 'video/webm'] : []),
    ].join(',')

    const getCompletedFiles = useCallback(
        (current: FileEntry[]): UploadedFile[] =>
            current.filter(e => e.status === 'done' && e.result).map(e => e.result!),
        []
    )

    const uploadEntry = useCallback(
        (entry: FileEntry) =>
        {
            const formData = new FormData()
            formData.append('file', entry.file)

            const xhr = new XMLHttpRequest()
            xhr.withCredentials = true

            xhr.upload.addEventListener('progress', (evt) =>
            {
                if (!evt.lengthComputable) return
                const pct = Math.round((evt.loaded / evt.total) * 100)
                setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, progress: pct } : e))
            })

            xhr.addEventListener('load', () =>
            {
                if (xhr.status >= 200 && xhr.status < 300)
                {
                    let parsed: { secure_url: string; public_id: string; width?: number; height?: number; duration?: number }
                    try { parsed = JSON.parse(xhr.responseText) }
                    catch
                    {
                        setEntries(prev => prev.map(e =>
                            e.id === entry.id ? { ...e, status: 'error', error: 'Invalid server response.' } : e
                        ))
                        return
                    }
                    const mediaType: 'image' | 'video' = isImageMime(entry.file.type) ? 'image' : 'video'
                    const result: UploadedFile = {
                        secure_url: parsed.secure_url,
                        public_id: parsed.public_id,
                        width: parsed.width,
                        height: parsed.height,
                        duration: parsed.duration,
                        mediaType,
                    }
                    setEntries(prev =>
                    {
                        const next = prev.map(e =>
                            e.id === entry.id ? { ...e, status: 'done' as const, progress: 100, result } : e
                        )
                        setTimeout(() => onUploadComplete(getCompletedFiles(next)), 0)
                        return next
                    })
                } else
                {
                    let message = `Upload failed (${xhr.status})`
                    if (xhr.status === 401) message = 'Not signed in. Please refresh.'
                    else { try { const b = JSON.parse(xhr.responseText) as { error?: string }; if (b.error) message = b.error } catch { } }
                    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'error', error: message } : e))
                }
            })

            xhr.addEventListener('error', () =>
            {
                setEntries(prev => prev.map(e =>
                    e.id === entry.id ? { ...e, status: 'error', error: 'Network error. Please retry.' } : e
                ))
            })

            xhr.open('POST', '/api/upload')
            xhr.send(formData)
            setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'uploading', progress: 0 } : e))
        },
        [getCompletedFiles, onUploadComplete]
    )

    const handleFilesSelected = useCallback(
        (files: File[]) =>
        {
            setEntries(prev =>
            {
                const currentImages = prev.filter(e => e.status !== 'error' && isImageMime(e.file.type)).length
                const currentVideos = prev.filter(e => e.status !== 'error' && isVideoMime(e.file.type)).length

                const newEntries: FileEntry[] = []
                let imgCount = currentImages
                let vidCount = currentVideos

                for (const file of files)
                {
                    if (isImageMime(file.type))
                    {
                        if (imgCount >= maxImages) continue
                        imgCount++
                    } else if (isVideoMime(file.type))
                    {
                        if (vidCount >= maxVideos) continue
                        vidCount++
                    } else continue

                    newEntries.push({
                        id: genId(),
                        file,
                        previewUrl: URL.createObjectURL(file),
                        status: 'pending',
                        progress: 0,
                    })
                }

                setTimeout(() => { newEntries.forEach(e => uploadEntry(e)) }, 0)
                return [...prev, ...newEntries]
            })
        },
        [maxImages, maxVideos, uploadEntry]
    )

    const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true) }
    const onDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false) }
    const onDrop = (e: DragEvent<HTMLDivElement>) =>
    {
        e.preventDefault(); setDragging(false)
        handleFilesSelected(Array.from(e.dataTransfer.files))
    }
    const onInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        if (!e.target.files) return
        handleFilesSelected(Array.from(e.target.files))
        e.target.value = ''
    }

    const retryEntry = (id: string) =>
    {
        setEntries(prev =>
        {
            const entry = prev.find(e => e.id === id)
            if (!entry) return prev
            const reset: FileEntry = { ...entry, status: 'pending', progress: 0, error: undefined }
            setTimeout(() => uploadEntry(reset), 0)
            return prev.map(e => e.id === id ? reset : e)
        })
    }

    const removeEntry = (id: string) =>
    {
        setEntries(prev =>
        {
            const target = prev.find(e => e.id === id)
            if (target) URL.revokeObjectURL(target.previewUrl)
            const next = prev.filter(e => e.id !== id)
            setTimeout(() => onUploadComplete(getCompletedFiles(next)), 0)
            return next
        })
    }

    const imageEntries = entries.filter(e => isImageMime(e.file.type))
    const videoEntries = entries.filter(e => isVideoMime(e.file.type))
    const hasEntries = entries.length > 0
    const canAddMore = imageEntries.length < maxImages || videoEntries.length < maxVideos

    return (
        <div className={cn('flex flex-col gap-3', className)}>

            {/* ── Empty drop zone (shown only when no files yet) ── */}
            {!hasEntries && (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
                    aria-label="Upload media files"
                    className={cn(
                        'relative cursor-pointer select-none rounded-2xl',
                        'flex flex-col items-center justify-center gap-2 py-8 px-4',
                        'border-2 border-dashed transition-all duration-200',
                        dragging
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/40'
                    )}
                >
                    <div className="flex items-center gap-3 text-gray-400">
                        <ImageIcon className="h-6 w-6" />
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-emerald-600" />
                        </div>
                        <VideoIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mt-1">
                        {dragging ? 'Drop files here' : 'Drag & drop or click to add photos/video'}
                    </p>
                    <p className="text-xs text-gray-400">
                        Up to {maxImages} photo{maxImages !== 1 ? 's' : ''} · JPG, PNG, WebP, GIF
                    </p>
                </div>
            )}

            {/* ── Thumbnail grid (shown when files are selected) ── */}
            {hasEntries && (
                <div>
                    {/* Image thumbnails grid */}
                    {imageEntries.length > 0 && (
                        <div className={cn(
                            'grid gap-2',
                            imageEntries.length === 1 ? 'grid-cols-1' :
                                imageEntries.length === 2 ? 'grid-cols-2' :
                                    imageEntries.length === 3 ? 'grid-cols-3' :
                                        'grid-cols-4'
                        )}>
                            {imageEntries.map(entry => (
                                <div key={entry.id}
                                    className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
                                    style={{ aspectRatio: imageEntries.length === 1 ? '16/9' : '1/1' }}>
                                    {/* Preview image */}
                                    <img
                                        src={entry.previewUrl}
                                        alt={entry.file.name}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Upload progress overlay */}
                                    {entry.status === 'uploading' && (
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            <span className="text-white text-xs font-bold">{entry.progress}%</span>
                                            <div className="w-3/4 h-1 bg-white/30 rounded-full overflow-hidden">
                                                <div className="h-full bg-white rounded-full transition-all"
                                                    style={{ width: `${entry.progress}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Done tick */}
                                    {entry.status === 'done' && (
                                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}

                                    {/* Error overlay */}
                                    {entry.status === 'error' && (
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 p-2">
                                            <XCircle className="w-6 h-6 text-red-400" />
                                            <p className="text-white text-[10px] text-center leading-tight line-clamp-2">{entry.error}</p>
                                            <button onClick={() => retryEntry(entry.id)}
                                                className="flex items-center gap-1 text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-colors">
                                                <RotateCcw className="w-2.5 h-2.5" /> Retry
                                            </button>
                                        </div>
                                    )}

                                    {/* Remove button */}
                                    {(entry.status === 'done' || entry.status === 'error' || entry.status === 'uploading') && (
                                        <button
                                            onClick={() => removeEntry(entry.id)}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                                            aria-label={`Remove ${entry.file.name}`}
                                        >
                                            <Trash2 className="w-3 h-3 text-white" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Add more tile */}
                            {canAddMore && imageEntries.length < maxImages && (
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className={cn(
                                        'rounded-xl border-2 border-dashed border-gray-200 bg-gray-50',
                                        'hover:border-emerald-400 hover:bg-emerald-50/50 transition-all',
                                        'flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-emerald-600',
                                        imageEntries.length === 1 ? 'aspect-video' : 'aspect-square'
                                    )}
                                    aria-label="Add more photos"
                                    style={{ aspectRatio: imageEntries.length === 1 ? '4/3' : '1/1' }}
                                >
                                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="text-[11px] font-semibold">Add photo</span>
                                    <span className="text-[10px] text-gray-300">{maxImages - imageEntries.length} left</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Video entries (list style) */}
                    {videoEntries.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {videoEntries.map(entry => (
                                <div key={entry.id}
                                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                                        <VideoIcon className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{entry.file.name}</p>
                                        <p className="text-xs text-gray-400">{humanSize(entry.file.size)}</p>
                                        {entry.status === 'uploading' && (
                                            <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all"
                                                    style={{ width: `${entry.progress}%` }} />
                                            </div>
                                        )}
                                        {entry.status === 'error' && (
                                            <p className="text-xs text-red-500 mt-0.5">{entry.error}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {entry.status === 'uploading' && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                                        {entry.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        {entry.status === 'error' && (
                                            <button onClick={() => retryEntry(entry.id)}
                                                className="p-1 text-gray-400 hover:text-gray-700 transition-colors" aria-label="Retry">
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button onClick={() => removeEntry(entry.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors" aria-label="Remove">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Drop zone when files exist (compact) */}
                    {!canAddMore && (
                        <p className="text-xs text-center text-gray-400 mt-1">
                            Maximum {maxImages} photos reached
                        </p>
                    )}
                </div>
            )}

            {/* Hidden drag-drop zone overlay when files are present */}
            {hasEntries && canAddMore && (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                        'rounded-xl border-2 border-dashed transition-all py-3 px-4 text-center text-xs text-gray-400 cursor-pointer',
                        dragging
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                            : 'border-gray-100 hover:border-gray-200'
                    )}
                    onClick={() => inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
                >
                    {dragging ? '📎 Drop to add' : '+ drag more files here'}
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                multiple
                accept={acceptAttr}
                className="sr-only"
                onChange={onInputChange}
                aria-hidden="true"
            />
        </div>
    )
}

export default MediaUploader
