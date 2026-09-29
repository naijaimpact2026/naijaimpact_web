'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {

    GraduationCap,
    Plus,
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
    Laptop,
    Smartphone,
    BarChart3,
    Megaphone,
    Download,
    Bookmark,
    ArrowUpRight,
} from 'lucide-react'

import { fetchCourses } from '@/lib/actions/learn'
import type { Course, Category } from '@/lib/actions/learn'
import type { FundingAd } from '@/lib/actions/funding-ads'
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
    continueLearning: {
        courseId: string
        title: string
        coverImageUrl: string | null
        progress: number
    } | null
    featuredFunding: FundingAd[]
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
    | 'saved-courses'

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

// Explicit literal class pairs (not dynamic string concatenation) so
// Tailwind's scanner picks them up — used for track/category icon tints.
const TINT: Record<string, string> = {
    emerald: 'bg-emerald/10 text-emerald',
    blue: 'bg-cyan/10 text-cyan',
    amber: 'bg-amber-500/10 text-amber-600',
    violet: 'bg-purple-500/10 text-purple-600',
    rose: 'bg-rose-500/10 text-rose-600',
    orange: 'bg-orange-500/10 text-orange-600',
}

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

function coursePopularityScore(course: Course): number {
    const item = course as Course & Record<string, unknown>
    return Number(
        item.enrollment_count ??
            item.students_count ??
            item.enrolled_count ??
            item.review_count ??
            item.rating_count ??
            0
    ) || 0
}

