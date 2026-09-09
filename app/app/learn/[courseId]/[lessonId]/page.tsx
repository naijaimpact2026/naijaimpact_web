import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { fetchLesson, fetchCourseById } from '@/lib/actions/learn'
import { createClient } from '@/lib/supabase/server'
import LessonPlayer from '@/components/app/learn/LessonPlayer'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface LessonPageProps {
    params: Promise<{
        courseId: string
        lessonId: string
    }>
}

export default async function LessonPage({ params }: LessonPageProps) {
    const { courseId, lessonId } = await params

    // Auth check
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const lessonData = await fetchLesson(courseId, lessonId)

    if (!lessonData) {
        notFound()
    }

    const {
        lesson,
        prevLesson,
        nextLesson,
        enrollment,
        totalLessons,
        courseTitle,
    } = lessonData

    // Only enrolled learners can access lessons
    if (!enrollment) {
        redirect(`/app/learn/${courseId}`)
    }

    // Fetch the course structure for the curriculum sidebar
    const courseResult = await fetchCourseById(courseId)
    const sections = courseResult?.sections ?? []

    return (
        <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Main player */}
                <div className="lg:col-span-3">
                    <LessonPlayer
                        courseId={courseId}
                        lesson={lesson}
                        prevLesson={prevLesson}
                        nextLesson={nextLesson}
                        enrollment={enrollment}
                        totalLessons={totalLessons}
                        courseTitle={courseTitle}
                    />
                </div>

                {/* Course curriculum */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 bento-card noise-bg p-4 space-y-3 max-h-[calc(100vh-6rem)] overflow-y-auto">

                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <h2 className="font-semibold text-sm">
                                Course Lessons
                            </h2>
                        </div>

                        {/* Course progress */}
                        <div className="space-y-1">
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                                    style={{
                                        width: `${enrollment.progress}%`,
                                    }}
                                />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {enrollment.progress}% complete
                            </p>
                        </div>

                        {/* Sections */}
                        <div className="space-y-3">
                            {sections.map((section, sIdx) => (
                                <div key={section.id}>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                                        {sIdx + 1}. {section.title}
                                    </p>

                                    <div className="space-y-0.5">
                                        {section.lessons.map((l, lIdx) => {
                                            const isActive = l.id === lessonId
                                            const isLastWatched =
                                                enrollment.last_lesson_id === l.id

                                            return (
                                                <Link
                                                    key={l.id}
                                                    href={`/app/learn/${courseId}/${l.id}`}
                                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                                        isActive
                                                            ? 'bg-primary/15 text-primary font-semibold'
                                                            : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    <span className="shrink-0 w-4 text-center opacity-60">
                                                        {lIdx + 1}
                                                    </span>

                                                    <span className="flex-1 line-clamp-2">
                                                        {l.title}
                                                    </span>

                                                    {isLastWatched && !isActive && (
                                                        <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-1 py-0 shrink-0">
                                                            Last
                                                        </Badge>
                                                    )}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}