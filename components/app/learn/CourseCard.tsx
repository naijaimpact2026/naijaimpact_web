'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    GraduationCap,
    PlayCircle,
    Clock3,
    BookOpen,
    ArrowRight,
} from 'lucide-react'
import { toPublicStorageUrl } from '@/lib/supabase-image'
import type { Course } from '@/lib/actions/learn'

export default function CourseCard({ course }: { course: Course })
{
    const outline = Array.isArray(course.course_outline)
        ? course.course_outline
        : []

    const totalLessons = outline.reduce(
        (total, section) =>
            total + (Array.isArray(section.lessons) ? section.lessons.length : 0),
        0
    )

    const amount = typeof course.amount === 'number' ? course.amount : 0
    const coverUrl = toPublicStorageUrl(course.cover_image_url)

    const instructorName =
        course.instructor?.display_name?.trim() || 'Hubnovo Instructor'

    const instructorInitial =
        instructorName.charAt(0).toUpperCase()

    return (
        <Link
            href={`/app/learn/${course.id}`}
            className="group block h-full"
        >
            <article className="
                flex h-full flex-col overflow-hidden
                rounded-xl border border-border bg-card
                transition-all duration-200
                hover:-translate-y-0.5
                hover:border-muted-foreground/30
                hover:shadow-lg
            ">
                {/* -------------------------------------------------- */}
                {/* Thumbnail */}
                {/* -------------------------------------------------- */}

                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {coverUrl ? (
                        <Image
                            src={coverUrl}
                            alt={course.title}
                            fill
                            className="
                                object-cover
                                transition-transform duration-500
                                group-hover:scale-[1.04]
                            "
                            sizes="
                                (max-width: 640px) 100vw,
                                (max-width: 1024px) 50vw,
                                25vw
                            "
                            unoptimized={coverUrl.includes('supabase.co')}
                        />
                    ) : (
                        <div className="
                            absolute inset-0
                            flex items-center justify-center
                        " style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}>
                            <GraduationCap
                                className="h-12 w-12 text-white/25"
                            />
                        </div>
                    )}

                    {/* Dark gradient */}
                    <div className="
                        absolute inset-x-0 bottom-0 h-20
                        bg-gradient-to-t from-black/50 to-transparent
                    " />

                    {/* Price */}
                    <div className="absolute right-3 top-3">
                        <span className={`
                            inline-flex items-center rounded-md px-2.5 py-1
                            text-xs font-bold shadow-sm
                            ${
                                course.is_free
                                    ? 'bg-emerald text-emerald-foreground'
                                    : 'bg-card text-foreground'
                            }
                        `}>
                            {course.is_free
                                ? 'Free'
                                : `₦${amount.toLocaleString('en-NG')}`
                            }
                        </span>
                    </div>

                    {/* Preview */}
                    {course.video_url && (
                        <div className="absolute bottom-3 left-3">
                            <span className="
                                inline-flex items-center gap-1.5
                                rounded-md bg-black/65 px-2 py-1
                                text-[11px] font-semibold text-white
                                backdrop-blur-sm
                            ">
                                <PlayCircle className="h-3.5 w-3.5" />
                                Preview
                            </span>
                        </div>
                    )}
                </div>

                {/* -------------------------------------------------- */}
                {/* Course information */}
                {/* -------------------------------------------------- */}

                <div className="flex flex-1 flex-col p-4">

                    {/* Category */}
                    {course.category_name && (
                        <span className="
                            mb-2 w-fit
                            text-[11px] font-semibold uppercase
                            tracking-wide text-primary
                        ">
                            {course.category_name}
                        </span>
                    )}

                    {/* Title */}
                    <h3 className="
                        line-clamp-2
                        text-[15px] font-bold leading-[1.35]
                        text-foreground
                        transition-colors
                        group-hover:text-primary
                    ">
                        {course.title}
                    </h3>

                    {/* Description */}
                    {course.description && (
                        <p className="
                            mt-2 line-clamp-2
                            text-xs leading-relaxed
                            text-muted-foreground
                        ">
                            {course.description}
                        </p>
                    )}

                    {/* Course metadata */}
                    <div className="
                        mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5
                        text-[11px] text-muted-foreground
                    ">
                        {totalLessons > 0 && (
                            <span className="inline-flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" />
                                {totalLessons} lessons
                            </span>
                        )}

                        {outline.length > 0 && (
                            <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                {outline.length} sections
                            </span>
                        )}
                    </div>

                    {/* Instructor */}
                    <div className="
                        mt-auto flex items-center
                        justify-between gap-3
                        border-t border-border
                        pt-4 mt-4
                    ">
                        <div className="flex min-w-0 items-center gap-2">
                            <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage
                                    src={
                                        course.instructor?.avatar_url ??
                                        undefined
                                    }
                                />

                                <AvatarFallback className="
                                    bg-primary/10
                                    text-[10px] font-bold
                                    text-primary
                                ">
                                    {instructorInitial}
                                </AvatarFallback>
                            </Avatar>

                            <span className="
                                truncate
                                text-xs font-medium
                                text-muted-foreground
                            ">
                                {instructorName}
                            </span>
                        </div>

                        {/* Arrow appears on hover */}
                        <ArrowRight className="
                            h-4 w-4 shrink-0
                            text-muted-foreground
                            transition-all duration-200
                            group-hover:translate-x-0.5
                            group-hover:text-primary
                        " />
                    </div>
                </div>
            </article>
        </Link>
    )
}
