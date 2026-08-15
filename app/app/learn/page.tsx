import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchCourses, fetchCategories } from '@/lib/actions/learn'
import LearnHubHome from '@/components/app/learn/LearnHubHome'

export const dynamic = 'force-dynamic'

interface LearnPageProps
{
    searchParams: Promise<{ track?: string; category?: string; view?: string }>
}

export default async function LearnPage({ searchParams }: LearnPageProps)
{
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users')
        .select('id, display_name, avatar_url')
        .eq('auth_id', user.id)
        .single()

    const userId = profile?.id ?? ''

    const activeCategoryId = params.category && params.category !== 'all'
        ? params.category
        : null

    // Fetch categories + initial courses in parallel
    const [categories, { courses: initialCourses, nextCursor }] = await Promise.all([
        fetchCategories(),
        fetchCourses(null, 24, activeCategoryId),
    ])

    // Fetch enrollment data — use profile.id (users table pk), not auth uid
    const { data: enrollments } = userId
        ? await supabase
            .from('lms_courses_enrollment')
            .select('course_id, status, progress, last_lesson_id')
            .eq('user_id', userId)
        : { data: [] }

    const allEnrollments = enrollments ?? []
    // Both 'enrolled' and 'completed' count as enrolled; only 'completed' counts as complete
    const enrolledCount = allEnrollments.filter(e => ['enrolled', 'completed'].includes(e.status)).length
    const completedCount = allEnrollments.filter(e => e.status === 'completed').length
    // In-progress = enrolled but not yet completed
    const inProgressIds = allEnrollments
        .filter(e => e.status === 'enrolled')
        .map(e => e.course_id)
    const completedIds = allEnrollments
        .filter(e => e.status === 'completed')
        .map(e => e.course_id)

    return (
        <LearnHubHome
            initialCourses={initialCourses}
            initialNextCursor={nextCursor}
            categories={categories}
            activeCategoryId={activeCategoryId}
            displayName={profile?.display_name ?? 'Learner'}
            avatarUrl={profile?.avatar_url ?? null}
            enrolledCount={enrolledCount}
            completedCount={completedCount}
            inProgressCourseIds={inProgressIds}
            completedCourseIds={completedIds}
            view={params.view ?? null}
        />
    )
}
