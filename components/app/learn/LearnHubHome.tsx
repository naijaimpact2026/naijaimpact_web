
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    GraduationCap,
    Plus,
    Search,
    Briefcase,
    Code2,
    DollarSign,
    Bot,
    Rocket,
    Hammer,
    BookOpen,
    CheckCircle2,
    Flame,
    Target,
    TrendingUp,
    Users,
    Award,
    BarChart2,
    Play,
    ChevronRight,
    Clock,
    Star,
} from 'lucide-react'

import { fetchCourses } from '@/lib/actions/learn'
import type { Course, Category } from '@/lib/actions/learn'
import { toPublicStorageUrl } from '@/lib/supabase-image'

interface Props {
    initialCourses: Course[]
    initialNextCursor: string | null
    categories: Category[]
    activeCategoryId: string | null
    displayName: string
    avatarUrl: string | null
    enrolledCount: number
    completedCount: number
    inProgressCourseIds: string[]
    completedCourseIds: string[]
    view?: string | null
}

type ViewMode =
    | 'catalogue'
    | 'my-courses'
    | 'certificates'
    | 'tracks'
    | 'categories'
    | 'instructors'
    | 'streak'

interface Track {
    id: string
    title: string
    description: string
    icon: typeof Briefcase
    color: string
    keywords: string[]
}

const TRACKS: Track[] = [
    {
        id: 'career',
        title: 'Career & Professional Skills',
        description:
            'Build practical skills that help you become more employable and effective at work.',
        icon: Briefcase,
        color: 'emerald',
        keywords: [
            'career',
            'professional',
            'leadership',
            'management',
            'business',
            'communication',
        ],
    },
    {
        id: 'technology',
        title: 'Technology & Coding',
        description:
            'Learn modern technology, software development, AI and digital skills.',
        icon: Code2,
        color: 'blue',
        keywords: [
            'technology',
            'coding',
            'programming',
            'software',
            'developer',
            'web',
            'computer',
        ],
    },
    {
        id: 'finance',
        title: 'Finance & Entrepreneurship',
        description:
            'Develop financial literacy, business and entrepreneurial skills.',
        icon: DollarSign,
        color: 'amber',
        keywords: [
            'finance',
            'financial',
            'business',
            'entrepreneur',
            'entrepreneurship',
            'money',
            'accounting',
        ],
    },
    {
        id: 'ai',
        title: 'AI & Future Skills',
        description:
            'Understand artificial intelligence and the skills shaping the future of work.',
        icon: Bot,
        color: 'violet',
        keywords: [
            'ai',
            'artificial intelligence',
            'machine learning',
            'automation',
            'future',
            'chatgpt',
        ],
    },
    {
        id: 'innovation',
        title: 'Innovation & Startups',
        description:
            'Turn ideas into projects, products and sustainable ventures.',
        icon: Rocket,
        color: 'rose',
        keywords: [
            'startup',
            'innovation',
            'product',
            'venture',
            'founder',
            'business',
        ],
    },
    {
        id: 'practical',
        title: 'Practical & Technical Skills',
        description:
            'Learn hands-on skills you can apply immediately in real-world situations.',
        icon: Hammer,
        color: 'orange',
        keywords: [
            'technical',
            'practical',
            'hands-on',
            'skills',
            'construction',
            'craft',
        ],
    },
]

const PIPELINE = [
    {
        step: '01',
        title: 'Learn',
        description: 'Take practical courses taught by experienced instructors.',
        icon: BookOpen,
    },
    {
        step: '02',
        title: 'Practice',
        description: 'Apply what you learn through projects and real-world tasks.',
        icon: Hammer,
    },
    {
        step: '03',
        title: 'Earn',
        description: 'Build valuable skills and unlock Learn-to-Earn rewards.',
        icon: TrendingUp,
    },
    {
        step: '04',
        title: 'Impact',
        description: 'Use your skills to create opportunities and positive impact.',
        icon: Target,
    },
]

