import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { fetchCourseById } from '@/lib/actions/learn'
import { createClient } from '@/lib/supabase/server'
import EnrolButton from '@/components/app/learn/EnrolButton'
import { Avatar, AvatarFallback, AvatarImage, } from '@/components/ui/avatar'
import {
    ArrowLeft,
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock3,
    GraduationCap,
    PlayCircle,
    Sparkles,
    Users,
    Video,
} from 'lucide-react'
import { toPublicStorageUrl } from '@/lib/supabase-image'

export const dynamic = 'force-dynamic'

interface Props
{
    params: Promise<{ courseId: string }>
}

export default async function CourseDetailPage({ params }: Props)
{
    const { courseId } = await params

    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

    const result = await fetchCourseById(courseId)

    if (!result) notFound()

    const { course, enrollment, sections } = result

    const outline = Array.isArray(course.course_outline)
        ? course.course_outline
        : []

    // Where "Continue learning" should resume — the learner's last-watched
    // lesson if any, otherwise the first lesson in the course.
    const firstLessonId = sections[0]?.lessons[0]?.id ?? null
    const hasStarted = enrollment?.last_lesson_id != null
    const resumeLessonId = enrollment?.last_lesson_id ?? firstLessonId

    const totalLessons = outline.reduce(
        (total, section) =>
            total +
            (Array.isArray(section.lessons)
                ? section.lessons.length
                : 0),
        0
    )

    const totalSections = outline.length
    const isEnrolled = enrollment !== null
    const isCreator = profile?.id === course.user_id

    const amount =
        typeof course.amount === 'number'
            ? course.amount
            : 0

    const coverUrl = toPublicStorageUrl(course.cover_image_url)

    const instructorName =
        course.instructor?.display_name?.trim() ||
        'Hubnovo Instructor'

    const instructorInitial =
        instructorName.charAt(0).toUpperCase()

    return (
        <main className="min-h-screen bg-background">

            {/* ─────────────────────────────────────────────────────────────
                COURSE HERO
            ───────────────────────────────────────────────────────────── */}

            <section className="text-white" style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}>

                <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 lg:py-12">

                    {/* Breadcrumb */}
                    <div className="mb-7 flex items-center gap-2 text-sm text-white/60">

                        <Link
                            href="/app/learn"
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Learn
                        </Link>

                        <span className="text-white/30">/</span>

                        <span className="truncate">
                            {course.category_name || 'Course'}
                        </span>

                    </div>

                    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

                        {/* Hero copy */}
                        <div className="max-w-3xl">

                            {course.category_name && (
                                <div className="mb-4">
                                    <span className="
                                        inline-flex items-center
                                        rounded-md
                                        bg-white/15
                                        px-3 py-1.5
                                        text-xs font-semibold
                                        text-cyan-200
                                    ">
                                        {course.category_name}
                                    </span>
                                </div>
                            )}

                            <h1 className="
                                font-display
                                text-3xl font-black
                                leading-tight tracking-tight
                                sm:text-4xl lg:text-[42px]
                            ">
                                {course.title}
                            </h1>

                            {course.description && (
                                <p className="
                                    mt-5 max-w-2xl
                                    text-base leading-7
                                    text-white/70
                                    sm:text-lg
                                ">
                                    {course.description}
                                </p>
                            )}

                            {/* Course meta */}
                            <div className="
                                mt-6 flex flex-wrap
                                items-center gap-x-5 gap-y-3
                                text-sm text-white/70
                            ">

                                <span className="inline-flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-cyan-200" />
                                    {totalLessons} lesson
                                    {totalLessons !== 1 ? 's' : ''}
                                </span>

                                {totalSections > 0 && (
                                    <span className="inline-flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-cyan-200" />
                                        {totalSections} section
                                        {totalSections !== 1 ? 's' : ''}
                                    </span>
                                )}

                                <span className="inline-flex items-center gap-2">
                                    <Clock3 className="h-4 w-4 text-cyan-200" />
                                    Self-paced
                                </span>

                                {isEnrolled && (
                                    <span className="
                                        inline-flex items-center gap-1.5
                                        font-semibold text-emerald-300
                                    ">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Enrolled
                                    </span>
                                )}

                            </div>

                            {/* Instructor */}
                            <div className="
                                mt-7 flex items-center gap-3
                            ">

                                <Avatar className="h-9 w-9 border border-white/10">
                                    <AvatarImage
                                        src={
                                            course.instructor?.avatar_url ??
                                            undefined
                                        }
                                    />

                                    <AvatarFallback className="
                                        bg-white/15
                                        text-sm font-bold
                                        text-white
                                    ">
                                        {instructorInitial}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        Created by {instructorName}
                                    </p>

                                    <p className="text-xs text-white/50">
                                    Hubnovo instructor
                                    </p>
                                </div>

                            </div>

                        </div>

                        {/* Desktop preview card placeholder space.
                            Actual card is positioned below on desktop. */}

                        <div className="hidden lg:block" />

                    </div>
                </div>
            </section>


            {/* ─────────────────────────────────────────────────────────────
                MAIN CONTENT
            ───────────────────────────────────────────────────────────── */}

            <div className="
                mx-auto max-w-6xl
                px-4 py-7
                lg:px-6 lg:py-10
            ">

                <div className="
                    grid items-start
                    gap-8
                    lg:grid-cols-[1fr_360px]
                ">

                    {/* ═════════════════════════════════════════════════════
                        LEFT COLUMN
                    ═════════════════════════════════════════════════════ */}

                    <div className="min-w-0 space-y-7">

                        {/* Preview */}
                        <section className="
                            overflow-hidden
                            rounded-xl
                            border border-border
                            bg-card
                            shadow-sm
                        ">

                            <div className="
                                relative aspect-video
                                overflow-hidden
                                bg-slate-950
                            ">

                                {coverUrl ? (
                                    <Image
                                        src={coverUrl}
                                        alt={course.title}
                                        fill
                                        priority
                                        className="object-cover"
                                        sizes="
                                            (max-width: 1024px) 100vw,
                                            720px
                                        "
                                        unoptimized={
                                            coverUrl.includes('supabase.co')
                                        }
                                    />
                                ) : (
                                    <div className="
                                        absolute inset-0
                                        flex items-center
                                        justify-center
                                    " style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}>
                                        <GraduationCap className="
                                            h-20 w-20
                                            text-white/20
                                        " />
                                    </div>
                                )}

                                {/* Dark overlay */}
                                <div className="
                                    absolute inset-0
                                    bg-gradient-to-t
                                    from-black/55
                                    via-transparent
                                    to-black/10
                                " />

                                {/* Preview button */}
                                {course.video_url && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card shadow-xl transition-transform hover:scale-105">
                                            <PlayCircle className="h-8 w-8 fill-primary text-primary" />
                                        </div>
                                    </div>
                                )}

                                {!course.video_url && (
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md bg-black px-3 py-1 text-xs font-medium text-white">
                                        <GraduationCap className="h-4 w-4" />
                                        <span>Course preview</span>
                                    </div>
                                )}
                            </div>

                        </section>


                        {/* What you'll learn */}
                        <section className="
                            rounded-xl
                            border border-border
                            bg-card
                            p-6
                            shadow-sm
                        ">

                            <div className="mb-5 flex items-center gap-2">
                                <Sparkles className="
                                    h-5 w-5
                                    text-primary
                                " />

                                <h2 className="
                                    font-display
                                    text-xl font-bold
                                    text-foreground
                                ">
                                    What you&apos;ll learn
                                </h2>
                            </div>

                            <div className="
                                grid gap-x-8 gap-y-3
                                sm:grid-cols-2
                            ">

                                <LearningPoint>
                                    Build practical skills through
                                    structured lessons
                                </LearningPoint>

                                <LearningPoint>
                                    Learn at your own pace from anywhere
                                </LearningPoint>

                                <LearningPoint>
                                    Apply what you learn to real-world
                                    opportunities
                                </LearningPoint>

                                <LearningPoint>
                                    Build skills that can help you earn
                                </LearningPoint>

                            </div>

                        </section>


                        {/* About */}
                        {course.description && (
                            <section className="
                                rounded-xl
                                border border-border
                                bg-card
                                p-6
                                shadow-sm
                            ">

                                <h2 className="
                                    font-display
                                    text-xl font-bold
                                    text-foreground
                                ">
                                    About this course
                                </h2>

                                <div className="
                                    mt-4
                                    text-sm leading-7
                                    text-muted-foreground
                                ">
                                    <p className="whitespace-pre-line">
                                        {course.description}
                                    </p>
                                </div>

                            </section>
                        )}


                        {/* ═════════════════════════════════════════════════
                            CURRICULUM
                        ═════════════════════════════════════════════════ */}

                        {outline.length > 0 && (
                            <section className="
                                overflow-hidden
                                rounded-xl
                                border border-border
                                bg-card
                                shadow-sm
                            ">

                                <div className="
                                    border-b border-border
                                    px-6 py-5
                                ">

                                    <h2 className="
                                        font-display
                                        text-xl font-bold
                                        text-foreground
                                    ">
                                        Course content
                                    </h2>

                                    <p className="
                                        mt-1 text-sm
                                        text-muted-foreground
                                    ">
                                        {totalSections} section
                                        {totalSections !== 1 ? 's' : ''} ·{' '}
                                        {totalLessons} lesson
                                        {totalLessons !== 1 ? 's' : ''}
                                    </p>

                                </div>

                                <div className="divide-y divide-border">

                                    {outline.map((section, si) => {

                                        const lessons =
                                            Array.isArray(section.lessons)
                                                ? section.lessons
                                                : []

                                        return (
                                            <details
                                                key={si}
                                                open={si === 0}
                                                className="group"
                                            >

                                                <summary className="
                                                    flex cursor-pointer
                                                    list-none items-center
                                                    gap-4
                                                    px-6 py-4
                                                    transition-colors
                                                    hover:bg-muted
                                                ">

                                                    <div className="
                                                        flex h-8 w-8
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-lg
                                                        bg-primary/10
                                                        text-sm font-bold
                                                        text-primary
                                                    ">
                                                        {si + 1}
                                                    </div>

                                                    <div className="min-w-0 flex-1">

                                                        <p className="
                                                            truncate
                                                            text-sm font-semibold
                                                            text-foreground
                                                        ">
                                                            {section.title}
                                                        </p>

                                                        <p className="
                                                            mt-0.5 text-xs
                                                            text-muted-foreground
                                                        ">
                                                            {lessons.length} lesson
                                                            {lessons.length !== 1
                                                                ? 's'
                                                                : ''}
                                                        </p>

                                                    </div>

                                                    <ChevronDown className="
                                                        h-4 w-4
                                                        shrink-0
                                                        text-muted-foreground
                                                        transition-transform
                                                        group-open:rotate-180
                                                    " />

                                                </summary>

                                                <div className="
                                                    border-t
                                                    border-border
                                                    bg-muted/50
                                                    px-6 py-3
                                                ">

                                                    <div className="space-y-1">

                                                        {lessons.map(
                                                            (lesson, li) => (
                                                                <div
                                                                    key={li}
                                                                    className="
                                                                        flex
                                                                        items-center
                                                                        gap-3
                                                                        rounded-lg
                                                                        px-3 py-2.5
                                                                        text-sm
                                                                        text-muted-foreground
                                                                    "
                                                                >

                                                                    <span className="
                                                                        flex h-6 w-6
                                                                        shrink-0
                                                                        items-center
                                                                        justify-center
                                                                        rounded-full
                                                                        bg-card
                                                                        text-[10px]
                                                                        font-bold
                                                                        text-muted-foreground
                                                                        ring-1
                                                                        ring-border
                                                                    ">
                                                                        {li + 1}
                                                                    </span>

                                                                    <span className="
                                                                        min-w-0
                                                                        flex-1
                                                                        truncate
                                                                    ">
                                                                        {lesson.title}
                                                                    </span>

                                                                    {lesson.video_url && (
                                                                        <Video className="
                                                                            h-4 w-4
                                                                            shrink-0
                                                                            text-primary
                                                                        " />
                                                                    )}

                                                                </div>
                                                            )
                                                        )}

                                                    </div>

                                                </div>

                                            </details>
                                        )
                                    })}

                                </div>

                            </section>
                        )}


                        {/* Instructor */}
                        <section className="
                            rounded-xl
                            border border-border
                            bg-card
                            p-6
                            shadow-sm
                        ">

                            <h2 className="
                                font-display
                                text-xl font-bold
                                text-foreground
                            ">
                                Instructor
                            </h2>

                            <div className="
                                mt-5 flex items-start gap-4
                            ">

                                <Avatar className="
                                    h-16 w-16
                                    shrink-0
                                ">
                                    <AvatarImage
                                        src={
                                            course.instructor?.avatar_url ??
                                            undefined
                                        }
                                    />

                                    <AvatarFallback className="
                                        bg-primary/10
                                        text-xl font-bold
                                        text-primary
                                    ">
                                        {instructorInitial}
                                    </AvatarFallback>
                                </Avatar>

                                <div>

                                    <h3 className="
                                        text-base font-bold
                                        text-foreground
                                    ">
                                        {instructorName}
                                    </h3>

                                    <p className="
                                        mt-1 text-sm
                                        text-muted-foreground
                                    ">
                                        Hubnovo course instructor
                                    </p>

                                    <div className="
                                        mt-3 flex flex-wrap
                                        gap-x-5 gap-y-2
                                        text-xs text-muted-foreground
                                    ">

                                        <span className="
                                            inline-flex items-center gap-1.5
                                        ">
                                            <Users className="h-3.5 w-3.5" />
                                            Hubnovo community
                                        </span>

                                        <span className="
                                            inline-flex items-center gap-1.5
                                        ">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            Course creator
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </section>


                        {/* Learn, Build, Earn */}
                        <section className="
                            overflow-hidden
                            rounded-xl
                            p-6
                            text-white
                        " style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}>

                            <div className="
                                flex items-start gap-4
                            ">

                                <div className="
                                    flex h-10 w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-white/10
                                ">
                                    <Sparkles className="
                                        h-5 w-5
                                        text-cyan-200
                                    " />
                                </div>

                                <div>

                                    <h2 className="
                                        font-display
                                        text-lg font-bold
                                    ">
                                        Learn. Build. Earn.
                                    </h2>

                                    <p className="
                                        mt-1 text-sm leading-6
                                        text-white/70
                                    ">
                                        Hubnovo connects learning
                                        with practical opportunities,
                                        portfolios, marketplace access
                                        and earning potential.
                                    </p>

                                </div>

                            </div>

                        </section>

                    </div>


                    {/* ═════════════════════════════════════════════════════
                        RIGHT — STICKY ENROL CARD
                    ═════════════════════════════════════════════════════ */}

                    <aside className="lg:sticky lg:top-6">

                        <div className="
                            overflow-hidden
                            rounded-xl
                            border border-border
                            bg-card
                            shadow-lg
                        ">

                            {/* Mini image */}
                            <div className="
                                relative aspect-video
                                overflow-hidden
                                bg-muted
                            ">

                                {coverUrl ? (
                                    <Image
                                        src={coverUrl}
                                        alt={course.title}
                                        fill
                                        className="object-cover"
                                        sizes="360px"
                                        unoptimized={
                                            coverUrl.includes('supabase.co')
                                        }
                                    />
                                ) : (
                                    <div className="
                                        absolute inset-0
                                        flex items-center justify-center
                                    " style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}>
                                        <GraduationCap className="
                                            h-14 w-14
                                            text-white/20
                                        " />
                                    </div>
                                )}

                                {course.video_url && (
                                    <div className="
                                        absolute inset-0
                                        flex items-center
                                        justify-center
                                    ">
                                        <div className="
                                            flex h-12 w-12
                                            items-center justify-center
                                            rounded-full
                                            bg-white/95
                                            shadow-lg
                                        ">
                                            <PlayCircle className="
                                                h-6 w-6
                                                fill-primary
                                                text-primary
                                            " />
                                        </div>
                                    </div>
                                )}

                            </div>


                            <div className="p-6">

                                {/* Price */}
                                <div className="mb-5">

                                    <div className="
                                        flex items-baseline gap-2
                                    ">

                                        <span className="
                                            text-3xl font-black
                                            tracking-tight
                                            text-foreground
                                        ">
                                            {course.is_free
                                                ? 'Free'
                                                : `₦${amount.toLocaleString(
                                                    'en-NG'
                                                )}`}
                                        </span>

                                    </div>

                                    {course.is_free && (
                                        <p className="
                                            mt-1 text-xs
                                            text-muted-foreground
                                        ">
                                            No credit card required
                                        </p>
                                    )}

                                </div>


                                {/* Enrol */}
                                <EnrolButton
                                    courseId={courseId}
                                    amount={amount}
                                    isFree={course.is_free}
                                    alreadyEnrolled={isEnrolled}
                                    hasStarted={hasStarted}
                                    resumeLessonId={resumeLessonId}
                                />


                                {/* Includes */}
                                <div className="
                                    mt-6
                                    border-t border-border
                                    pt-5
                                ">

                                    <h3 className="
                                        mb-4 text-sm font-bold
                                        text-foreground
                                    ">
                                        This course includes:
                                    </h3>

                                    <div className="space-y-3">

                                        <IncludeItem
                                            icon={
                                                <BookOpen className="
                                                    h-4 w-4
                                                " />
                                            }
                                        >
                                            {totalLessons} on-demand lesson
                                            {totalLessons !== 1
                                                ? 's'
                                                : ''}
                                        </IncludeItem>

                                        <IncludeItem
                                            icon={
                                                <GraduationCap className="
                                                    h-4 w-4
                                                " />
                                            }
                                        >
                                            {totalSections} course section
                                            {totalSections !== 1
                                                ? 's'
                                                : ''}
                                        </IncludeItem>

                                        <IncludeItem
                                            icon={
                                                <Clock3 className="
                                                    h-4 w-4
                                                " />
                                            }
                                        >
                                            Self-paced learning
                                        </IncludeItem>

                                        {course.video_url && (
                                            <IncludeItem
                                                icon={
                                                    <Video className="
                                                        h-4 w-4
                                                    " />
                                                }
                                            >
                                                Preview video
                                            </IncludeItem>
                                        )}

                                    </div>

                                </div>


                                {/* Creator */}
                                {isCreator && (
                                    <Link
                                        href="/app/learn/create"
                                        className="
                                            mt-6 flex w-full
                                            items-center justify-center
                                            rounded-lg
                                            border border-border
                                            px-4 py-2.5
                                            text-sm font-semibold
                                            text-foreground
                                            transition-colors
                                            hover:bg-muted
                                        "
                                    >
                                        Edit course
                                    </Link>
                                )}

                            </div>

                        </div>


                        {/* Trust note */}
                        <div className="
                            mt-4
                            rounded-xl
                            border border-primary/20
                            bg-primary/5
                            p-4
                        ">

                            <div className="
                                flex items-start gap-3
                                ">

                                <CheckCircle2 className="
                                mt-0.5
                                h-4 w-4
                                shrink-0
                                text-primary
                                " />
                                <p className="text-xs leading-5 text-primary">
                                Start learning immediately and progress at your own pace.
                                </p>

                            </div>

                        </div>

                    </aside>

                </div>

            </div>

        </main>
    )
}


/* ─────────────────────────────────────────────────────────────────────────────
   Small UI components
───────────────────────────────────────────────────────────────────────────── */

function LearningPoint({
    children,
}: {
    children: React.ReactNode
})
{
    return (
        <div className="
            flex items-start gap-3
            text-sm leading-6
            text-muted-foreground
        ">
            <div className="
                mt-1 flex h-5 w-5
                shrink-0 items-center justify-center
                rounded-full
                bg-primary/10
            ">
                <Check className="
                    h-3 w-3
                    text-primary
                " />
            </div>

            <span>{children}</span>
        </div>
    )
}


function IncludeItem({
    icon,
    children,
}: {
    icon: React.ReactNode
    children: React.ReactNode
})
{
    return (
        <div className="
            flex items-center gap-3
            text-sm text-muted-foreground
        ">
            <span className="
                flex h-7 w-7
                shrink-0
                items-center justify-center
                rounded-lg
                bg-primary/10
                text-primary
            ">
                {icon}
            </span>

            <span>{children}</span>
        </div>
    )
}