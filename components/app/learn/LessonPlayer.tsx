'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { markLessonComplete } from '@/lib/actions/learn'
import type { CourseLesson, CourseEnrollment } from '@/lib/types'

interface LessonPlayerProps
{
    courseId: string
    lesson: CourseLesson
    prevLesson: CourseLesson | null
    nextLesson: CourseLesson | null
    enrollment: CourseEnrollment | null
    totalLessons: number
    courseTitle: string
}

export default function LessonPlayer({
    courseId,
    lesson,
    prevLesson,
    nextLesson,
    enrollment,
    totalLessons,
    courseTitle,
}: LessonPlayerProps)
{
    const router = useRouter()
    const [marking, setMarking] = useState(false)
    const [completed, setCompleted] = useState(enrollment?.status === 'completed')
    const [currentProgress, setCurrentProgress] = useState(enrollment?.progress ?? 0)
    const [justCompleted, setJustCompleted] = useState(false)

    const isLastLesson = nextLesson === null

    async function handleMarkComplete()
    {
        if (marking) return
        setMarking(true)

        try
        {
            const result = await markLessonComplete(courseId, lesson.id)
            setCurrentProgress(result.progress)
            if (result.completed)
            {
                setCompleted(true)
                setJustCompleted(true)
            }
            // Navigate to next lesson if available
            if (nextLesson && !result.completed)
            {
                router.push(`/app/learn/${courseId}/${nextLesson.id}`)
            } else
            {
                router.refresh()
            }
        } catch (err)
        {
            console.error('markLessonComplete error:', err)
        } finally
        {
            setMarking(false)
        }
    }

    function getEmbedUrl(url: string): string
    {
        // Support YouTube URLs
        const ytMatch = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
        )
        if (ytMatch)
        {
            return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
        }
        // Support Vimeo URLs
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
        if (vimeoMatch)
        {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`
        }
        return url
    }

    const isEmbed =
        lesson.video_url &&
        (lesson.video_url.includes('youtube') ||
            lesson.video_url.includes('youtu.be') ||
            lesson.video_url.includes('vimeo'))

    return (
        <div className="space-y-4">
            {/* Course breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button
                    onClick={() => router.push(`/app/learn/${courseId}`)}
                    className="hover:text-foreground transition-colors"
                >
                    {courseTitle}
                </button>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">{lesson.title}</span>
            </div>

            {/* Completion badge */}
            {justCompleted && (
                <div className="bento-card noise-bg p-6 text-center space-y-3 border-green-500/40 bg-green-50/50 dark:bg-green-950/20">
                    <div className="flex justify-center">
                        <Trophy className="h-12 w-12 text-yellow-500" />
                    </div>
                    <h2 className="text-xl font-bold">Course Completed! 🎉</h2>
                    <p className="text-muted-foreground">
                        Congratulations! You&apos;ve completed <strong>{courseTitle}</strong>.
                    </p>
                    <Badge className="bg-green-500 text-white text-sm px-4 py-1">
                        ✓ Certificate Earned
                    </Badge>
                </div>
            )}

            {/* Video player */}
            <div className="bento-card overflow-hidden">
                {lesson.video_url ? (
                    isEmbed ? (
                        <div className="relative aspect-video w-full bg-black">
                            <iframe
                                src={getEmbedUrl(lesson.video_url)}
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={lesson.title}
                            />
                        </div>
                    ) : (
                        // Direct video file (e.g. Cloudinary)
                        <div className="aspect-video w-full bg-black">
                            <video
                                src={lesson.video_url}
                                controls
                                className="w-full h-full"
                                controlsList="nodownload"
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )
                ) : (
                    <div className="aspect-video w-full bg-muted flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <div className="text-4xl mb-2">🎬</div>
                            <p>No video available for this lesson</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Lesson info + controls */}
            <div className="bento-card noise-bg p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold">{lesson.title}</h1>
                        {lesson.duration_s && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Duration: {Math.ceil(lesson.duration_s / 60)} min
                            </p>
                        )}
                    </div>

                    {/* Progress indicator */}
                    {enrollment && (
                        <div className="text-right shrink-0">
                            <p className="text-sm font-medium">{currentProgress}%</p>
                            <p className="text-xs text-muted-foreground">Progress</p>
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                {enrollment && (
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                            style={{ width: `${currentProgress}%` }}
                        />
                    </div>
                )}

                {/* Navigation + complete button */}
                <div className="flex items-center justify-between gap-3 pt-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => prevLesson && router.push(`/app/learn/${courseId}/${prevLesson.id}`)}
                        disabled={!prevLesson}
                        className="gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>

                    {enrollment && !completed && (
                        <Button
                            className="gradient-primary text-white gap-2 font-semibold"
                            onClick={handleMarkComplete}
                            disabled={marking}
                        >
                            {marking ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    {isLastLesson ? 'Complete Course' : 'Mark Complete & Next'}
                                </>
                            )}
                        </Button>
                    )}

                    {completed && !justCompleted && (
                        <Badge className="bg-green-500 text-white gap-1.5 px-3 py-1.5">
                            <CheckCircle className="h-4 w-4" />
                            Completed
                        </Badge>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => nextLesson && router.push(`/app/learn/${courseId}/${nextLesson.id}`)}
                        disabled={!nextLesson}
                        className="gap-1"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