function fmtCompactAmount(value: unknown): string | null {
    const amount = Number(value)
    if (!Number.isFinite(amount) || amount <= 0) return null
    if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 1 : 1)}M`
    if (amount >= 1_000) return `₦${Math.round(amount / 1_000)}k`
    return `₦${amount.toLocaleString('en-NG')}`
}

function getFundingImage(ad: any): string | null {
    const value = ad.cover_image_url ?? ad.image_url ?? ad.cover_url ?? ad.image ?? ad.thumbnail_url
    return value ? toPublicStorageUrl(String(value)) : null
}

function CourseCard({
    course,
    enrolled,
    completed,
    saved,
    onToggleSaved,
}: {
    course: Course
    enrolled: boolean
    completed: boolean
    saved: boolean
    onToggleSaved: (courseId: string) => void
}) {
    const imageUrl = getCourseImage(course)

    return (
        <div
            className="
                group
                flex
                min-w-0
                flex-col
                overflow-hidden
                rounded-xl
                border
                border-border
                bg-card
                shadow-sm
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:border-primary/30
                hover:shadow-md
            "
        >
            <Link href={`/app/learn/${course.id}`} className="flex min-w-0 flex-1 flex-col">
                {/* Cover */}
                <div className="relative aspect-video overflow-hidden bg-muted">
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
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            unoptimized
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted">
                            <GraduationCap className="h-12 w-12 text-primary/40" />
                        </div>
                    )}

                    <div className="absolute right-2 top-2">
                        <span className="rounded-md bg-card/95 px-2 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur">
                            {course.is_free ? 'Free' : fmtNGN(course.amount)}
                        </span>
                    </div>

                    {completed && (
                        <div className="absolute left-2 top-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Completed
                            </span>
                        </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition-colors group-hover:bg-slate-950/20">
                        <div className="flex h-11 w-11 scale-90 items-center justify-center rounded-full bg-card opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
                            <Play className="ml-0.5 h-5 w-5 fill-primary text-primary" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        {course.category_name ? (
                            <span className="truncate text-[11px] font-bold uppercase tracking-wide text-primary">
                                {course.category_name}
                            </span>
                        ) : (
                            <span />
                        )}

                        {enrolled && !completed && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                In progress
                            </span>
                        )}
                    </div>

                    <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-5 text-foreground transition-colors group-hover:text-primary">
                        {course.title}
                    </h3>

                    {course.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {course.description}
                        </p>
                    )}

                    <div className="mt-auto pt-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <span className="truncate text-xs text-muted-foreground">
                                    {course.instructor?.display_name ?? 'Hubnovo Instructor'}
                                </span>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </div>
                    </div>
                </div>
            </Link>

            <div className="border-t border-border px-4 py-3">
                <button
                    type="button"
                    onClick={() => onToggleSaved(course.id)}
                    aria-label={saved ? `Remove ${course.title} from saved courses` : `Save ${course.title}`}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${saved ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
                >
                    <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                    {saved ? 'Saved' : 'Save course'}
                </button>
            </div>
        </div>
    )
}
function SkeletonCard() {
    return (
        <div
            className="
                overflow-hidden
                rounded-xl
                border
                border-border
                bg-card
            "
        >
            <div className="aspect-video animate-pulse bg-muted" />

            <div className="space-y-3 p-4">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
        </div>
    )
}


function StatCard({
    icon,
    value,
    label,
    onClick,
}: {
    icon: ReactNode
    value: ReactNode
    label: string
    onClick?: () => void
}) {
    const content = (
        <>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                {icon}
            </div>
            <p className="mt-3 text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-white/55">{label}</p>
        </>
    )

    if (!onClick) {
        return (
            <div className="rounded-xl border border-white/10 bg-[#0b223d] p-4">
                {content}
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-xl border border-white/10 bg-[#0b223d] p-4 text-left transition hover:border-blue-400/30 hover:bg-[#0d2948] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        >
            {content}
        </button>
    )
}
function DashboardPanel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) {
    return <section className="rounded-xl border border-white/10 bg-[#081b2f] p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-extrabold text-white">{title}</h2>{action && <button type="button" onClick={onAction} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-blue-400 transition hover:bg-blue-400/10 hover:text-blue-300">{action}<ArrowUpRight className="h-3.5 w-3.5" /></button>}</div>{children}</section>
}
function MiniDashboardCourse({ course, enrolled, completed }: { course: Course; enrolled: boolean; completed: boolean }) {
    const imageUrl = getCourseImage(course)
    return <Link href={`/app/learn/${course.id}`} className="group overflow-hidden rounded-xl border border-white/10 bg-[#0b223d] transition hover:border-blue-400/30">
        <div className="relative aspect-[1.5] overflow-hidden bg-[#061525]">{imageUrl ? <Image src={imageUrl} alt={course.title} fill sizes="180px" className="object-cover transition group-hover:scale-105" unoptimized /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20"><GraduationCap className="h-8 w-8 text-blue-300" /></div>}</div>
        <div className="p-2.5"><h3 className="line-clamp-2 text-[11px] font-bold leading-4 text-white">{course.title}</h3><p className="mt-1 text-[10px] text-amber-300">★ {enrolled || completed ? 'Enrolled' : 'Recommended'}</p><p className="text-[10px] text-white/45">{course.category_name ?? 'Course'} · {course.is_free ? 'Free' : fmtNGN(course.amount)}</p></div>
    </Link>
}
function EmptyDashboard({ text, onClick }: { text: string; onClick: () => void }) {
    return <button type="button" onClick={onClick} className="flex w-full items-center justify-center rounded-xl border border-dashed border-white/10 px-5 py-8 text-xs text-white/45 hover:border-blue-400/30">{text}</button>
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
    continueLearning,
    featuredFunding,
    view,
}: Props) {
    const [courses, setCourses] = useState<Course[]>(initialCourses)
    const [nextCursor, setNextCursor] = useState<string | null>(
        initialNextCursor
    )

    const [loadingMore, setLoadingMore] = useState(false)

    const [search, setSearch] = useState('')
    const [activeTrack, setActiveTrack] = useState<string | null>(null)
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [sortMode, setSortMode] = useState<'popular' | 'newest'>('popular')
    const [timeRange, setTimeRange] = useState<'all' | 'week'>('all')

    const [activeView, setActiveView] = useState<ViewMode>(
        (view as ViewMode) || 'catalogue'
    )

    const savedStorageKey = useMemo(
        () => `hubnovo:saved-courses:${displayName.trim().toLowerCase() || 'user'}`,
        [displayName]
    )

    const [savedCourseIds, setSavedCourseIds] = useState<string[]>([])

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(savedStorageKey)
            setSavedCourseIds(stored ? JSON.parse(stored) : [])
        } catch {
            setSavedCourseIds([])
        }
    }, [savedStorageKey])

    function toggleSavedCourse(courseId: string) {
        setSavedCourseIds((current) => {
            const next = current.includes(courseId)
                ? current.filter((id) => id !== courseId)
                : [...current, courseId]

            window.localStorage.setItem(savedStorageKey, JSON.stringify(next))
            return next
        })
    }

    const enrolledSet = useMemo(
        () => new Set(inProgressCourseIds),
        [inProgressCourseIds]
    )

    const completedSet = useMemo(
        () => new Set(completedCourseIds),
        [completedCourseIds]
    )

    const filteredCourses = useMemo(() => {
        let result = [...courses]

        if (activeTrack) {
            const track = TRACKS.find((item) => item.id === activeTrack)

            if (track) {
                result = result.filter((course) => courseMatchesTrack(course, track))
            }
        }

        if (activeCategory) {
            const categoryQuery = activeCategory.toLowerCase()
            result = result.filter((course) =>
                [course.category_name, course.title, course.description]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(categoryQuery)
            )
        }

        if (timeRange === 'week') {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
            result = result.filter((course) => {
                const createdAt = new Date(course.created_at).getTime()
                return Number.isFinite(createdAt) && createdAt >= weekAgo
            })
        }

        result = result.filter((course) => courseMatchesSearch(course, search))

        result.sort((a, b) => {
            if (sortMode === 'newest') {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }

            return coursePopularityScore(b) - coursePopularityScore(a)
        })

        return result
    }, [courses, activeTrack, activeCategory, search, sortMode, timeRange])

    // Real course counts per track — no fabricated numbers.
    const trackCourseCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const track of TRACKS) {
            counts[track.id] = courses.filter((course) =>
                courseMatchesTrack(course, track)
            ).length
        }
        return counts
    }, [courses])

    const myCourses = useMemo(() => {
        return courses.filter(
            (course) =>
                enrolledSet.has(course.id) ||
                completedSet.has(course.id)
        )
    }, [courses, enrolledSet, completedSet])

    const savedCourses = useMemo(() => {
        const savedSet = new Set(savedCourseIds)
        return courses.filter((course) => savedSet.has(course.id))
    }, [courses, savedCourseIds])

    const completedCourses = useMemo(() => {
        return courses.filter((course) =>
            completedSet.has(course.id)
        )
    }, [courses, completedSet])

    const recommendedCourses = useMemo(() => {
        return courses
            .filter((course) => {
                if (continueLearning?.courseId === course.id) return false
                if (completedSet.has(course.id)) return false
                return true
            })
            .slice(0, 3)
    }, [courses, completedSet, continueLearning])

    const featuredTracks = useMemo(() => TRACKS.slice(0, 4), [])

    function buildCertificateSvg(course: Course) {
        const safeName = displayName.trim() || 'Hubnovo Learner'
        const safeTitle = course.title.trim() || 'Completed Course'
        const nameFontSize = safeName.length > 28 ? 30 : safeName.length > 18 ? 36 : 42
        const courseFontSize = safeTitle.length > 38 ? 24 : safeTitle.length > 27 ? 29 : 34
        const escapeSvg = (value: string) => value.replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[char] ?? char))

        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0b1d35"/><stop offset="100%" stop-color="#102e5a"/></linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#60a5fa"/></linearGradient>
  </defs>
  <rect width="1200" height="800" rx="18" fill="#071426"/>
  <rect x="18" y="18" width="1164" height="764" rx="14" fill="url(#paper)" stroke="#3b82f6" stroke-width="3"/>
  <rect x="34" y="34" width="1132" height="732" rx="9" fill="none" stroke="#7dd3fc" stroke-opacity=".35" stroke-width="1.5"/>
  <path d="M55 135 V55 H135 M1065 55 H1145 V135 M55 665 V745 H135 M1065 745 H1145 V665" fill="none" stroke="url(#accent)" stroke-width="5" stroke-linecap="round"/>
  <circle cx="600" cy="105" r="27" fill="#1d4ed8" fill-opacity=".22" stroke="#60a5fa" stroke-width="1.5"/>
  <path d="M588 105 l8 8 17 -19" fill="none" stroke="#7dd3fc" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="600" y="163" text-anchor="middle" fill="#93c5fd" font-family="Arial, sans-serif" font-size="21" font-weight="700" letter-spacing="5">HUBNOVO</text>
  <text x="600" y="225" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="43" font-weight="700">Certificate of Completion</text>
  <rect x="510" y="246" width="180" height="4" rx="2" fill="url(#accent)"/>
  <text x="600" y="300" text-anchor="middle" fill="#b6c5d9" font-family="Arial, sans-serif" font-size="20">This certificate is proudly presented to</text>
  <text x="600" y="365" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${nameFontSize}" font-weight="700">${escapeSvg(safeName)}</text>
  <text x="600" y="420" text-anchor="middle" fill="#b6c5d9" font-family="Arial, sans-serif" font-size="19">for successfully completing</text>
  <text x="600" y="477" text-anchor="middle" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="${courseFontSize}" font-weight="700">${escapeSvg(safeTitle)}</text>
  <line x1="370" y1="555" x2="830" y2="555" stroke="#64748b" stroke-opacity=".55" stroke-width="1.5"/>
  <text x="600" y="592" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="16" font-weight="700">HUBNOVO LEARN</text>
  <text x="600" y="620" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="13">Learn · Practice · Earn · Impact</text>
  <text x="600" y="714" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="12">Awarded for successful course completion</text>
</svg>`
    }

    function openCertificate(course: Course) {
        const blob = new Blob([buildCertificateSvg(course)], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const certificateWindow = window.open('', '_blank')

        if (!certificateWindow) {
            URL.revokeObjectURL(url)
            return
        }

        certificateWindow.document.write(`
            <!doctype html>
            <html>
                <head>
                    <title>Hubnovo Certificate</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <style>
                        * { box-sizing: border-box; }
                        html, body { min-height: 100%; margin: 0; }
                        body {
                            min-height: 100vh;
                            padding: 28px 18px 36px;
                            background: radial-gradient(ellipse at top, #122746 0%, #071426 58%, #030914 100%);
                            color: #e2e8f0;
                            font-family: Arial, sans-serif;
                        }
                        .toolbar {
                            width: min(900px, 92vw);
                            margin: 0 auto 16px;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 12px;
                        }
                        .brand { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: #93c5fd; }
                        .actions { display: flex; gap: 8px; }
                        button {
                            border: 1px solid #334155;
                            border-radius: 8px;
                            padding: 9px 13px;
                            background: #10233d;
                            color: #e2e8f0;
                            font-size: 12px;
                            font-weight: 700;
                            cursor: pointer;
                        }
                        button.primary { background: #2563eb; border-color: #2563eb; color: white; }
                        .certificate-wrap { width: min(900px, 92vw); margin: 0 auto; }
                        .certificate {
                            display: block;
                            width: 100%;
                            height: auto;
                            aspect-ratio: 3 / 2;
                            border-radius: 12px;
                            box-shadow: 0 20px 55px rgba(0,0,0,.4);
                        }
                        .hint { width: min(900px, 92vw); margin: 12px auto 0; color: #94a3b8; font-size: 11px; text-align: center; }
                        @media (max-width: 560px) {
                            body { padding: 16px 10px 24px; }
                            .toolbar { align-items: flex-start; flex-direction: column; }
                            .certificate-wrap, .toolbar, .hint { width: 100%; }
                            button { padding: 8px 10px; }
                        }
                        @media print {
                            body { min-height: 0; padding: 0; background: white; }
                            .toolbar, .hint { display: none; }
                            .certificate-wrap { width: 100%; margin: 0; }
                            .certificate { border-radius: 0; box-shadow: none; width: 100%; }
                            @page { size: landscape; margin: 8mm; }
                        }
                    </style>
                </head>
                <body>
                    <header class="toolbar">
                        <div class="brand">HUBNOVO · LEARN</div>
                        <div class="actions">
                            <button onclick="window.print()">Print / Save PDF</button>
                            <button class="primary" onclick="window.close()">Close</button>
                        </div>
                    </header>
                    <main class="certificate-wrap">
                        <img class="certificate" src="${url}" alt="Hubnovo Certificate of Completion" />
                    </main>
                    <p class="hint">Tip: choose “Save as PDF” in the print dialog to keep a portable copy.</p>
                </body>
            </html>
        `)
        certificateWindow.document.close()

        window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    }

    // Open the same compact certificate preview for Download actions, where learners
    // can use the Print / Save PDF control to save a portable certificate.
    function downloadCertificate(course: Course) {
        openCertificate(course)
    }

    function openTrack(trackId: string) {
        setActiveTrack(trackId)
        setActiveCategory(null)
        setActiveView('catalogue')
        setSearch('')
    }

    function openSkill(skill: string) {
        setActiveTrack(null)
        setActiveCategory(null)
        setActiveView('catalogue')
        setSearch(skill)
    }

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
        setActiveCategory(null)
        setSearch('')
    }

    return (
        <div className="min-h-screen bg-[#061525] text-white">
            <section className="border-b border-white/10 bg-[#061525]">
                <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
                    <div className="space-y-3">
                        <div
                            className="relative min-h-[320px] overflow-hidden rounded-2xl border border-blue-400/20 bg-[#07172c] bg-cover bg-center p-6 sm:p-8"
                            style={{
                                backgroundImage: "url('/learn-dashboard-hero.png')",
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#061525]/95 via-[#061525]/75 to-[#061525]/25" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#061525]/70 via-transparent to-[#061525]/20" />
                            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
                            <div className="relative z-10 max-w-2xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-400/15 px-3 py-1.5 text-xs font-bold text-blue-300"><GraduationCap className="h-3.5 w-3.5" />Learn. Earn. Create Impact.</div>
                                <h1 className="font-display text-4xl font-extrabold leading-[1.02] sm:text-5xl">Keep learning, <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">{displayName}</span>.</h1>
                                <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100/75 sm:text-base">Build practical skills, earn recognition and create opportunities through learning designed for Africa&apos;s future.</p>
                                <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => setView('catalogue')} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-400">Explore courses <ArrowUpRight className="h-4 w-4" /></button><button type="button" onClick={() => setView('my-courses')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"><BookOpen className="h-4 w-4" />My learning</button></div>
                            </div>
                            <div className="absolute right-6 top-6 hidden w-[360px] lg:block">
                                <div className="rounded-2xl border border-white/10 bg-[#061525]/65 p-4 shadow-2xl backdrop-blur-md">
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/55">Your learning overview</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button type="button" onClick={() => setView('my-courses')} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-blue-400/30 hover:bg-white/[0.07]"><BookOpen className="h-4 w-4 text-blue-300" /><p className="mt-2 text-xl font-black text-white">{enrolledCount}</p><p className="text-[10px] text-white/45">Courses enrolled</p></button>
                                        <button type="button" onClick={() => setView('certificates')} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-blue-400/30 hover:bg-white/[0.07]"><Award className="h-4 w-4 text-amber-300" /><p className="mt-2 text-xl font-black text-white">{completedCount}</p><p className="text-[10px] text-white/45">Certificates earned</p></button>
                                        <button type="button" onClick={() => setView('streak')} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-blue-400/30 hover:bg-white/[0.07]"><Flame className="h-4 w-4 text-orange-400" /><p className="mt-2 text-xl font-black text-white">—</p><p className="text-[10px] text-white/45">Day streak</p></button>
                                        <button type="button" onClick={() => setView('streak')} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-blue-400/30 hover:bg-white/[0.07]"><BarChart3 className="h-4 w-4 text-emerald-400" /><p className="mt-2 text-xl font-black text-white">—</p><p className="text-[10px] text-white/45">Hours learned</p></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <main className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
                <div className="mb-4 flex gap-1 overflow-x-auto border-b border-white/10">{[['catalogue','All Courses'],['my-courses','My Learning'],['tracks','Career Tracks'],['categories','Categories'],['certificates','Certificates'],['instructors','Instructors'],['saved-courses','Saved Courses']].map(([id,label]) => <button key={id} type="button" onClick={() => setView(id as ViewMode)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold sm:px-4 sm:text-sm ${activeView === id ? 'border-blue-400 text-blue-400' : 'border-transparent text-white/60 hover:text-white'}`}>{label}</button>)}</div>

                {activeView === 'catalogue' ? <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_315px]">
                    <div className="min-w-0 space-y-4">
                        <div className="grid gap-4 lg:grid-cols-[1.35fr_.85fr]">
                            <DashboardPanel title="Continue Learning" action="View all" onAction={() => setView('my-courses')}>
                                {continueLearning ? <div className="rounded-xl border border-blue-400/15 bg-[#0b223d] p-4"><div className="flex min-h-[150px] gap-4"><div className="relative h-32 w-44 shrink-0 overflow-hidden rounded-lg bg-[#061525]">{continueLearning.coverImageUrl ? <Image src={toPublicStorageUrl(continueLearning.coverImageUrl)} alt={continueLearning.title} fill sizes="176px" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center"><BookOpen className="h-8 w-8 text-cyan-400" /></div>}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-white">{continueLearning.title}</h3><p className="mt-1 text-xs text-white/55">Continue where you left off</p><div className="mt-3 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-400" style={{width:`${Math.min(100,Math.max(0,continueLearning.progress))}%`}} /></div><span className="text-xs font-bold">{Math.round(continueLearning.progress)}%</span></div></div></div><Link href={`/app/learn/${continueLearning.courseId}`} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-bold hover:bg-blue-400">Continue Learning <ArrowUpRight className="h-3.5 w-3.5" /></Link></div> : <EmptyDashboard text="Start a course to see your learning progress here." onClick={() => setView('catalogue')} />}
                            </DashboardPanel>
                            <DashboardPanel title="Recommended for you" action="View all" onAction={() => setView('catalogue')}><div className="grid grid-cols-3 gap-2">{recommendedCourses.slice(0,3).map(course => <MiniDashboardCourse key={course.id} course={course} enrolled={enrolledSet.has(course.id)} completed={completedSet.has(course.id)} />)}</div></DashboardPanel>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[1.55fr_.8fr]">
                            <DashboardPanel title="Career Tracks" action="View all" onAction={() => setView('tracks')}>
                                <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                                    {[
                                        { icon: Laptop, title: 'Full-Stack Developer', trackId: 'technology' },
                                        { icon: Smartphone, title: 'Mobile Developer', trackId: 'technology' },
                                        { icon: BarChart3, title: 'Data Analyst', trackId: 'technology' },
                                        { icon: Megaphone, title: 'Digital Marketer', trackId: 'career' },
                                    ].map((track) => {
                                        const Icon = track.icon
                                        const count = trackCourseCounts[track.trackId] ?? 0
                                        return (
                                            <button
                                                key={track.title}
                                                type="button"
                                                onClick={() => openTrack(track.trackId)}
                                                className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-blue-400/30 hover:bg-white/[0.05]"
                                            >
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <h3 className="mt-3 min-h-8 text-xs font-bold">{track.title}</h3>
                                                <p className="text-[10px] text-white/50">{count} course{count === 1 ? '' : 's'}</p>
                                                <div className="mt-3 h-1.5 rounded-full bg-white/10">
                                                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${count > 0 ? 100 : 0}%` }} />
                                                </div>
                                                <p className="mt-1 text-[10px] text-blue-300">Explore track</p>
                                            </button>
                                        )
                                    })}
                                </div>
                            </DashboardPanel>
                            <DashboardPanel title="Your Skills" action="View all" onAction={() => setView('tracks')}>
                                <div className="space-y-3">
                                    {[
                                        ['React', 90, 'bg-blue-400'],
                                        ['Java', 80, 'bg-violet-400'],
                                        ['JavaScript', 90, 'bg-emerald-400'],
                                        ['Database', 60, 'bg-amber-400'],
                                        ['UI/UX', 40, 'bg-slate-300'],
                                    ].map(([name, value, bar]) => (
                                        <button
                                            key={String(name)}
                                            type="button"
                                            onClick={() => openSkill(String(name))}
                                            className="group flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-white/[0.04]"
                                        >
                                            <span className="w-16 text-xs text-white/60 group-hover:text-white">{name}</span>
                                            <div className="h-2 flex-1 rounded-full bg-white/10">
                                                <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%` }} />
                                            </div>
                                            <span className="w-8 text-right text-xs font-bold">{value}%</span>
                                        </button>
                                    ))}
                                </div>
                            </DashboardPanel>
                        </div>

                        <section><div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-xl font-display font-extrabold">Explore courses</h2><p className="mt-1 text-xs text-white/55">Learn practical skills from experienced instructors.</p></div><div className="flex flex-wrap gap-2"><select value={sortMode} onChange={(event) => setSortMode(event.target.value as 'popular' | 'newest')} className="rounded-lg border border-white/10 bg-[#0b223d] px-3 py-2 text-xs font-semibold text-white/80 outline-none transition hover:border-blue-400/30"><option value="popular">Sort by: Most Popular</option><option value="newest">Sort by: Newest</option></select><select value={timeRange} onChange={(event) => setTimeRange(event.target.value as 'all' | 'week')} className="rounded-lg border border-white/10 bg-[#0b223d] px-3 py-2 text-xs font-semibold text-white/80 outline-none transition hover:border-blue-400/30"><option value="all">All time</option><option value="week">This week</option></select></div></div><div className="mb-4 flex gap-2 overflow-x-auto pb-1"><button type="button" onClick={()=>{setActiveTrack(null);setActiveCategory(null)}} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${!activeCategory?'bg-blue-500 text-white':'bg-[#0b223d] text-white/60'}`}>All</button>{['Business','Design','Marketing','Trading','Technology','Finance'].map(x=><button key={x} type="button" onClick={()=>{setActiveTrack(null);setActiveCategory(x)}} className={`shrink-0 rounded-full border border-white/10 px-3.5 py-1.5 text-xs transition ${activeCategory===x?'border-blue-400/30 bg-blue-500 text-white':'bg-[#0b223d] text-white/60 hover:border-blue-400/30 hover:text-white'}`}>{x}</button>)}</div>{filteredCourses.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredCourses.map(course=><CourseCard key={course.id} course={course} enrolled={enrolledSet.has(course.id)} completed={completedSet.has(course.id)} saved={savedCourseIds.includes(course.id)} onToggleSaved={toggleSavedCourse} />)}</div> : <EmptyDashboard text="No courses found. Clear your filters to continue." onClick={()=>{setSearch('');setActiveTrack(null);setActiveCategory(null);setTimeRange('all')}} />}{nextCursor && <div className="mt-6 flex justify-center"><button type="button" onClick={loadMore} disabled={loadingMore} className="rounded-lg border border-white/10 bg-[#0b223d] px-5 py-2.5 text-xs font-bold disabled:opacity-50">{loadingMore?'Loading...':'Load more courses'}</button></div>}</section>

                        {/* Learn-to-Earn */}
                        <section className="overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-[#0d3b73] via-[#0b2d59] to-[#081b35]">
                            <div className="grid lg:grid-cols-[1.1fr_.9fr]">
                                <div className="p-6 sm:p-8">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-200">
                                        <GraduationCap className="h-3.5 w-3.5" />
                                        Learn-to-Earn
                                    </span>
                                    <h2 className="mt-4 text-2xl font-display font-extrabold leading-tight text-white sm:text-3xl">Turn learning into opportunity.</h2>
                                    <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/75">Build practical skills, earn recognition and create opportunities through learning designed for Africa's future.</p>
                                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                        {PIPELINE.slice(0, 3).map((step) => {
                                            const Icon = step.icon
                                            return <div key={step.step} className="rounded-xl border border-white/10 bg-white/[0.05] p-3"><div className="flex items-center gap-2 text-blue-200"><Icon className="h-4 w-4" /><span className="text-[10px] font-black">{step.step}</span></div><p className="mt-2 text-xs font-bold text-white">{step.title}</p><p className="mt-1 text-[10px] leading-4 text-white/50">{step.description}</p></div>
                                        })}
                                    </div>
                                    <Link href="/app/learn" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-400">Start learning <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                                </div>
                                <div className="relative hidden min-h-[280px] lg:block">
                                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
                                    <div className="absolute inset-0 flex items-center justify-center p-8">
                                        <div className="w-full max-w-[280px] rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-sm">
                                            <div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300"><Target className="h-5 w-5" /></div><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">Impact</span></div>
                                            <p className="mt-5 text-sm font-black text-white">Skills → Opportunities</p>
                                            <div className="mt-4 space-y-2">{PIPELINE.map((step) => <div key={step.step} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-300" /><span className="text-[10px] text-white/55">{step.title}</span></div>)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <DashboardPanel title="My Learning Progress" action="View all" onAction={()=>setView('my-courses')}><div className="flex items-center gap-4"><div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={{background:`conic-gradient(#2196ff ${completedCount>0?Math.min(100,completedCount/Math.max(enrolledCount,1)*100):0}%,rgba(255,255,255,.08) 0)`}}><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0b1d32] text-xl font-black">{completedCount>0?Math.round(completedCount/Math.max(enrolledCount,1)*100):0}%</div></div><div><p className="text-sm font-bold">Overall Progress</p><p className="mt-1 text-xs text-white/50">{completedCount} of {Math.max(enrolledCount,completedCount)} courses completed</p></div></div><div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs"><div className="flex justify-between text-white/60"><span>Courses completed</span><b className="text-white">{completedCount}</b></div><div className="flex justify-between text-white/60"><span>Courses enrolled</span><b className="text-white">{enrolledCount}</b></div><div className="flex justify-between text-white/60"><span>Current streak</span><b className="text-white">—</b></div></div><div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs font-bold">This week</p><div className="mt-3 grid grid-cols-7 gap-1.5">{['M','T','W','T','F','S','S'].map((d,i)=><div key={`${d}-${i}`} className="text-center"><div className="mx-auto h-10 w-2 overflow-hidden rounded-full bg-white/10"><div className="w-full rounded-full bg-blue-400" style={{height:`${35+i*9}%`,marginTop:`${65-i*9}%`}} /></div><span className="mt-1 block text-[9px] text-white/40">{d}</span></div>)}</div></div></DashboardPanel>
                        <DashboardPanel title="Your Certificates" action="View all" onAction={() => setView('certificates')}>
                            {completedCourses.length ? (
                                completedCourses.slice(0, 3).map((course) => (
                                    <div key={course.id} className="flex items-center gap-2 border-b border-white/10 py-2.5 last:border-0">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                                            <Award className="h-4 w-4 text-amber-300" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold">{course.title}</p>
                                            <p className="text-[10px] text-white/45">Course completed</p>
                                        </div>
                                        <button type="button" onClick={() => openCertificate(course)} className="rounded-md px-2 py-1 text-[10px] font-bold text-blue-300 transition hover:bg-blue-500/10 hover:text-blue-200">View certificate</button>
                                        <button
                                            type="button"
                                            onClick={() => downloadCertificate(course)}
                                            className="rounded-md p-1.5 text-white/40 transition hover:bg-white/10 hover:text-blue-300"
                                            title="Download certificate"
                                            aria-label={`Download certificate for ${course.title}`}
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="py-5 text-center text-xs text-white/45">Complete a course to earn certificates.</p>
                            )}
                            <button type="button" onClick={() => setView('certificates')} className="mt-3 w-full rounded-lg bg-blue-500/20 py-2 text-xs font-bold text-blue-300 transition hover:bg-blue-500/30 hover:text-white">View all certificates <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button>
                        </DashboardPanel>
                        <DashboardPanel title="Saved Courses" action="View all" onAction={()=>setView('saved-courses')}>{savedCourses.slice(0,2).map(course=><Link key={course.id} href={`/app/learn/${course.id}`} className="flex items-center gap-2 border-b border-white/10 py-2.5 last:border-0"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15"><Bookmark className="h-4 w-4 fill-current text-blue-300" /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{course.title}</p><p className="text-[10px] text-white/45">{course.instructor?.display_name ?? 'Hubnovo Instructor'}</p></div></Link>)}{!savedCourses.length&&<p className="py-5 text-center text-xs text-white/45">No saved courses yet.</p>}</DashboardPanel>
                        <DashboardPanel title="Funding Opportunities" action="View all" onAction={() => { window.location.href = '/app/funding' }}>
                            {featuredFunding.length > 0 ? (
                                <div className="space-y-3">
                                    {featuredFunding.slice(0, 3).map((ad: any, index) => {
                                        const imageUrl = getFundingImage(ad)
                                        const goal = fmtCompactAmount(ad.goal_amount ?? ad.target_amount ?? ad.goal ?? ad.amount_goal)
                                        const raised = fmtCompactAmount(ad.amount_raised ?? ad.raised_amount ?? ad.amount_raised_total)
                                        const progress = goal && raised ? Math.min(100, Math.round((Number(ad.amount_raised ?? ad.raised_amount ?? 0) / Math.max(Number(ad.goal_amount ?? ad.target_amount ?? ad.goal ?? 1), 1)) * 100)) : null

                                        return (
                                            <Link key={ad.id ?? index} href={ad.href ?? ad.url ?? (ad.id ? `/app/funding/${ad.id}` : '/app/funding')} className="group block overflow-hidden rounded-xl border border-white/10 bg-[#0b223d] transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-[#0d2948] hover:shadow-lg">
                                                <div className="p-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#061525]">
                                                            {imageUrl ? <Image src={imageUrl} alt="" fill sizes="40px" className="object-cover transition duration-300 group-hover:scale-105" unoptimized /> : <Target className="m-auto h-4 w-4 text-emerald-300" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-xs font-bold text-white">{ad.title ?? ad.name ?? 'Funding opportunity'}</p>
                                                            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/45">{ad.description ?? ad.summary ?? 'Discover funding opportunities available on Hubnovo.'}</p>
                                                        </div>
                                                        <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-emerald-300" />
                                                    </div>
                                                    {goal && (
                                                        <div className="mt-3">
                                                            <div className="flex items-center justify-between text-[10px]"><span className="text-white/45">Goal</span><span className="font-black text-emerald-300">{goal}</span></div>
                                                            {raised && <><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${progress ?? 0}%` }} /></div><p className="mt-1 text-[9px] text-white/40">{raised} raised{progress !== null ? ` · ${progress}%` : ''}</p></>}
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-center"><Target className="mx-auto h-6 w-6 text-white/30" /><p className="mt-2 text-xs font-semibold text-white/65">No featured opportunities yet.</p><p className="mt-1 text-[10px] text-white/40">Explore funding and discover new opportunities.</p></div>
                            )}
                            <Link href="/app/funding" className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-500/15 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20">Explore funding opportunities <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                        </DashboardPanel>
                    </aside>
                </div> : <div className="rounded-2xl border border-white/10 bg-[#081b2f] p-4 sm:p-6">                {activeView === 'my-courses' && (
                    <section>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">
                                Your learning
                            </p>

                            <h2 className="mt-1 text-2xl font-display font-extrabold text-foreground">
                                My Courses
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
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
                                        saved={savedCourseIds.includes(course.id)}
                                        onToggleSaved={toggleSavedCourse}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
                                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />

                                <h3 className="mt-4 text-base font-bold text-foreground">
                                    Your learning list is empty
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Enrol in a course to start building your skills.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setView('catalogue')
                                    }
                                    className="mt-5 text-sm font-bold text-primary"
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
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">
                                Guided learning
                            </p>

                            <h2 className="mt-1 text-2xl font-display font-extrabold text-foreground">
                                Career Tracks
                            </h2>

                            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
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
                                            border-border
                                            bg-card
                                            p-6
                                            text-left
                                            shadow-sm
                                            transition-all
                                            hover:-translate-y-0.5
                                            hover:border-primary/30
                                            hover:shadow-md
                                        "
                                    >
                                        <div
                                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${TINT[track.color] ?? 'bg-primary/10 text-primary'}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <h3 className="mt-5 text-base font-black text-foreground group-hover:text-primary">
                                            {track.title}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            {track.description}
                                        </p>

                                        <p className="mt-3 text-xs font-semibold text-muted-foreground">
                                            {trackCourseCounts[track.id] ?? 0} course{trackCourseCounts[track.id] === 1 ? '' : 's'}
                                        </p>

                                        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
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
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">
                                Browse
                            </p>

                            <h2 className="mt-1 text-2xl font-display font-extrabold text-foreground">
                                Course Categories
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {categories.map((category, i) => (
                                <Link
                                    key={category.id}
                                    href={`/app/learn?category=${category.id}&view=catalogue`}
                                    className="
                                        rounded-xl
                                        border
                                        border-border
                                        bg-card
                                        p-5
                                        text-left
                                        shadow-sm
                                        transition
                                        hover:border-primary/30
                                        hover:shadow-md
                                    "
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${Object.values(TINT)[i % Object.values(TINT).length]}`}>
                                            <BookOpen className="h-5 w-5" />
                                        </div>

                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>

                                    <h3 className="mt-4 text-sm font-bold text-foreground">
                                        {category.name}
                                    </h3>

                                    {category.description && (
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                            {category.description}
                                        </p>
                                    )}
                                </Link>
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

                            <h2 className="mt-1 text-2xl font-display font-extrabold text-foreground">
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
                                            border-primary/15
                                            bg-card
                                            p-6
                                            shadow-sm
                                        "
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                                                <Award className="h-6 w-6 text-primary" />
                                            </div>

                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        </div>

                                        <h3 className="mt-5 text-base font-black text-foreground">
                                            {course.title}
                                        </h3>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Course completion certificate
                                        </p>

                                        <div className="mt-5 flex flex-wrap items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => openCertificate(course)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-transparent px-3 py-2 text-xs font-bold text-primary transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/10 hover:text-blue-400 hover:shadow-md hover:shadow-blue-500/10 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                                            >
                                                View certificate
                                                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 hover:translate-x-0.5" />
                                            </button>
                                            <Link
                                                href={`/app/learn/${course.id}`}
                                                className="inline-flex items-center gap-1 rounded-lg border border-transparent px-3 py-2 text-xs font-bold text-primary transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/10 hover:text-blue-400 hover:shadow-md hover:shadow-blue-500/10 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                                            >
                                                View course
                                                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 hover:translate-x-0.5" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => downloadCertificate(course)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-transparent px-3 py-2 text-xs font-bold text-blue-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/25 hover:bg-blue-500/10 hover:text-blue-300 hover:shadow-md hover:shadow-blue-500/10 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                                            >
                                                Download
                                                <Download className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
                                <Award className="mx-auto h-8 w-8 text-muted-foreground" />

                                <h3 className="mt-4 text-base font-bold text-foreground">
                                    No certificates yet
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Complete a course to earn your first certificate.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setView('catalogue')
                                    }
                                    className="mt-5 text-sm font-bold text-primary"
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
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">
                                Learn from practitioners
                            </p>

                            <h2 className="mt-1 text-2xl font-display font-extrabold text-foreground">
                                Our Instructors
                            </h2>
                        </div>

                        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
                            <Users className="mx-auto h-8 w-8 text-muted-foreground" />

                            <h3 className="mt-4 text-base font-bold text-foreground">
                                Instructor profiles coming soon
                            </h3>

                            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                                Discover experienced professionals and
                                practitioners teaching practical skills on
                                Hubnovo.
                            </p>
                        </div>
                    </section>
                )}

                {activeView === 'saved-courses' && (
                    <section>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                Your saved learning
                            </p>
                            <h2 className="mt-1 text-2xl font-display font-extrabold text-white">
                                Saved Courses
                            </h2>
                            <p className="mt-1 text-sm text-white/55">
                                Courses you saved to come back to later.
                            </p>
                        </div>

                        {savedCourses.length > 0 ? (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {savedCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        enrolled={enrolledSet.has(course.id)}
                                        completed={completedSet.has(course.id)}
                                        saved={true}
                                        onToggleSaved={toggleSavedCourse}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b223d] px-6 py-16 text-center">
                                <Bookmark className="mx-auto h-10 w-10 text-blue-300/50" />
                                <h3 className="mt-4 text-base font-bold text-white">
                                    No saved courses yet
                                </h3>
                                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-white/50">
                                    Browse All Courses and tap “Save course” on any course you want to keep here.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setView('catalogue')}
                                    className="mt-5 rounded-lg bg-blue-500 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-400"
                                >
                                    Explore courses
                                </button>
                            </div>
                        )}
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

                            <h2 className="mt-1 text-2xl font-display font-extrabold text-foreground">
                                Your Learning Streak
                            </h2>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            <div className="rounded-2xl border border-orange-100 bg-card p-7 shadow-sm">
                                <Flame className="h-7 w-7 text-orange-500" />

                                <p className="mt-5 text-3xl font-black text-foreground">
                                    —
                                </p>

                                <p className="text-sm text-muted-foreground">
                                    Current streak
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
                                <Target className="h-7 w-7 text-primary" />

                                <p className="mt-5 text-3xl font-black text-foreground">
                                    {completedCount}
                                </p>

                                <p className="text-sm text-muted-foreground">
                                    Courses completed
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
                                <BarChart2 className="h-7 w-7 text-blue-600" />

                                <p className="mt-5 text-3xl font-black text-foreground">
                                    —
                                </p>

                                <p className="text-sm text-muted-foreground">
                                    Hours learned
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-border bg-card p-7">
                            <p className="text-xs leading-5 text-muted-foreground">
                                Day streak and hours learned require learning-activity timestamps from the backend. The dashboard will use those values once they are exposed by your Learn data layer.
                            </p>
                        </div>

                        <div className="mt-4 rounded-2xl border border-border bg-card p-7">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground" />

                                <div>
                                    <h3 className="text-sm font-bold text-foreground">
                                        Build the habit
                                    </h3>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Even a few minutes of learning each day
                                        compounds over time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}</div>}
            </main>
        </div>
    )
}