function fmtNGN(amount: number | null | undefined): string {
    if (!amount || amount <= 0) {
        return 'Free'
    }

    return `₦${amount.toLocaleString('en-NG')}`
}

function getCourseImage(course: Course): string | null {
    if (!course.cover_image_url) {
        return null
    }

    return toPublicStorageUrl(course.cover_image_url)
}

function courseMatchesSearch(
    course: Course,
    search: string
): boolean {
    if (!search.trim()) {
        return true
    }

    const query = search.toLowerCase().trim()

    const searchable = [
        course.title,
        course.description,
        course.category_name,
        course.instructor?.display_name,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

    return searchable.includes(query)
}

function courseMatchesTrack(
    course: Course,
    track: Track
): boolean {
    const searchable = [
        course.title,
        course.description,
        course.category_name,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

    return track.keywords.some((keyword) =>
        searchable.includes(keyword.toLowerCase())
    )
}

function CourseCard({
    course,
    enrolled,
    completed,
}: {
    course: Course
    enrolled: boolean
    completed: boolean
}) {
    const imageUrl = getCourseImage(course)

    return (
        <Link
            href={`/app/learn/${course.id}`}
            className="
                group
                flex
                min-w-0
                flex-col
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-white
                shadow-sm
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:border-emerald-200
                hover:shadow-md
            "
        >
            {/* Cover */}

            <div className="relative aspect-video overflow-hidden bg-slate-100">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={course.title}
                        fill
                        sizes="
                            (max-width: 640px) 100vw,
                            (max-width: 1024px) 50vw,
                            25vw
                        "
                        className="
                            object-cover
                            transition-transform
                            duration-300
                            group-hover:scale-105
                        "
                    />
                ) : (
                    <div
                        className="
                            flex
                            h-full
                            w-full
                            items-center
                            justify-center
                            bg-gradient-to-br
                            from-emerald-50
                            to-slate-100
                        "
                    >
                        <GraduationCap className="h-12 w-12 text-emerald-300" />
                    </div>
                )}

                {/* Free / price */}

                <div className="absolute right-2 top-2">
                    <span
                        className="
                            rounded-md
                            bg-white/95
                            px-2
                            py-1
                            text-xs
                            font-bold
                            text-slate-900
                            shadow-sm
                            backdrop-blur
                        "
                    >
                        {course.is_free
                            ? 'Free'
                            : fmtNGN(course.amount)}
                    </span>
                </div>

                {/* Completed */}

                {completed && (
                    <div className="absolute left-2 top-2">
                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1
                                rounded-md
                                bg-emerald-600
                                px-2
                                py-1
                                text-[11px]
                                font-bold
                                text-white
                                shadow-sm
                            "
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed
                        </span>
                    </div>
                )}

                {/* Play overlay */}

                <div
                    className="
                        absolute
                        inset-0
                        flex
                        items-center
                        justify-center
                        bg-slate-950/0
                        transition-colors
                        group-hover:bg-slate-950/20
                    "
                >
                    <div
                        className="
                            flex
                            h-11
                            w-11
                            scale-90
                            items-center
                            justify-center
                            rounded-full
                            bg-white
                            opacity-0
                            shadow-lg
                            transition-all
                            group-hover:scale-100
                            group-hover:opacity-100
                        "
                    >
                        <Play className="ml-0.5 h-5 w-5 fill-emerald-600 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Content */}

            <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                    {course.category_name ? (
                        <span
                            className="
                                truncate
                                text-[11px]
                                font-bold
                                uppercase
                                tracking-wide
                                text-emerald-700
                            "
                        >
                            {course.category_name}
                        </span>
                    ) : (
                        <span />
                    )}

                    {enrolled && !completed && (
                        <span
                            className="
                                shrink-0
                                rounded-full
                                bg-emerald-50
                                px-2
                                py-0.5
                                text-[10px]
                                font-semibold
                                text-emerald-700
                            "
                        >
                            In progress
                        </span>
                    )}
                </div>

                <h3
                    className="
                        line-clamp-2
                        min-h-[2.75rem]
                        text-sm
                        font-bold
                        leading-5
                        text-slate-900
                        transition-colors
                        group-hover:text-emerald-700
                    "
                >
                    {course.title}
                </h3>

                {course.description && (
                    <p
                        className="
                            mt-2
                            line-clamp-2
                            text-xs
                            leading-5
                            text-slate-500
                        "
                    >
                        {course.description}
                    </p>
                )}

                <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <div
                                className="
                                    flex
                                    h-6
                                    w-6
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-slate-100
                                "
                            >
                                <Users className="h-3.5 w-3.5 text-slate-500" />
                            </div>

                            <span className="truncate text-xs text-slate-500">
                                {course.instructor?.display_name ??
                                    'Hubnovo Instructor'}
                            </span>
                        </div>

                        <ChevronRight
                            className="
                                h-4
                                w-4
                                shrink-0
                                text-slate-300
                                transition-transform
                                group-hover:translate-x-0.5
                                group-hover:text-emerald-600
                            "
                        />
                    </div>
                </div>
            </div>
        </Link>
    )
}

