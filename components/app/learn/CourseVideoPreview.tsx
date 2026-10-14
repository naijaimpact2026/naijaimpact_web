'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Volume2, VolumeX, Play, Sparkles } from 'lucide-react'
import { toPublicStorageUrl, shouldSkipImageOptimization } from '@/lib/supabase-image'
import type { Course } from '@/lib/actions/learn'

// Curated high-performance royalty-free short preview clips for courses
const DEFAULT_PREVIEW_CLIPS = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
]

function getPreviewVideoUrl(course: Course): { url: string; isEmbed: boolean; embedSrc?: string } | null {
    // 1. Direct course video
    let rawUrl = (course.video_url || '').trim()

    // 2. Fallback to first lesson video in outline
    if (!rawUrl && Array.isArray(course.course_outline)) {
        for (const section of course.course_outline) {
            if (Array.isArray(section.lessons)) {
                for (const lesson of section.lessons) {
                    if (lesson.video_url && lesson.video_url.trim()) {
                        rawUrl = lesson.video_url.trim()
                        break
                    }
                }
            }
            if (rawUrl) break
        }
    }

    // 3. Fallback to category-matched or deterministic preview clip
    if (!rawUrl) {
        const id = course.id || 'hubnovo'
        const charSum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        rawUrl = DEFAULT_PREVIEW_CLIPS[charSum % DEFAULT_PREVIEW_CLIPS.length]
    }

    if (!rawUrl) return null

    // Check for YouTube embed
    const ytMatch = rawUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
        const videoId = ytMatch[1]
        return {
            url: rawUrl,
            isEmbed: true,
            embedSrc: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${videoId}&playsinline=1&enablejsapi=1`,
        }
    }

    // Check for Vimeo embed
    const vimeoMatch = rawUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
    if (vimeoMatch) {
        const videoId = vimeoMatch[1]
        return {
            url: rawUrl,
            isEmbed: true,
            embedSrc: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&background=1&loop=1`,
        }
    }

    // Storage URL or direct video URL
    const publicUrl = toPublicStorageUrl(rawUrl) || rawUrl
    return {
        url: publicUrl,
        isEmbed: false,
    }
}

interface CourseVideoPreviewProps {
    course: Course
    coverUrl: string | null
    isHovered: boolean
    className?: string
}

export default function CourseVideoPreview({
    course,
    coverUrl,
    isHovered,
    className = '',
}: CourseVideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [progress, setProgress] = useState(0)
    const [hasError, setHasError] = useState(false)
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const preview = getPreviewVideoUrl(course)

    useEffect(() => {
        if (isHovered && preview && !hasError) {
            // Debounce slightly to prevent thrashing during fast mouse movement
            hoverTimeoutRef.current = setTimeout(() => {
                setIsPlaying(true)
                if (videoRef.current) {
                    videoRef.current.currentTime = 0
                    videoRef.current.play().catch(() => {
                        // Browser autoplay policy catch
                    })
                }
            }, 120)
        } else {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
                hoverTimeoutRef.current = null
            }
            setIsPlaying(false)
            if (videoRef.current) {
                videoRef.current.pause()
                videoRef.current.currentTime = 0
            }
            setProgress(0)
        }

        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [isHovered, preview, hasError])

    const handleTimeUpdate = () => {
        if (!videoRef.current) return
        const current = videoRef.current.currentTime
        const duration = videoRef.current.duration || 1
        setProgress((current / duration) * 100)
    }

    const toggleMute = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    return (
        <div className={`relative w-full h-full overflow-hidden bg-slate-950 ${className}`}>
            {/* Fallback & Cover Image */}
            {coverUrl ? (
                <Image
                    src={coverUrl}
                    alt={course.title}
                    fill
                    className={`object-cover transition-all duration-500 ${
                        isPlaying && !hasError ? 'opacity-0 scale-105' : 'opacity-100 group-hover:scale-[1.03]'
                    }`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized={shouldSkipImageOptimization(coverUrl)}
                />
            ) : (
                <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                        isPlaying && !hasError ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
                >
                    <div className="flex flex-col items-center justify-center gap-1.5 text-primary/40">
                        <Play className="h-10 w-10 fill-primary/20" />
                        <span className="text-[11px] font-bold text-muted-foreground">Course Preview</span>
                    </div>
                </div>
            )}

            {/* Playable Video Layer on Hover */}
            {preview && isPlaying && !hasError && (
                <div className="absolute inset-0 z-10 w-full h-full animate-in fade-in duration-300">
                    {preview.isEmbed && preview.embedSrc ? (
                        <iframe
                            src={preview.embedSrc}
                            className="w-full h-full border-0 pointer-events-none scale-105"
                            allow="autoplay; encrypted-media"
                            title={course.title}
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            src={preview.url}
                            muted={isMuted}
                            loop
                            playsInline
                            autoPlay
                            preload="metadata"
                            onTimeUpdate={handleTimeUpdate}
                            onError={() => setHasError(true)}
                            className="w-full h-full object-cover"
                        />
                    )}

                    {/* Active Preview Pill Badge */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 -ml-3" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">
                            Live Preview
                        </span>
                    </div>

                    {/* Mute / Unmute Button (for direct video) */}
                    {!preview.isEmbed && (
                        <button
                            type="button"
                            onClick={toggleMute}
                            title={isMuted ? 'Unmute' : 'Mute'}
                            className="absolute bottom-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 shadow-md transition-transform hover:scale-110 cursor-pointer"
                        >
                            {isMuted ? (
                                <VolumeX className="w-3.5 h-3.5" />
                            ) : (
                                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                        </button>
                    )}

                    {/* Progress Bar along bottom */}
                    {!preview.isEmbed && (
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40 z-20">
                            <div
                                className="h-full bg-primary transition-all duration-150 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Static hover hint when not playing */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors duration-300">
                    <div className="flex h-11 w-11 scale-90 items-center justify-center rounded-full bg-primary/90 text-primary-foreground opacity-0 shadow-lg backdrop-blur-xs transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                        <Play className="ml-0.5 h-5 w-5 fill-current" />
                    </div>
                </div>
            )}
        </div>
    )
}
