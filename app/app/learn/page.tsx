import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
    fetchCourses,
    fetchCategories,
} from '@/lib/actions/learn'
import { fetchFeaturedFunding } from '@/lib/actions/funding-ads'
import LearnHubHome from '@/components/app/learn/LearnHubHome'

export const dynamic = 'force-dynamic'

interface LearnPageProps
{
    searchParams: Promise<{
        track?: string
        category?: string
        view?: string
    }>
}

export default async function LearnPage({
    searchParams,
}: LearnPageProps)
{
    const params = await searchParams

    const supabase = await createClient()

    // ─────────────────────────────────────────────────────────────
    // AUTHENTICATION
    // ─────────────────────────────────────────────────────────────

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user)
    {
        redirect('/auth/login')
    }

    // ─────────────────────────────────────────────────────────────
    // LEARNER PROFILE
    // ─────────────────────────────────────────────────────────────

    const { data: profile } = await supabase
        .from('users')
        .select('id, display_name, avatar_url')
        .eq('auth_id', user.id)
        .single()

    const userId = profile?.id ?? ''

    // ─────────────────────────────────────────────────────────────
    // FILTER
    // ─────────────────────────────────────────────────────────────

    const activeCategoryId =
        params.category && params.category !== 'all'
            ? params.category
            : null

    // ─────────────────────────────────────────────────────────────
    // INITIAL CATALOG DATA
    // ─────────────────────────────────────────────────────────────

    const [
        categories,
        {
            courses: initialCourses,
            nextCursor,
        },
    ] = await Promise.all([
        fetchCategories(),
        fetchCourses(
            null,
            24,
            activeCategoryId
        ),
    ])

    // ─────────────────────────────────────────────────────────────
    // ENROLLMENTS
    // ─────────────────────────────────────────────────────────────

    const { data: enrollments } = userId
        ? await supabase
            .from('lms_courses_enrollment')
            .select(
                'course_id, status, progress, last_lesson_id'
            )
            .eq('user_id', userId)
        : { data: [] }

    const allEnrollments = enrollments ?? []

    // Both enrolled and completed courses count toward
    // the learner's enrolled-course total.
    const enrolledCount = allEnrollments.filter(
        enrollment =>
            ['enrolled', 'completed'].includes(
                enrollment.status
            )
    ).length

    const completedCount = allEnrollments.filter(
        enrollment =>
            enrollment.status === 'completed'
    ).length

    // Courses currently being taken.
    const inProgressCourseIds = allEnrollments
        .filter(
            enrollment =>
                enrollment.status === 'enrolled'
        )
        .map(enrollment => enrollment.course_id)

    // Courses already completed.
    const completedCourseIds = allEnrollments
        .filter(
            enrollment =>
                enrollment.status === 'completed'
        )
        .map(enrollment => enrollment.course_id)

    // ─────────────────────────────────────────────────────────────
    // CONTINUE LEARNING — real progress ring, not fabricated.
    // Picks the in-progress enrollment with the most progress made.
    // ─────────────────────────────────────────────────────────────

    const mostAdvanced = allEnrollments
        .filter(e => e.status === 'enrolled' && (e.progress ?? 0) > 0)
        .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))[0]

    let continueLearning: {
        courseId: string
        title: string
        coverImageUrl: string | null
        progress: number
    } | null = null

    if (mostAdvanced)
    {
        const { data: courseRow } = await supabase
            .from('lms_courses')
            .select('id, title, cover_image_url')
            .eq('id', mostAdvanced.course_id)
            .maybeSingle()

        if (courseRow)
        {
            continueLearning = {
                courseId: courseRow.id,
                title: courseRow.title,
                coverImageUrl: courseRow.cover_image_url,
                progress: mostAdvanced.progress ?? 0,
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // FUNDING OPPORTUNITY ADS — real campaigns from the `funding` table.
    // ─────────────────────────────────────────────────────────────

    const featuredFunding = await fetchFeaturedFunding(3)

    // ─────────────────────────────────────────────────────────────
    // LEARN HUB
    // ─────────────────────────────────────────────────────────────

    return (
        <LearnHubHome
            initialCourses={initialCourses}
            initialNextCursor={nextCursor}
            categories={categories}
            activeCategoryId={activeCategoryId}
            displayName={
                profile?.display_name ?? 'Learner'
            }
            avatarUrl={
                profile?.avatar_url ?? null
            }
            enrolledCount={enrolledCount}
            completedCount={completedCount}
            inProgressCourseIds={
                inProgressCourseIds
            }
            completedCourseIds={
                completedCourseIds
            }
            continueLearning={continueLearning}
            featuredFunding={featuredFunding}
            view={params.view ?? null}
        />
    )
}