function SkeletonCard() {
    return (
        <div
            className="
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-white
            "
        >
            <div className="aspect-video animate-pulse bg-slate-100" />

            <div className="space-y-3 p-4">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
        </div>
    )
}

export default function LearnHubHome({
    initialCourses,
    initialNextCursor,
    categories,
    activeCategoryId,
    displayName,
    avatarUrl,
    enrolledCount,
    completedCount,
    inProgressCourseIds,
    completedCourseIds,
    view,
}: Props) {
    const [courses, setCourses] = useState<Course[]>(initialCourses)
    const [nextCursor, setNextCursor] = useState<string | null>(
        initialNextCursor
    )

    const [loadingMore, setLoadingMore] = useState(false)

    const [search, setSearch] = useState('')
    const [activeTrack, setActiveTrack] = useState<string | null>(null)

    const [activeView, setActiveView] = useState<ViewMode>(
        (view as ViewMode) || 'catalogue'
    )

    const enrolledSet = useMemo(
        () => new Set(inProgressCourseIds),
        [inProgressCourseIds]
    )

    const completedSet = useMemo(
        () => new Set(completedCourseIds),
        [completedCourseIds]
    )

    const filteredCourses = useMemo(() => {
        let result = courses

        if (activeTrack) {
            const track = TRACKS.find(
                (item) => item.id === activeTrack
            )

            if (track) {
                result = result.filter((course) =>
                    courseMatchesTrack(course, track)
                )
            }
        }

        return result.filter((course) =>
            courseMatchesSearch(course, search)
        )
    }, [courses, activeTrack, search])

    const myCourses = useMemo(() => {
        return courses.filter(
            (course) =>
                enrolledSet.has(course.id) ||
                completedSet.has(course.id)
        )
    }, [courses, enrolledSet, completedSet])

    const completedCourses = useMemo(() => {
        return courses.filter((course) =>
            completedSet.has(course.id)
        )
    }, [courses, completedSet])

    async function loadMore() {
        if (!nextCursor || loadingMore) {
            return
        }

        setLoadingMore(true)

        try {
            const result = await fetchCourses(
                nextCursor,
                24,
                activeCategoryId
            )

            setCourses((current) => {
                const existingIds = new Set(
                    current.map((course) => course.id)
                )

                const freshCourses = result.courses.filter(
                    (course) => !existingIds.has(course.id)
                )

                return [...current, ...freshCourses]
            })

            setNextCursor(result.nextCursor)
        } catch (error) {
            console.error('Failed to load more courses:', error)
        } finally {
            setLoadingMore(false)
        }
    }

    function setView(viewName: ViewMode) {
        setActiveView(viewName)
        setActiveTrack(null)
        setSearch('')
    }

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ─────────────────────────────────────────────────────
                TOP LEARNING NAV
            ───────────────────────────────────────────────────── */}

            <div className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
                    <div
                        className="
                            flex
                            min-h-16
                            flex-wrap
                            items-center
                            gap-4
                            py-3
                        "
                    >
                        <Link
                            href="/app/learn"
                            className="flex shrink-0 items-center gap-2"
                        >
                            <div
                                className="
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-lg
                                    bg-emerald-600
                                "
                            >
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>

                            <div className="hidden sm:block">
                                <p className="text-sm font-extrabold text-slate-900">
                                    Hubnovo
                                </p>

                                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                                    Learn
                                </p>
                            </div>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setView('catalogue')}
                            className="
                                hidden
                                items-center
                                gap-1.5
                                text-sm
                                font-semibold
                                text-slate-600
                                hover:text-emerald-700
                                lg:flex
                            "
                        >
                            Explore
                            <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                        </button>

                        <div
                            className="
                            relative
                            w-full
                            min-w-0
                            flex-1
                            sm:max-w-md
                        "
                        >
                            <Search
                                className="
                                    pointer-events-none
                                    absolute
                                    left-3
                                    top-1/2
                                    h-4
                                    w-4
                                    -translate-y-1/2
                                    text-slate-400
                                "
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="What do you want to learn?"
                                className="
                                    h-10
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    pl-9
                                    pr-4
                                    text-sm
                                    text-slate-900
                                    outline-none
                                    transition
                                    placeholder:text-slate-400
                                    focus:border-emerald-400
                                    focus:bg-white
                                    focus:ring-2
                                    focus:ring-emerald-100
                                "
                            />
                        </div>

                        <nav className="hidden items-center gap-5 md:flex">
                            <button
                                type="button"
                                onClick={() => setView('my-courses')}
                                className="
                                    text-sm
                                    font-semibold
                                    text-slate-600
                                    hover:text-emerald-700
                                "
                            >
                                My Learning
                            </button>

                            <button
                                type="button"
                                onClick={() => setView('tracks')}
                                className="
                                    text-sm
                                    font-semibold
                                    text-slate-600
                                    hover:text-emerald-700
                                "
                            >
                                Career Tracks
                            </button>
                        </nav>

                        <div className="ml-auto flex items-center gap-3">
                            <Link
                                href="/app/learn/create"
                                className="
                                    hidden
                                    items-center
                                    gap-1.5
                                    rounded-lg
                                    px-3
                                    py-2
                                    text-sm
                                    font-semibold
                                    text-slate-600
                                    hover:bg-slate-50
                                    hover:text-emerald-700
                                    sm:flex
                                "
                            >
                                <Plus className="h-4 w-4" />
                                Teach
                            </Link>

                            <button
                                type="button"
                                onClick={() => setView('streak')}
                                className="
                                    hidden
                                    items-center
                                    gap-1
                                    rounded-lg
                                    px-2
                                    py-2
                                    text-sm
                                    font-semibold
                                    text-orange-600
                                    hover:bg-orange-50
                                    sm:flex
                                "
                            >
                                <Flame className="h-4 w-4" />
                                Streak
                            </button>

                            <div
                                className="
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    overflow-hidden
                                    rounded-full
                                    bg-emerald-100
                                    text-xs
                                    font-bold
                                    text-emerald-700
                                "
                            >
                                {avatarUrl ? (
                                    <Image
                                        src={toPublicStorageUrl(avatarUrl)}
                                        alt={displayName}
                                        width={36}
                                        height={36}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    displayName
                                        .slice(0, 1)
                                        .toUpperCase()
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────
                HERO
            ───────────────────────────────────────────────────── */}

            <section className="border-b border-slate-200 bg-white">
                <div
                    className="
                        mx-auto
                        max-w-[1600px]
                        px-4
                        py-7
                        sm:px-6
                        lg:px-8
                        lg:py-14
                    "
                >
                    <div
                        className="
                            grid
                            gap-10
                            lg:grid-cols-[1fr_360px]
                            lg:items-center
                        "
                    >
                        <div className="max-w-3xl">
                            <div
                                className="
                                    mb-4
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-full
                                    bg-emerald-50
                                    px-3
                                    py-1.5
                                    text-xs
                                    font-bold
                                    text-emerald-700
                                "
                            >
                                <Flame className="h-3.5 w-3.5" />
                                Learn. Earn. Create Impact.
                            </div>

                            <h1
                                className="
                                    text-2xl
                                    font-black
                                    tracking-tight
                                    text-slate-950
                                    sm:text-4xl
                                    lg:text-5xl
                                "
                            >
                                Keep learning,{' '}
                                <span className="text-emerald-600">
                                    {displayName}
                                </span>
                                .
                            </h1>

                            <p
                                className="
                                    mt-4
                                    max-w-2xl
                                    text-base
                                    leading-7
                                    text-slate-600
                                    sm:text-lg
                                "
                            >
                                Build practical skills, earn recognition
                                and create opportunities through learning
                                designed for Africa's future.
                            </p>

                            <div className="mt-7 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setView('catalogue')
                                    }
                                    className="
                                        inline-flex
                                        w-full
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-lg
                                        bg-emerald-600
                                        px-5
                                        py-3
                                        text-sm
                                        font-bold
                                        text-white
                                        shadow-sm
                                        hover:bg-emerald-700
                                        sm:w-auto
                                    "
                                >
                                    Explore courses
                                    <ChevronRight className="h-4 w-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setView('my-courses')
                                    }
                                    className="
                                        inline-flex
                                        w-full
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-lg
                                        border
                                        border-slate-200
                                        bg-white
                                        px-5
                                        py-3
                                        text-sm
                                        font-bold
                                        text-slate-700
                                        hover:border-emerald-200
                                        hover:text-emerald-700
                                        sm:w-auto
                                    "
                                >
                                    <BookOpen className="h-4 w-4" />
                                    My learning
                                </button>
                            </div>
                        </div>

                        {/* Stats */}

                        <div
                            className="
                                grid
                                grid-cols-2
                                gap-3
                            "
                        >
                            <button
                                type="button"
                                onClick={() => setView('my-courses')}
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    p-4
                                    text-left
                                    shadow-sm
                                    transition
                                    hover:border-emerald-200
                                    hover:shadow-md
                                    sm:p-5
                                "
                            >
                                <BookOpen className="h-5 w-5 text-emerald-600" />

                                <p className="mt-4 text-2xl font-black text-slate-900">
                                    {enrolledCount}
                                </p>

                                <p className="text-xs font-medium text-slate-500">
                                    Courses enrolled
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setView('certificates')
                                }
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    p-4
                                    text-left
                                    shadow-sm
                                    transition
                                    hover:border-emerald-200
                                    hover:shadow-md
                                    sm:p-5
                                "
                            >
                                <Award className="h-5 w-5 text-amber-500" />

                                <p className="mt-4 text-2xl font-black text-slate-900">
                                    {completedCount}
                                </p>

                                <p className="text-xs font-medium text-slate-500">
                                    Certificates earned
                                </p>
                            </button>

                            <div
                                className="
                                    col-span-2
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    p-4
                                "
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-emerald-600" />

                                        <span className="text-xs font-bold text-slate-700">
                                            Keep your learning momentum
                                        </span>
                                    </div>

                                    <span className="text-xs font-bold text-emerald-700">
                                        {completedCount > 0
                                            ? 'Great work'
                                            : 'Start today'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────────────────
                CONTENT
            ───────────────────────────────────────────────────── */}

            <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">

                {/* View navigation */}

                <div
                    className="
                        mb-8
                        flex
                        gap-1
                        overflow-x-auto
                        border-b
                        border-slate-200
                    "
                >
                    {[
                        ['catalogue', 'All Courses'],
                        ['my-courses', 'My Learning'],
                        ['tracks', 'Career Tracks'],
                        ['categories', 'Categories'],
                        ['certificates', 'Certificates'],
                        ['instructors', 'Instructors'],
                        ['streak', 'My Streak'],
                    ].map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() =>
                                setView(id as ViewMode)
                            }
                            className={`
                                whitespace-nowrap
                                border-b-2
                                px-3
                                py-3
                                text-xs
                                font-semibold
                                transition-colors
                                sm:px-4
                                sm:text-sm
                                ${
                                    activeView === id
                                        ? 'border-emerald-600 text-emerald-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                }
                            `}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ─────────────────────────────────────────────
                    CATALOGUE
                ───────────────────────────────────────────── */}

                {activeView === 'catalogue' && (
                    <>
                        <section className="mb-8">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                        Learning marketplace
                                    </p>

                                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                                        Explore courses
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Learn practical skills from experienced instructors.
                                    </p>
                                </div>

                                <span className="hidden text-sm text-slate-400 sm:block">
                                    {filteredCourses.length} courses
                                </span>
                            </div>
                        </section>

                        {/* Categories */}

                        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
                            <button
                                type="button"
                                onClick={() => setActiveTrack(null)}
                                className={`
                                    shrink-0
                                    rounded-full
                                    border
                                    px-3.5
                                    py-2
                                    text-xs
                                    font-bold
                                    transition
                                    ${
                                        !activeTrack
                                            ? 'border-emerald-600 bg-emerald-600 text-white'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                                    }
                                `}
                            >
                                All
                            </button>

                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveTrack(null)
                                    }}
                                    className="
                                        shrink-0
                                        rounded-full
                                        border
                                        border-slate-200
                                        bg-white
                                        px-4
                                        py-2
                                        text-xs
                                        font-bold
                                        text-slate-600
                                        transition
                                        hover:border-emerald-300
                                        hover:text-emerald-700
                                    "
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        {/* Course grid */}

                        {filteredCourses.length > 0 ? (
                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    gap-5
                                    sm:grid-cols-2
                                    lg:grid-cols-3
                                    xl:grid-cols-4
                                "
                            >
                                {filteredCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        enrolled={enrolledSet.has(
                                            course.id
                                        )}
                                        completed={completedSet.has(
                                            course.id
                                        )}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div
                                className="
                                    rounded-2xl
                                    border
                                    border-dashed
                                    border-slate-300
                                    bg-white
                                    px-6
                                    py-16
                                    text-center
                                "
                            >
                                <Search className="mx-auto h-8 w-8 text-slate-300" />

                                <h3 className="mt-4 text-base font-bold text-slate-900">
                                    No courses found
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Try another search or explore a different learning track.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('')
                                        setActiveTrack(null)
                                    }}
                                    className="
                                        mt-5
                                        text-sm
                                        font-bold
                                        text-emerald-700
                                        hover:text-emerald-800
                                    "
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}

                        {nextCursor && (
                            <div className="mt-10 flex justify-center">
                                <button
                                    type="button"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="
                                        inline-flex
                                        items-center
                                        gap-2
                                        rounded-lg
                                        border
                                        border-slate-200
                                        bg-white
                                        px-5
                                        py-2.5
                                        text-sm
                                        font-bold
                                        text-slate-700
                                        shadow-sm
                                        hover:border-emerald-200
                                        hover:text-emerald-700
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    {loadingMore
                                        ? 'Loading...'
                                        : 'Load more courses'}
                                </button>
                            </div>
                        )}

                        {/* Learn-to-Earn */}

                        <section
                            className="
                                mt-16
                                overflow-hidden
                                rounded-2xl
                                border
                                border-emerald-100
                                bg-white
                            "
                        >
                            <div
                                className="
                                    grid
                                    lg:grid-cols-[1fr_1.1fr]
                                "
                            >
                                <div className="bg-emerald-700 p-6 text-white sm:p-10">
                                    <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                                        Learn-to-Earn
                                    </span>

                                    <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                                        Turn learning into opportunity.
                                    </h2>

                                    <p className="mt-4 max-w-lg text-sm leading-6 text-emerald-50">
                                    Hubnovo connects practical learning
                                        with recognition, skills development and
                                        real-world impact.
                                    </p>

                                    <div className="mt-7 flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map((item) => (
                                                <div
                                                    key={item}
                                                    className="
                                                        flex
                                                        h-8
                                                        w-8
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        border-2
                                                        border-emerald-700
                                                        bg-emerald-500
                                                    "
                                                >
                                                    <Users className="h-3.5 w-3.5" />
                                                </div>
                                            ))}
                                        </div>

                                        <span className="text-xs font-semibold text-emerald-50">
                                            Learn with a growing community
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-0 sm:grid-cols-2">
                                    {PIPELINE.map((item) => {
                                        const Icon = item.icon

                                        return (
                                            <div
                                                key={item.step}
                                                className="
                                                    border-b
                                                    border-slate-100
                                                    p-5
                                                    last:border-b-0
                                                    sm:border-r
                                                    sm:last:border-r-0
                                                    sm:p-7
                                                "
                                            >
                                                <div className="flex items-center justify-between">
                                                    <Icon className="h-5 w-5 text-emerald-600" />

                                                    <span className="text-xs font-black text-slate-300">
                                                        {item.step}
                                                    </span>
                                                </div>

                                                <h3 className="mt-5 text-sm font-black text-slate-900">
                                                    {item.title}
                                                </h3>

                                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                                    {item.description}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {/* ─────────────────────────────────────────────
                    MY COURSES
                ───────────────────────────────────────────── */}

                {activeView === 'my-courses' && (
                    <section>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Your learning
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-slate-950">
                                My Courses
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Continue where you left off.
                            </p>
                        </div>

                        {myCourses.length > 0 ? (
                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    gap-5
                                    sm:grid-cols-2
                                    lg:grid-cols-3
                                    xl:grid-cols-4
                                "
                            >
                                {myCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        enrolled={enrolledSet.has(
                                            course.id
                                        )}
                                        completed={completedSet.has(
                                            course.id
                                        )}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                                <BookOpen className="mx-auto h-8 w-8 text-slate-300" />

                                <h3 className="mt-4 text-base font-bold text-slate-900">
                                    Your learning list is empty
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Enrol in a course to start building your skills.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setView('catalogue')
                                    }
                                    className="mt-5 text-sm font-bold text-emerald-700"
                                >
                                    Browse courses
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* ─────────────────────────────────────────────
                    TRACKS
                ───────────────────────────────────────────── */}

                {activeView === 'tracks' && (
                    <section>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Guided learning
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-slate-950">
                                Career Tracks
                            </h2>

                            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                                Follow a focused path based on the skills you
                                want to build.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {TRACKS.map((track) => {
                                const Icon = track.icon

                                return (
                                    <button
                                        key={track.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveTrack(track.id)
                                            setActiveView('catalogue')
                                        }}
                                        className="
                                            group
                                            rounded-2xl
                                            border
                                            border-slate-200
                                            bg-white
                                            p-6
                                            text-left
                                            shadow-sm
                                            transition-all
                                            hover:-translate-y-0.5
                                            hover:border-emerald-200
                                            hover:shadow-md
                                        "
                                    >
                                        <div
                                            className="
                                                flex
                                                h-11
                                                w-11
                                                items-center
                                                justify-center
                                                rounded-xl
                                                bg-emerald-50
                                            "
                                        >
                                            <Icon className="h-5 w-5 text-emerald-600" />
                                        </div>

                                        <h3 className="mt-5 text-base font-black text-slate-900 group-hover:text-emerald-700">
                                            {track.title}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            {track.description}
                                        </p>

                                        <div className="mt-5 flex items-center gap-1 text-xs font-bold text-emerald-700">
                                            Explore track
                                            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* ─────────────────────────────────────────────
                    CATEGORIES
                ───────────────────────────────────────────── */}

                {activeView === 'categories' && (
                    <section>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Browse
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-slate-950">
                                Course Categories
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveView('catalogue')
                                    }}
                                    className="
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-white
                                        p-5
                                        text-left
                                        shadow-sm
                                        transition
                                        hover:border-emerald-200
                                        hover:shadow-md
                                    "
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                                            <BookOpen className="h-5 w-5 text-emerald-600" />
                                        </div>

                                        <ChevronRight className="h-4 w-4 text-slate-300" />
                                    </div>

                                    <h3 className="mt-4 text-sm font-bold text-slate-900">
                                        {category.name}
                                    </h3>

                                    {category.description && (
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                            {category.description}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* ─────────────────────────────────────────────
                    CERTIFICATES
                ───────────────────────────────────────────── */}

                {activeView === 'certificates' && (
                    <section>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                                Achievements
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-slate-950">
                                My Certificates
                            </h2>
                        </div>

                        {completedCourses.length > 0 ? (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {completedCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="
                                            rounded-2xl
                                            border
                                            border-emerald-100
                                            bg-white
                                            p-6
                                            shadow-sm
                                        "
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                                                <Award className="h-6 w-6 text-emerald-600" />
                                            </div>

                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        </div>

                                        <h3 className="mt-5 text-base font-black text-slate-900">
                                            {course.title}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Course completion certificate
                                        </p>

                                        <Link
                                            href={`/app/learn/${course.id}`}
                                            className="
                                                mt-5
                                                inline-flex
                                                items-center
                                                gap-1
                                                text-xs
                                                font-bold
                                                text-emerald-700
                                            "
                                        >
                                            View course
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                                <Award className="mx-auto h-8 w-8 text-slate-300" />

                                <h3 className="mt-4 text-base font-bold text-slate-900">
                                    No certificates yet
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Complete a course to earn your first certificate.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setView('catalogue')
                                    }
                                    className="mt-5 text-sm font-bold text-emerald-700"
                                >
                                    Explore courses
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* ─────────────────────────────────────────────
                    INSTRUCTORS
                ───────────────────────────────────────────── */}

                {activeView === 'instructors' && (
                    <section>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Learn from practitioners
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-slate-950">
                                Our Instructors
                            </h2>
                        </div>

                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <Users className="mx-auto h-8 w-8 text-slate-300" />

                            <h3 className="mt-4 text-base font-bold text-slate-900">
                                Instructor profiles coming soon
                            </h3>

                            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                                Discover experienced professionals and
                                practitioners teaching practical skills on
                                Hubnovo.
                            </p>
                        </div>
                    </section>
                )}

                {/* ─────────────────────────────────────────────
                    STREAK
                ───────────────────────────────────────────── */}

                {activeView === 'streak' && (
                    <section>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                                Learning momentum
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-slate-950">
                                Your Learning Streak
                            </h2>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            <div className="rounded-2xl border border-orange-100 bg-white p-7 shadow-sm">
                                <Flame className="h-7 w-7 text-orange-500" />

                                <p className="mt-5 text-3xl font-black text-slate-900">
                                    0
                                </p>

                                <p className="text-sm text-slate-500">
                                    Current streak
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                                <Target className="h-7 w-7 text-emerald-600" />

                                <p className="mt-5 text-3xl font-black text-slate-900">
                                    {completedCount}
                                </p>

                                <p className="text-sm text-slate-500">
                                    Courses completed
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                                <BarChart2 className="h-7 w-7 text-blue-600" />

                                <p className="mt-5 text-3xl font-black text-slate-900">
                                    {enrolledCount}
                                </p>

                                <p className="text-sm text-slate-500">
                                    Learning goals started
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-7">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-slate-400" />

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Build the habit
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Even a few minutes of learning each day
                                        compounds over time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}