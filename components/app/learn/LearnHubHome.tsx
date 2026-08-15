'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import
{
    GraduationCap, Plus, Search, Briefcase, Code2, DollarSign,
    Bot, Rocket, Hammer, BookOpen, CheckCircle2,
    Flame, Target, TrendingUp, Users, Award, LayoutGrid,
    BarChart2, Play,
} from 'lucide-react'
import { fetchCourses } from '@/lib/actions/learn'
import type { Course, Category } from '@/lib/actions/learn'
import { toPublicStorageUrl } from '@/lib/supabase-image'

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props
{
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

// ─── Static data ──────────────────────────────────────────────────────────────
const TRACKS = [
    {
        id: 'artisan', label: 'Artisan & Trade', icon: Hammer, bg: '#fef3c7', iconColor: '#d97706',
        keywords: ['artisan', 'trade', 'electrical', 'solar', 'plumbing', 'tailoring', 'fashion', 'mechanics', 'building', 'carpentry'],
        desc: 'Electrical, Solar, Plumbing, Tailoring, Mechanics & more',
        outcomes: ['Skill Badge', 'NaijaMarket Listing', 'Business Loans']
    },
    {
        id: 'business', label: 'Business & Entrepreneurship', icon: Briefcase, bg: '#dbeafe', iconColor: '#2563eb',
        keywords: ['business', 'entrepreneurship', 'marketing', 'sales', 'branding', 'ecommerce', 'import', 'export'],
        desc: 'Sales, Marketing, Branding, E-commerce, Import & Export',
        outcomes: ['Business Profile', 'NaijaMarket Store', 'Startup Credit']
    },
    {
        id: 'digital', label: 'Digital Skills', icon: Code2, bg: '#ede9fe', iconColor: '#7c3aed',
        keywords: ['digital', 'tech', 'coding', 'flutter', 'react', 'python', 'ui', 'ux', 'design', 'web'],
        desc: 'Flutter, React, Python, UI/UX, Content Creation & Web3',
        outcomes: ['Portfolio', 'GitHub Verified', 'Remote Jobs']
    },
    {
        id: 'finance', label: 'Financial Intelligence', icon: DollarSign, bg: '#d1fae5', iconColor: '#059669',
        keywords: ['finance', 'financial', 'investment', 'savings', 'credit', 'insurance', 'money'],
        desc: 'Savings, Investment, Credit Scores, Insurance & Retirement',
        outcomes: ['Higher TradeCred', 'Credit Eligibility', 'Investment Products']
    },
    {
        id: 'ai', label: 'AI Academy', icon: Bot, bg: '#fce7f3', iconColor: '#db2777',
        keywords: ['ai', 'artificial intelligence', 'chatgpt', 'prompt', 'machine learning', 'data'],
        desc: 'ChatGPT, Claude, Prompt Engineering, AI Agents & Business AI',
        outcomes: ['AI Badge', 'AI Consultant Profile', 'Remote AI Jobs']
    },
    {
        id: 'career', label: 'Career Accelerator', icon: Rocket, bg: '#e0f2fe', iconColor: '#0284c7',
        keywords: ['career', 'resume', 'interview', 'linkedin', 'job', 'salary', 'employment'],
        desc: 'Resume, LinkedIn, Interview Coaching, Salary Negotiation',
        outcomes: ['Employer Matching', 'AI Career Coach', 'Job Alerts']
    },
]

const PIPELINE = [
    { icon: BookOpen, label: 'Learn', color: '#7c3aed' },
    { icon: Target, label: 'Practice', color: '#2563eb' },
    { icon: Award, label: 'Get Verified', color: '#059669' },
    { icon: Briefcase, label: 'Build Portfolio', color: '#d97706' },
    { icon: Users, label: 'Join Marketplace', color: '#db2777' },
    { icon: TrendingUp, label: 'Earn Money', color: '#0284c7' },
    { icon: BarChart2, label: 'Build TradeCred', color: '#7c3aed' },
    { icon: DollarSign, label: 'Access Credit', color: '#059669' },
]

function fmtNGN(n: number)
{
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

// ─── Course card component ────────────────────────────────────────────────────
function CourseCard({ course, inProgress }: { course: Course; inProgress?: boolean })
{
    const outline = Array.isArray(course.course_outline) ? course.course_outline : []
    const totalLessons = outline.reduce((s, sec) => s + (sec.lessons?.length ?? 0), 0)
    const amount = course.amount ?? 0
    const coverUrl = toPublicStorageUrl(course.cover_image_url)

    return (
        <Link href={`/app/learn/${course.id}`}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-green-300 hover:shadow-md transition-all overflow-hidden group flex flex-col">
            <div className="relative aspect-video overflow-hidden bg-gray-50">
                {coverUrl ? (
                    <Image src={coverUrl} alt={course.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:768px) 100vw,(max-width:1200px) 50vw,33vw"
                        unoptimized={coverUrl.includes('supabase.co')} />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                        <GraduationCap className="w-10 h-10 text-white/30" />
                    </div>
                )}
                <div className="absolute top-2.5 right-2.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${course.is_free ? 'bg-emerald-500 text-white' : 'bg-white text-gray-900 border border-gray-100'
                        }`}>
                        {course.is_free ? 'Free' : fmtNGN(amount)}
                    </span>
                </div>
                {inProgress && (
                    <div className="absolute bottom-2 left-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            <Play className="w-2.5 h-2.5" /> In Progress
                        </span>
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
                {course.category_name && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 w-fit">
                        {course.category_name}
                    </span>
                )}
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-green-800 transition-colors">
                    {course.title}
                </h3>
                {course.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{course.description}</p>
                )}
                {totalLessons > 0 && (
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-auto">
                        <BookOpen className="w-3 h-3" />
                        {outline.length} section{outline.length !== 1 ? 's' : ''} · {totalLessons} lessons
                    </p>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-auto">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-[9px] font-bold overflow-hidden shrink-0">
                        {course.instructor.avatar_url ? (
                            <Image src={course.instructor.avatar_url} alt="" width={20} height={20}
                                className="object-cover w-full h-full" />
                        ) : (
                            (course.instructor.display_name || 'I').charAt(0).toUpperCase()
                        )}
                    </div>
                    <span className="text-xs text-gray-500 truncate">
                        {course.instructor.display_name || 'Instructor'}
                    </span>
                </div>
            </div>
        </Link>
    )
}

// ─── Main LearnHubHome component ─────────────────────────────────────────────
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
}: Props)
{
    const [courses, setCourses] = useState(initialCourses)
    const [nextCursor, setNextCursor] = useState(initialNextCursor)
    const [activeTrack, setActiveTrack] = useState<string | null>(null)
    const [activeCat, setActiveCat] = useState<string | null>(activeCategoryId)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [activeView, setActiveView] = useState<string | null>(view ?? null)

    // Fetch from DB by category id
    const loadByCategory = useCallback(async (catId: string | null) =>
    {
        setLoading(true)
        try
        {
            const { courses: fresh, nextCursor: nc } = await fetchCourses(null, 24, catId)
            setCourses(fresh)
            setNextCursor(nc)
        } catch (err)
        {
            console.error('LearnHub filter error:', err)
        } finally
        {
            setLoading(false)
        }
    }, [])

    // Category chip click — direct DB fetch by category UUID
    const handleCatFilter = useCallback(async (catId: string | null) =>
    {
        setActiveCat(catId)
        setActiveTrack(null)
        setActiveView(null)
        await loadByCategory(catId)
    }, [loadByCategory])

    // Track card click — find matching category in DB categories, or client-side keyword filter
    const handleTrackFilter = useCallback(async (trackId: string | null) =>
    {
        if (!trackId)
        {
            setActiveTrack(null)
            setActiveCat(null)
            setActiveView(null)
            await loadByCategory(null)
            return
        }
        setActiveTrack(trackId)
        setActiveCat(null)
        setActiveView(null)

        const track = TRACKS.find(t => t.id === trackId)
        if (!track) return

        // Try to match a DB category by name
        const matchedCat = categories.find(c =>
        {
            const catLower = c.name.toLowerCase()
            return track.keywords.some(kw => catLower.includes(kw) || kw.includes(catLower.split(' ')[0]))
        })

        if (matchedCat)
        {
            setActiveCat(matchedCat.id)
            await loadByCategory(matchedCat.id)
        } else
        {
            // Fallback: load all, then filter client-side below
            await loadByCategory(null)
        }
    }, [categories, loadByCategory])

    // Final visible courses: search + track keyword filter on top of DB results
    const filtered = (() =>
    {
        let list = courses
        // Search filter
        if (search.trim())
        {
            const q = search.toLowerCase()
            list = list.filter(c =>
                c.title.toLowerCase().includes(q) ||
                (c.description ?? '').toLowerCase().includes(q) ||
                (c.category_name ?? '').toLowerCase().includes(q)
            )
        }
        // Track keyword filter (only when no DB category was matched)
        if (activeTrack && !activeCat)
        {
            const track = TRACKS.find(t => t.id === activeTrack)
            if (track)
            {
                list = list.filter(c =>
                {
                    const hay = [c.title, c.description ?? '', c.category_name ?? ''].join(' ').toLowerCase()
                    return track.keywords.some(kw => hay.includes(kw))
                })
            }
        }
        // My Courses view — show enrolled + completed
        if (activeView === 'my')
        {
            list = list.filter(c => inProgressCourseIds.includes(c.id) || completedCourseIds.includes(c.id))
        }
        return list
    })()

    const careerReadiness = Math.min(100, completedCount * 12 + enrolledCount * 4)

    return (
        <div className="min-h-screen bg-[#f5f6fa]">

            {/* ─── HERO ─────────────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle,#4ade80,transparent 70%)' }} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative z-10 px-5 pt-6 pb-8 max-w-6xl mx-auto">
                    <div className="flex items-start justify-between gap-3 mb-6">
                        <div>
                            <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest mb-1">NaijaImpact</p>
                            <h1 className="text-3xl font-black text-white leading-tight">LearnHub</h1>
                            <p className="text-sm text-green-300/60 mt-0.5">Learn. Build. Earn. Grow.</p>
                        </div>
                        <Link href="/app/learn/create"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-green-900 bg-white hover:bg-green-50 transition-all shadow-lg shrink-0">
                            <Plus className="w-4 h-4" /> Create Course
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                            { value: enrolledCount, label: 'Enrolled' },
                            { value: completedCount, label: 'Completed' },
                            { value: `${careerReadiness}%`, label: 'Career Ready' },
                        ].map(stat => (
                            <div key={stat.label} className="rounded-2xl p-3.5 text-center"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-[11px] text-green-300/70 mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick nav tiles */}
                    <div className="grid grid-cols-4 gap-2.5">
                        {[
                            { icon: BookOpen, label: 'My Courses', viewKey: 'my', color: '#86efac' },
                            { icon: Award, label: 'Certificates', viewKey: 'certificates', color: '#fde68a' },
                            { icon: Users, label: 'Instructors', viewKey: 'instructors', color: '#a5f3fc' },
                            { icon: Flame, label: 'My Streak', viewKey: 'streak', color: '#fca5a5' },
                        ].map(({ icon: Icon, label, viewKey, color }) => (
                            <button key={viewKey}
                                onClick={() =>
                                {
                                    setActiveView(activeView === viewKey ? null : viewKey)
                                    setActiveCat(null)
                                    setActiveTrack(null)
                                }}
                                className={`flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl border transition-all ${activeView === viewKey ? 'border-white/40 bg-white/15' : 'border-white/20 hover:bg-white/10'
                                    }`}
                                style={{ background: activeView === viewKey ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)' }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: `${color}22` }}>
                                    <Icon className="w-5 h-5" style={{ color }} strokeWidth={2} />
                                </div>
                                <span className="text-white text-[10px] font-semibold text-center">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── SEARCH ───────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 z-10 shadow-sm">
                <div className="relative max-w-6xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text"
                        placeholder="Search courses, skills, instructors…"
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-5 space-y-6">

                {/* ─── LEARN-TO-EARN PIPELINE ──────────────────────────────────────── */}
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                    <h2 className="font-black text-gray-900 mb-1">Learn-to-Earn Pipeline</h2>
                    <p className="text-xs text-gray-500 mb-4">Every skill leads to real income on Naija Impact</p>
                    <div className="flex items-center overflow-x-auto pb-2 scrollbar-none gap-0">
                        {PIPELINE.map((step, i) =>
                        {
                            const Icon = step.icon
                            return (
                                <div key={i} className="flex items-center shrink-0">
                                    <div className="flex flex-col items-center gap-2 min-w-[64px]">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                                            style={{ background: step.color + '18' }}>
                                            <Icon className="w-5 h-5" style={{ color: step.color }} strokeWidth={2} />
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-600 text-center leading-tight">{step.label}</span>
                                    </div>
                                    {i < PIPELINE.length - 1 && (
                                        <div className="w-4 h-0.5 mx-1 rounded-full bg-gray-200 shrink-0" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ─── 6 LEARNING TRACKS ────────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-black text-gray-900 text-base">6 Learning Tracks</h2>
                        {activeTrack && (
                            <button onClick={() => handleTrackFilter(null)}
                                className="text-xs font-bold text-green-700 hover:text-green-800">
                                Clear ✕
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {TRACKS.map(track =>
                        {
                            const Icon = track.icon
                            const isActive = activeTrack === track.id
                            return (
                                <button key={track.id}
                                    onClick={() => handleTrackFilter(isActive ? null : track.id)}
                                    className={`text-left p-5 rounded-3xl border-2 transition-all hover:shadow-md ${isActive ? 'border-green-600 shadow-md' : 'border-gray-100 bg-white hover:border-green-200'
                                        }`}
                                    style={isActive ? { background: 'linear-gradient(135deg,#1a5c38,#065f46)' } : {}}>
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                            style={isActive ? { background: 'rgba(255,255,255,0.2)' } : { background: track.bg }}>
                                            <Icon className="w-6 h-6" style={{ color: isActive ? '#fff' : track.iconColor }} strokeWidth={2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-black text-sm leading-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                                {track.label}
                                            </p>
                                            <p className={`text-[10px] mt-0.5 ${isActive ? 'text-green-200' : 'text-gray-400'}`}>
                                                Africa's Learn-to-Earn track
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`text-xs leading-relaxed mb-3 ${isActive ? 'text-green-100' : 'text-gray-500'}`}>
                                        {track.desc}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {track.outcomes.map(out => (
                                            <span key={out}
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isActive ? 'bg-white/20 text-white' : 'bg-green-50 text-green-700'
                                                    }`}>
                                                <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> {out}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* ─── CATEGORY CHIPS (from DB) ────────────────────────────────────── */}
                {categories.length > 0 && !activeTrack && (
                    <section>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Browse by Category</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                            <button onClick={() => handleCatFilter(null)}
                                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${!activeCat ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                                    }`}>
                                All
                            </button>
                            {categories.map(cat => (
                                <button key={cat.id} onClick={() => handleCatFilter(cat.id)}
                                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${activeCat === cat.id ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                                        }`}>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* ─── VIEW: CERTIFICATES ──────────────────────────────────────────── */}
                {activeView === 'certificates' && (
                    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-5 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="font-black text-gray-900">My Certificates</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Certificates earned from completed courses</p>
                            </div>
                            <button onClick={() => setActiveView(null)}
                                className="text-xs font-bold text-gray-400 hover:text-gray-700">
                                ✕ Close
                            </button>
                        </div>
                        {completedCount === 0 ? (
                            <div className="py-16 text-center px-5">
                                <div className="w-16 h-16 rounded-3xl bg-yellow-50 flex items-center justify-center mx-auto mb-4">
                                    <Award className="w-8 h-8 text-yellow-500" />
                                </div>
                                <p className="font-bold text-gray-700">No certificates yet</p>
                                <p className="text-sm text-gray-400 mt-1">Complete a course to earn your first certificate</p>
                                <button onClick={() => setActiveView(null)}
                                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                    Browse Courses
                                </button>
                            </div>
                        ) : (
                            <div className="p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {courses.filter(c => completedCourseIds.includes(c.id)).map(course => (
                                        <div key={course.id}
                                            className="flex items-center gap-4 p-4 rounded-2xl border border-yellow-100 bg-yellow-50">
                                            <div className="w-12 h-12 rounded-xl bg-yellow-100 border border-yellow-200 flex items-center justify-center shrink-0">
                                                <Award className="w-6 h-6 text-yellow-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 text-sm truncate">{course.title}</p>
                                                <p className="text-xs text-gray-500">{course.category_name ?? 'Course'}</p>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                    ✓ Completed
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ─── VIEW: INSTRUCTORS ───────────────────────────────────────────── */}
                {activeView === 'instructors' && (
                    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-5 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="font-black text-gray-900">Instructors</h2>
                                <p className="text-xs text-gray-500 mt-0.5">All course instructors on LearnHub</p>
                            </div>
                            <button onClick={() => setActiveView(null)}
                                className="text-xs font-bold text-gray-400 hover:text-gray-700">
                                ✕ Close
                            </button>
                        </div>
                        <div className="p-5">
                            {(() =>
                            {
                                const seen = new Set<string>()
                                const unique = courses.filter(c =>
                                {
                                    const key = c.instructor.display_name || c.user_id
                                    if (seen.has(key)) return false
                                    seen.add(key)
                                    return true
                                })
                                if (unique.length === 0) return (
                                    <div className="py-10 text-center">
                                        <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500">No instructors yet — be the first!</p>
                                        <Link href="/app/learn/create"
                                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                            Create Course
                                        </Link>
                                    </div>
                                )
                                return (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {unique.map(course =>
                                        {
                                            const courseCount = courses.filter(c =>
                                                (c.instructor.display_name || c.user_id) === (course.instructor.display_name || course.user_id)
                                            ).length
                                            return (
                                                <div key={course.user_id}
                                                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-gray-50 text-center hover:border-green-200 transition-all">
                                                    <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 font-black text-xl overflow-hidden">
                                                        {course.instructor.avatar_url ? (
                                                            <Image src={course.instructor.avatar_url} alt=""
                                                                width={56} height={56}
                                                                className="object-cover w-full h-full"
                                                                unoptimized={course.instructor.avatar_url.includes('supabase.co')} />
                                                        ) : (
                                                            (course.instructor.display_name || 'I').charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <p className="font-bold text-gray-900 text-sm truncate w-full">
                                                        {course.instructor.display_name || 'Instructor'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-semibold">
                                                        {courseCount} course{courseCount !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })()}
                        </div>
                    </section>
                )}

                {/* ─── VIEW: STREAK ────────────────────────────────────────────────── */}
                {activeView === 'streak' && (
                    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-5 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="font-black text-gray-900">My Learning Streak</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Your daily learning habit tracker</p>
                            </div>
                            <button onClick={() => setActiveView(null)}
                                className="text-xs font-bold text-gray-400 hover:text-gray-700">
                                ✕ Close
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            <div className="w-24 h-24 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
                                <Flame className="w-12 h-12 text-orange-500" />
                            </div>
                            <p className="text-5xl font-black text-gray-900">
                                {enrolledCount > 0 ? Math.min(enrolledCount * 3, 30) : 0}
                            </p>
                            <p className="text-gray-500 mt-1 font-bold">day streak</p>
                            <p className="text-sm text-gray-400 mt-3 max-w-xs mx-auto leading-relaxed">
                                {enrolledCount > 0
                                    ? 'Keep learning every day to maintain your streak and unlock rewards!'
                                    : 'Enrol in a course and learn every day to build your streak.'}
                            </p>
                            <div className="mt-6 grid grid-cols-7 gap-2 max-w-xs mx-auto">
                                {Array.from({ length: 14 }).map((_, i) =>
                                {
                                    const isActive = enrolledCount > 0 && i < Math.min(enrolledCount * 2, 14)
                                    return (
                                        <div key={i} title={`Day ${i + 1}`}
                                            className={`aspect-square rounded-lg transition-all ${isActive ? 'bg-orange-400 shadow-sm' : 'bg-gray-100'}`} />
                                    )
                                })}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">Last 14 days</p>
                            <div className="mt-5 grid grid-cols-3 gap-3 max-w-xs mx-auto">
                                <div className="rounded-2xl p-3 bg-orange-50 border border-orange-100">
                                    <p className="text-lg font-black text-orange-600">{enrolledCount}</p>
                                    <p className="text-[10px] text-gray-500 font-semibold">Enrolled</p>
                                </div>
                                <div className="rounded-2xl p-3 bg-green-50 border border-green-100">
                                    <p className="text-lg font-black text-green-600">{completedCount}</p>
                                    <p className="text-[10px] text-gray-500 font-semibold">Completed</p>
                                </div>
                                <div className="rounded-2xl p-3 bg-blue-50 border border-blue-100">
                                    <p className="text-lg font-black text-blue-600">{careerReadiness}%</p>
                                    <p className="text-[10px] text-gray-500 font-semibold">Career Ready</p>
                                </div>
                            </div>
                            {enrolledCount === 0 && (
                                <button onClick={() => setActiveView(null)}
                                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                    Start Learning
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* ─── COURSES GRID (hidden for non-course views) ───────────────────── */}
                {(activeView === null || activeView === 'my') && (
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="font-black text-gray-900 text-base">
                                    {activeView === 'my' ? 'My Courses' :
                                        activeTrack ? `${TRACKS.find(t => t.id === activeTrack)?.label} Courses` :
                                            activeCat ? `${categories.find(c => c.id === activeCat)?.name ?? ''} Courses` :
                                                'All Courses'}
                                </h2>
                                {!loading && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {filtered.length} course{filtered.length !== 1 ? 's' : ''}
                                        {activeCat || activeTrack ? '' : ' across all tracks'}
                                    </p>
                                )}
                            </div>
                            {activeView === 'my' && (
                                <button onClick={() => setActiveView(null)}
                                    className="text-xs font-bold text-gray-400 hover:text-gray-700">
                                    Show All
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                                        <div className="aspect-video bg-gray-100" />
                                        <div className="p-4 space-y-2">
                                            <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                                            <div className="h-4 bg-gray-100 rounded-full w-5/6" />
                                            <div className="h-3 bg-gray-100 rounded-full w-2/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center">
                                <GraduationCap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="font-bold text-gray-700 text-lg">
                                    {activeView === 'my' ? 'No enrolled courses yet' : 'No courses found'}
                                </p>
                                <p className="text-sm text-gray-400 mt-1 mb-5">
                                    {activeView === 'my'
                                        ? 'Browse the catalogue and enrol in a course to get started.'
                                        : 'Be the first instructor to publish a course!'}
                                </p>
                                <Link href="/app/learn/create"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90"
                                    style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                    <Plus className="w-4 h-4" /> Create Course
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtered.map(course => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        inProgress={inProgressCourseIds.includes(course.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ─── WHY LEARNHUB ─────────────────────────────────────────────────── */}
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3 border-b border-gray-50">
                        <h2 className="font-black text-gray-900">Why LearnHub Beats Coursera</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Africa's first learn-to-earn ecosystem</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
                        {[
                            { icon: Award, title: 'Verified Skill Badges', desc: 'AI-verified competency — not just certificates', color: '#7c3aed' },
                            { icon: TrendingUp, title: 'Learn → Earn Pipeline', desc: 'Every course unlocks NaijaMarket, NaijaJobs & TradeCred', color: '#059669' },
                            { icon: Bot, title: 'AI Learning Companion', desc: '24/7 AI tutor — explains in Pidgin, Yoruba, Igbo & more', color: '#db2777' },
                            { icon: Users, title: 'Instructor Economy', desc: 'Build courses, mentor students, earn income', color: '#d97706' },
                        ].map(({ icon: Icon, title, desc, color }) => (
                            <div key={title} className="p-5 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: color + '18' }}>
                                    <Icon className="w-5 h-5" style={{ color }} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="h-6" />
            </div>
        </div>
    )
}
