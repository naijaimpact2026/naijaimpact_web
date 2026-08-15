import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { fetchCourseById } from '@/lib/actions/learn'
import { createClient } from '@/lib/supabase/server'
import EnrolButton from '@/components/app/learn/EnrolButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookOpen, GraduationCap, Video, CheckCircle2 } from 'lucide-react'
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

    const result = await fetchCourseById(courseId)
    if (!result) notFound()

    const { course, enrollment } = result

    const outline = Array.isArray(course.course_outline) ? course.course_outline : []
    const totalLessons = outline.reduce((s, sec) => s + (Array.isArray(sec.lessons) ? sec.lessons.length : 0), 0)
    const isEnrolled = enrollment !== null
    const isCreator = profile?.id === course.user_id
    const amount = typeof course.amount === 'number' ? course.amount : 0
    const coverUrl = toPublicStorageUrl(course.cover_image_url)

    return (
        <div className="bg-[#f0f2f5] min-h-screen">
            {/* Dark green hero */}
            <div className="relative overflow-hidden py-7 px-5"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle,#4ade80,transparent)' }} />
                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Breadcrumb */}
                    <p className="text-green-400/60 text-xs mb-3">
                        <Link href="/app/learn" className="hover:text-green-300 transition-colors">Learn</Link>
                        {' '}/ <span className="text-green-300/80">{course.title}</span>
                    </p>
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            {course.category_name && (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-green-200 mb-2">
                                    {course.category_name}
                                </span>
                            )}
                            <h1 className="text-2xl font-black text-white leading-tight">{course.title}</h1>
                            {course.description && (
                                <p className="text-green-300/70 text-sm mt-2 line-clamp-2">{course.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-3 text-xs text-green-300/60">
                                <span className="flex items-center gap-1">
                                    <BookOpen className="w-3.5 h-3.5" /> {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                                </span>
                                <span>·</span>
                                <span className={`font-bold ${course.is_free ? 'text-emerald-400' : 'text-yellow-300'}`}>
                                    {course.is_free ? 'Free' : `₦${amount.toLocaleString('en-NG')}`}
                                </span>
                                {isEnrolled && (
                                    <>
                                        <span>·</span>
                                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        {isCreator && (
                            <Link href={`/app/learn/create`}
                                className="shrink-0 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors">
                                Edit
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left column */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Cover / intro video */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="relative aspect-video bg-gray-50">
                            {coverUrl ? (
                                <Image src={coverUrl} alt={course.title} fill
                                    className="object-cover" sizes="(max-width: 1024px) 100vw, 66vw"
                                    priority
                                    unoptimized={!!coverUrl && coverUrl.includes('supabase.co')} />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                    <GraduationCap className="w-16 h-16 text-white/20" />
                                </div>
                            )}
                            {course.video_url && (
                                <div className="absolute bottom-3 left-3">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold">
                                        <Video className="w-3 h-3" /> Preview Available
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* About */}
                    {course.description && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h2 className="font-bold text-gray-900 mb-2">About this Course</h2>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{course.description}</p>
                        </div>
                    )}

                    {/* Curriculum */}
                    {outline.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-green-700" />
                                <span className="font-bold text-gray-900">Course Content</span>
                                <span className="ml-auto text-xs text-gray-400">
                                    {outline.length} section{outline.length !== 1 ? 's' : ''} · {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {outline.map((section, si) => (
                                    <details key={si} open={si === 0} className="group">
                                        <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                                                    style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                                    {si + 1}
                                                </div>
                                                <span className="font-semibold text-gray-800 text-sm">{section.title}</span>
                                                <span className="text-[11px] text-gray-400">
                                                    {Array.isArray(section.lessons) ? section.lessons.length : 0} lesson{(section.lessons?.length ?? 0) !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </summary>
                                        <div className="px-5 pb-3 space-y-1.5 ml-9">
                                            {(section.lessons ?? []).map((lesson, li) => (
                                                <div key={li} className="flex items-center gap-2 py-1.5 text-sm text-gray-600">
                                                    <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-400 shrink-0">
                                                        {li + 1}
                                                    </span>
                                                    <span className="flex-1 truncate">{lesson.title}</span>
                                                    {lesson.video_url && <Video className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Instructor */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="font-bold text-gray-900 mb-4">About the Instructor</h2>
                        <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 shrink-0">
                                <AvatarImage src={course.instructor.avatar_url ?? undefined} />
                                <AvatarFallback className="bg-green-100 text-green-700 font-bold text-lg">
                                    {course.instructor.display_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-gray-900">{course.instructor.display_name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Course instructor</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column — enrol card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <div className="text-center">
                            <p className={`text-3xl font-black ${course.is_free ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {course.is_free ? 'Free' : `₦${amount.toLocaleString('en-NG')}`}
                            </p>
                            {course.is_free && (
                                <p className="text-xs text-gray-400 mt-1">No credit card required</p>
                            )}
                        </div>

                        <EnrolButton
                            courseId={courseId}
                            amount={amount}
                            isFree={course.is_free}
                            alreadyEnrolled={isEnrolled}
                        />

                        <div className="pt-3 border-t border-gray-50 space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">This course includes:</p>
                            <div className="space-y-1.5 text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5 text-green-700" />
                                    {totalLessons} on-demand lesson{totalLessons !== 1 ? 's' : ''}
                                </div>
                                {outline.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="w-3.5 h-3.5 text-green-700" />
                                        {outline.length} section{outline.length !== 1 ? 's' : ''}
                                    </div>
                                )}
                                {course.video_url && (
                                    <div className="flex items-center gap-2">
                                        <Video className="w-3.5 h-3.5 text-green-700" />
                                        Preview video available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
