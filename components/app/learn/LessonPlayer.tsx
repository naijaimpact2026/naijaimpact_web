'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Trophy,
    PlayCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { markLessonComplete } from '@/lib/actions/learn'
import type {
    CourseLesson,
    CourseEnrollment,
} from '@/lib/types'

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

    const [completed, setCompleted] = useState(
        enrollment?.status === 'completed'
    )

    const [currentProgress, setCurrentProgress] = useState(
        Number(enrollment?.progress ?? 0)
    )

    const [justCompleted, setJustCompleted] = useState(false)

    const isLastLesson = nextLesson === null

    async function handleMarkComplete()
    {
        if (marking || completed)
        {
            return
        }

        setMarking(true)

        try
        {
            const result = await markLessonComplete(
                courseId,
                lesson.id
            )

            setCurrentProgress(
                Number(result.progress ?? 0)
            )

            if (result.completed)
            {
                setCompleted(true)
                setJustCompleted(true)

                router.refresh()

                return
            }

            if (nextLesson)
            {
                router.push(
                    `/app/learn/${courseId}/${nextLesson.id}`
                )

                return
            }

            router.refresh()
        }
        catch (err)
        {
            console.error(
                'markLessonComplete error:',
                err
            )
        }
        finally
        {
            setMarking(false)
        }
    }

    function getEmbedUrl(url: string): string
    {
        /*
         * YouTube:
         *
         * https://www.youtube.com/watch?v=XXXXXXXXXXX
         * https://youtu.be/XXXXXXXXXXX
         * https://www.youtube.com/embed/XXXXXXXXXXX
         */
        const ytMatch = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
        )

        if (ytMatch)
        {
            return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
        }

        /*
         * Vimeo:
         *
         * https://vimeo.com/123456789
         * https://player.vimeo.com/video/123456789
         */
        const vimeoMatch = url.match(
            /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/
        )

        if (vimeoMatch)
        {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`
        }

        return url
    }

    const videoUrl = lesson.video_url ?? ''

    const isEmbed =
        videoUrl.includes('youtube.com') ||
        videoUrl.includes('youtu.be') ||
        videoUrl.includes('vimeo.com')

    return (
        <div className="space-y-5">

            {/* ─────────────────────────────────────────────
                COURSE BREADCRUMB
            ───────────────────────────────────────────── */}

            <div className="flex items-center gap-2 text-sm">

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            `/app/learn/${courseId}`
                        )
                    }
                    className="
                        max-w-[240px]
                        truncate
                        font-medium
                        text-muted-foreground
                        transition-colors
                        hover:text-emerald-700
                    "
                >
                    {courseTitle}
                </button>

                <ChevronRight
                    className="
                        h-4 w-4
                        shrink-0
                        text-muted-foreground
                    "
                />

                <span className="
                    truncate
                    font-semibold
                    text-foreground
                ">
                    {lesson.title}
                </span>

            </div>

            {/* ─────────────────────────────────────────────
                COMPLETION MESSAGE
            ───────────────────────────────────────────── */}

            {justCompleted && (
                <div className="
                    overflow-hidden
                    rounded-xl
                    border border-emerald-200
                    bg-emerald-50
                ">
                    <div className="
                        flex flex-col
                        items-center
                        px-6 py-8
                        text-center
                    ">

                        <div className="
                            mb-4
                            flex h-16 w-16
                            items-center justify-center
                            rounded-full
                            border border-emerald-100
                            bg-card
                            shadow-sm
                        ">
                            <Trophy
                                className="
                                    h-8 w-8
                                    text-amber-500
                                "
                            />
                        </div>

                        <h2 className="
                            text-xl
                            font-bold
                            text-foreground
                        ">
                            Course Completed!
                        </h2>

                        <p className="
                            mt-1.5
                            max-w-md
                            text-sm
                            leading-relaxed
                            text-muted-foreground
                        ">
                            Congratulations! You&apos;ve
                            completed{' '}
                            <strong>
                                {courseTitle}
                            </strong>.
                        </p>

                        <Badge className="
                            mt-4
                            bg-emerald-600
                            px-4 py-1.5
                            text-sm
                            text-white
                        ">
                            <CheckCircle
                                className="
                                    mr-1.5
                                    h-4 w-4
                                "
                            />
                            Certificate Earned
                        </Badge>

                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────
                VIDEO PLAYER
            ───────────────────────────────────────────── */}

            <div className="
                overflow-hidden
                rounded-xl
                bg-black
                shadow-sm
            ">

                {videoUrl ? (

                    isEmbed ? (

                        <div className="
                            relative
                            aspect-video
                            w-full
                            bg-black
                        ">
                            <iframe
                                src={getEmbedUrl(videoUrl)}
                                className="
                                    absolute
                                    inset-0
                                    h-full
                                    w-full
                                "
                                allow="
                                    accelerometer;
                                    autoplay;
                                    clipboard-write;
                                    encrypted-media;
                                    gyroscope;
                                    picture-in-picture
                                "
                                allowFullScreen
                                title={lesson.title}
                            />
                        </div>

                    ) : (

                        <div className="
                            aspect-video
                            w-full
                            bg-black
                        ">
                            <video
                                src={videoUrl}
                                controls
                                className="
                                    h-full
                                    w-full
                                    object-contain
                                "
                                controlsList="nodownload"
                            >
                                Your browser does not support
                                the video tag.
                            </video>
                        </div>

                    )

                ) : (

                    <div className="
                        flex
                        aspect-video
                        w-full
                        items-center
                        justify-center
                        bg-slate-950
                    ">
                        <div className="text-center">

                            <div className="
                                mx-auto
                                mb-3
                                flex h-14 w-14
                                items-center justify-center
                                rounded-full
                                bg-white/10
                            ">
                                <PlayCircle
                                    className="
                                        h-7 w-7
                                        text-white/60
                                    "
                                />
                            </div>

                            <p className="
                                text-sm
                                font-medium
                                text-white/70
                            ">
                                No video available for
                                this lesson
                            </p>

                        </div>
                    </div>

                )}

            </div>

            {/* ─────────────────────────────────────────────
                LESSON HEADER
            ───────────────────────────────────────────── */}

            <div className="
                rounded-xl
                border border-border
                bg-card
                p-5
                sm:p-6
            ">

                <div className="
                    flex
                    flex-col
                    gap-4
                    sm:flex-row
                    sm:items-start
                    sm:justify-between
                ">

                    <div className="min-w-0">

                        <div className="
                            mb-1.5
                            text-xs
                            font-semibold
                            uppercase
                            tracking-wide
                            text-emerald-700
                        ">
                            Lesson
                        </div>

                        <h1 className="
                            text-xl
                            font-bold
                            leading-tight
                            text-foreground
                            sm:text-2xl
                        ">
                            {lesson.title}
                        </h1>

                        {lesson.duration_s && (
                            <p className="
                                mt-2
                                text-sm
                                text-muted-foreground
                            ">
                                {Math.ceil(
                                    lesson.duration_s / 60
                                )}{' '}
                                min
                            </p>
                        )}

                    </div>

                    {enrollment && (
                        <div className="
                            shrink-0
                            sm:min-w-[100px]
                            sm:text-right
                        ">
                            <p className="
                                text-xl
                                font-bold
                                text-foreground
                            ">
                                {Math.round(
                                    currentProgress
                                )}%
                            </p>

                            <p className="
                                text-xs
                                text-muted-foreground
                            ">
                                Course progress
                            </p>
                        </div>
                    )}

                </div>

                {enrollment && (
                    <div className="mt-5">

                        <div className="
                            h-1.5
                            w-full
                            overflow-hidden
                            rounded-full
                            bg-muted
                        ">
                            <div
                                className="
                                    h-full
                                    rounded-full
                                    bg-emerald-600
                                    transition-all
                                    duration-500
                                "
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            currentProgress
                                        )
                                    )}%`,
                                }}
                            />
                        </div>

                    </div>
                )}

            </div>

            {/* ─────────────────────────────────────────────
                LESSON ACTIONS
            ───────────────────────────────────────────── */}

            <div className="
                flex
                flex-col
                gap-3
                rounded-xl
                border border-border
                bg-card
                p-4
                sm:flex-row
                sm:items-center
                sm:justify-between
            ">

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                    {
                        if (prevLesson)
                        {
                            router.push(
                                `/app/learn/${courseId}/${prevLesson.id}`
                            )
                        }
                    }}
                    disabled={!prevLesson}
                    className="
                        gap-1.5
                        border-border
                        text-foreground
                        hover:border-muted-foreground/40
                    "
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>

                <div className="
                    order-first
                    flex flex-1
                    justify-center
                    sm:order-none
                ">

                    {enrollment && !completed && (
                        <Button
                            onClick={handleMarkComplete}
                            disabled={marking}
                            className="
                                min-w-[190px]
                                gap-2
                                bg-emerald-700
                                font-semibold
                                text-white
                                shadow-sm
                                hover:bg-emerald-800
                            "
                        >
                            {marking ? (
                                <>
                                    <Loader2
                                        className="
                                            h-4 w-4
                                            animate-spin
                                        "
                                    />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <CheckCircle
                                        className="
                                            h-4 w-4
                                        "
                                    />

                                    {isLastLesson
                                        ? 'Complete Course'
                                        : 'Complete & Continue'}
                                </>
                            )}
                        </Button>
                    )}

                    {completed &&
                        !justCompleted && (
                            <Badge className="
                                gap-1.5
                                border
                                border-emerald-200
                                bg-emerald-50
                                px-4 py-2
                                text-sm
                                font-semibold
                                text-emerald-700
                            ">
                                <CheckCircle
                                    className="
                                        h-4 w-4
                                    "
                                />
                                Lesson Completed
                            </Badge>
                        )}

                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                    {
                        if (nextLesson)
                        {
                            router.push(
                                `/app/learn/${courseId}/${nextLesson.id}`
                            )
                        }
                    }}
                    disabled={!nextLesson}
                    className="
                        gap-1.5
                        border-border
                        text-foreground
                        hover:border-muted-foreground/40
                    "
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>

            </div>

            {/* ─────────────────────────────────────────────
                MOBILE COURSE PROGRESS
            ───────────────────────────────────────────── */}

            {enrollment && (
                <div className="
                    text-center
                    text-xs
                    text-muted-foreground
                    lg:hidden
                ">
                    {totalLessons > 0
                        ? `Keep going — you're ${Math.round(
                            currentProgress
                        )}% through the course`
                        : 'Keep learning to complete this course'}
                </div>
            )}

        </div>
    )
}