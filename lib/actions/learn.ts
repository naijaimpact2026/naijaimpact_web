'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type CourseCategory = 'all' | string

export type CourseOutlineLesson = {
    title: string
    video_url: string | null
    duration_mins?: number
}

export type CourseOutlineSection = {
    title: string
    lessons: CourseOutlineLesson[]
}

export type Course = {
    id: string
    user_id: string
    title: string
    description: string | null
    cover_image_url: string | null
    category_id: string | null
    category_name: string | null
    amount: number
    is_free: boolean
    video_url: string | null
    course_outline: CourseOutlineSection[]
    created_at: string
    updated_at: string
    instructor: {
        display_name: string
        avatar_url: string | null
    }
}

export type Category = {
    id: string
    name: string
    description: string | null
}

export type Enrollment = {
    id: string
    user_id: string
    course_id: string
    status: string
    progress: number
    last_lesson_id: string | null
    created_at: string
    updated_at: string
}

// ─────────────────────────────────────────────
// course_outline is stored as a Postgres text[] column, not jsonb — each
// section is saved as an individually JSON-stringified array element, so it
// has to be parsed back out here rather than used as-is.
// ─────────────────────────────────────────────

function parseCourseOutline(raw: unknown): CourseOutlineSection[] {
    if (!Array.isArray(raw)) return []

    const sections: CourseOutlineSection[] = []

    for (const entry of raw) {
        let section: any = entry

        if (typeof entry === 'string') {
            try {
                section = JSON.parse(entry)
            } catch {
                continue // skip malformed/non-JSON entries
            }
        }

        if (!section || typeof section !== 'object' || typeof section.title !== 'string') {
            continue
        }

        sections.push({
            title: section.title,
            lessons: Array.isArray(section.lessons)
                ? section.lessons
                    .filter((l: any) => l && typeof l.title === 'string')
                    .map((l: any) => ({
                        title: l.title,
                        video_url: l.video_url ?? null,
                        duration_mins: l.duration_mins,
                    }))
                : [],
        })
    }

    return sections
}

// ─────────────────────────────────────────────
// fetchCategories
// ─────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('lms_courses_categories')
        .select('id, name, description')
        .order('name')

    if (error || !data) {
        console.error('fetchCategories error:', error)
        return []
    }

    return data as Category[]
}

// ─────────────────────────────────────────────
// fetchCourses
// ─────────────────────────────────────────────

export async function fetchCourses(
    cursor: string | null,
    limit = 12,
    categoryId?: string | null
): Promise<{
    courses: Course[]
    nextCursor: string | null
}> {
    const supabase = await createClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return {
            courses: [],
            nextCursor: null,
        }
    }

    let query = supabase
        .from('lms_courses')
        .select(`
            id,
            user_id,
            title,
            description,
            cover_image_url,
            category_id,
            amount,
            is_free,
            video_url,
            course_outline,
            created_at,
            updated_at
        `)
        .order('created_at', {
            ascending: false,
        })
        .limit(limit + 1)

    if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId)
    }

    if (cursor) {
        query = query.lt('created_at', cursor)
    }

    const { data, error } = await query

    if (error || !data) {
        console.error('fetchCourses error:', error)

        return {
            courses: [],
            nextCursor: null,
        }
    }

    const hasMore = data.length > limit

    const pageData = hasMore
        ? data.slice(0, limit)
        : data

    // Instructor lookup

    const userIds = [
        ...new Set(
            pageData
                .map((row: any) => row.user_id)
                .filter(Boolean)
        ),
    ]

    const instructorMap = new Map<
        string,
        {
            display_name: string
            avatar_url: string | null
        }
    >()

    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, display_name, avatar_url')
            .in('id', userIds)

        for (const user of users ?? []) {
            instructorMap.set(
                user.id,
                {
                    display_name:
                        user.display_name ?? '',
                    avatar_url:
                        user.avatar_url ?? null,
                }
            )
        }
    }

    // Category lookup

    const categoryIds = [
        ...new Set(
            pageData
                .map((row: any) => row.category_id)
                .filter(Boolean)
        ),
    ]

    const categoryMap = new Map<
        string,
        string
    >()

    if (categoryIds.length > 0) {
        const { data: categories } =
            await supabase
                .from('lms_courses_categories')
                .select('id, name')
                .in('id', categoryIds)

        for (const category of categories ?? []) {
            categoryMap.set(
                category.id,
                category.name
            )
        }
    }

    const courses: Course[] =
        pageData.map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            description: row.description ?? null,
            cover_image_url:
                row.cover_image_url ?? null,
            category_id:
                row.category_id ?? null,
            category_name:
                row.category_id
                    ? (
                        categoryMap.get(
                            row.category_id
                        ) ?? null
                    )
                    : null,
            amount: row.amount ?? 0,
            is_free:
                row.is_free ?? true,
            video_url:
                row.video_url ?? null,
            course_outline:
                parseCourseOutline(row.course_outline),
            created_at:
                row.created_at,
            updated_at:
                row.updated_at,
            instructor:
                instructorMap.get(
                    row.user_id
                ) ?? {
                    display_name: '',
                    avatar_url: null,
                },
        }))

    const last =
        pageData[pageData.length - 1]

    return {
        courses,
        nextCursor:
            hasMore
                ? last.created_at
                : null,
    }
}

// ─────────────────────────────────────────────
// fetchCourseById
// ─────────────────────────────────────────────

export async function fetchCourseById(
    courseId: string
): Promise<{
    course: Course
    enrollment: Enrollment | null
    sections: FlatSection[]
} | null> {
    const supabase = await createClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return null
    }

    const { data: row, error } =
        await supabase
            .from('lms_courses')
            .select(`
                id,
                user_id,
                title,
                description,
                cover_image_url,
                category_id,
                amount,
                is_free,
                video_url,
                course_outline,
                created_at,
                updated_at
            `)
            .eq('id', courseId)
            .single()

    if (error || !row) {
        return null
    }

    // Instructor

    const { data: instructor } =
        await supabase
            .from('users')
            .select(
                'display_name, avatar_url'
            )
            .eq(
                'id',
                (row as any).user_id
            )
            .single()

    // Category

    let categoryName:
        string | null = null

    if ((row as any).category_id) {
        const { data: category } =
            await supabase
                .from(
                    'lms_courses_categories'
                )
                .select('name')
                .eq(
                    'id',
                    (row as any).category_id
                )
                .single()

        categoryName =
            category?.name ?? null
    }

    // Current user's profile

    const { data: profile } =
        await supabase
            .from('users')
            .select('id')
            .eq(
                'auth_id',
                user.id
            )
            .single()

    let enrollment:
        Enrollment | null = null

    if (profile) {
        const { data: enrollmentData } =
            await supabase
                .from(
                    'lms_courses_enrollment'
                )
                .select('*')
                .eq(
                    'user_id',
                    profile.id
                )
                .eq(
                    'course_id',
                    courseId
                )
                .maybeSingle()

        enrollment =
            enrollmentData ?? null
    }

    const courseRow =
        row as any

    const outline =
        parseCourseOutline(courseRow.course_outline)

    return {
        course: {
            id: courseRow.id,
            user_id: courseRow.user_id,
            title: courseRow.title,
            description:
                courseRow.description ??
                null,
            cover_image_url:
                courseRow.cover_image_url ??
                null,
            category_id:
                courseRow.category_id ??
                null,
            category_name:
                categoryName,
            amount:
                courseRow.amount ?? 0,
            is_free:
                courseRow.is_free ?? true,
            video_url:
                courseRow.video_url ?? null,
            course_outline:
                outline,
            created_at:
                courseRow.created_at,
            updated_at:
                courseRow.updated_at,
            instructor: {
                display_name:
                    instructor?.display_name ??
                    '',
                avatar_url:
                    instructor?.avatar_url ??
                    null,
            },
        },

        enrollment,

        sections:
            flattenOutline(
                outline
            ).sections,
    }
}

// ─────────────────────────────────────────────
// enrolCourse
// ─────────────────────────────────────────────

export async function enrolCourse(
    courseId: string
): Promise<{
    success: boolean
}> {
    const supabase =
        await createClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new Error(
            'Unauthenticated'
        )
    }

    const { data: profile } =
        await supabase
            .from('users')
            .select('id')
            .eq(
                'auth_id',
                user.id
            )
            .single()

    if (!profile) {
        throw new Error(
            'User profile not found'
        )
    }

    const { data: course } =
        await supabase
            .from('lms_courses')
            .select(
                'id, is_free, amount'
            )
            .eq(
                'id',
                courseId
            )
            .single()

    if (!course) {
        throw new Error(
            'Course not found'
        )
    }

    if (
        !course.is_free &&
        course.amount > 0
    ) {
        throw new Error(
            'This course requires payment'
        )
    }

    const { data: existing } =
        await supabase
            .from(
                'lms_courses_enrollment'
            )
            .select(
                'id, status'
            )
            .eq(
                'user_id',
                profile.id
            )
            .eq(
                'course_id',
                courseId
            )
            .maybeSingle()

    if (existing) {
        if (
            existing.status ===
            'dropped'
        ) {
            const { error } =
                await supabase
                    .from(
                        'lms_courses_enrollment'
                    )
                    .update({
                        status:
                            'enrolled',
                    })
                    .eq(
                        'id',
                        existing.id
                    )

            if (error) {
                throw new Error(
                    'Failed to re-enrol in course'
                )
            }
        }
    } else {
        const { error } =
            await supabase
                .from(
                    'lms_courses_enrollment'
                )
                .insert({
                    user_id:
                        profile.id,
                    course_id:
                        courseId,
                    status:
                        'enrolled',
                })

        if (error) {
            console.error(
                'enrolCourse insert error:',
                error
            )

            if (
                error.code !==
                '23505'
            ) {
                throw new Error(
                    `Failed to enrol in course: ${error.message}`
                )
            }
        }
    }

    revalidatePath(
        `/app/learn/${courseId}`
    )

    return {
        success: true,
    }
}

// ─────────────────────────────────────────────
// Lesson types
// ─────────────────────────────────────────────

export type FlatLesson = {
    id: string
    section_id: string
    title: string
    video_url: string | null
    duration_s: number | null
    position: number
}

export type FlatSection = {
    id: string
    title: string
    lessons: FlatLesson[]
}

// ─────────────────────────────────────────────
// IMPORTANT:
// This must NOT be exported because this file
// uses 'use server'.
// ─────────────────────────────────────────────

function flattenOutline(
    outline: CourseOutlineSection[]
): {
    sections: FlatSection[]
    lessons: FlatLesson[]
} {
    const sections: FlatSection[] = []
    const lessons: FlatLesson[] = []

    let position = 0

    for (
        let sectionIndex = 0;
        sectionIndex < outline.length;
        sectionIndex++
    ) {
        const section =
            outline[sectionIndex]

        const sectionId =
            String(sectionIndex)

        const sectionLessons:
            FlatLesson[] = []

        for (
            let lessonIndex = 0;
            lessonIndex <
            (section.lessons ?? []).length;
            lessonIndex++
        ) {
            const rawLesson =
                section.lessons[
                    lessonIndex
                ]

            const lesson:
                FlatLesson = {
                    id: `${sectionIndex}-${lessonIndex}`,
                    section_id:
                        sectionId,
                    title:
                        rawLesson.title,
                    video_url:
                        rawLesson.video_url ??
                        null,
                    duration_s:
                        rawLesson.duration_mins
                            ? rawLesson.duration_mins *
                              60
                            : null,
                    position:
                        position++,
                }

            sectionLessons.push(
                lesson
            )

            lessons.push(
                lesson
            )
        }

        sections.push({
            id: sectionId,
            title: section.title,
            lessons:
                sectionLessons,
        })
    }

    return {
        sections,
        lessons,
    }
}

// ─────────────────────────────────────────────
// fetchLesson
// ─────────────────────────────────────────────

export async function fetchLesson(
    courseId: string,
    lessonId: string
): Promise<{
    lesson: FlatLesson
    prevLesson: FlatLesson | null
    nextLesson: FlatLesson | null
    enrollment: {
        id: string
        status: string
        progress: number
        last_lesson_id: string | null
    } | null
    totalLessons: number
    courseTitle: string
} | null> {
    const supabase =
        await createClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return null
    }

    const { data: row } =
        await supabase
            .from('lms_courses')
            .select(
                'title, course_outline'
            )
            .eq(
                'id',
                courseId
            )
            .single()

    if (!row) {
        return null
    }

    const outline:
        CourseOutlineSection[] =
        parseCourseOutline(row.course_outline)

    const {
        lessons,
    } =
        flattenOutline(
            outline
        )

    const index =
        lessons.findIndex(
            (lesson) =>
                lesson.id ===
                lessonId
        )

    if (index === -1) {
        return null
    }

    const lesson =
        lessons[index]

    const prevLesson =
        index > 0
            ? lessons[index - 1]
            : null

    const nextLesson =
        index <
        lessons.length - 1
            ? lessons[index + 1]
            : null

    // User profile

    const { data: profile } =
        await supabase
            .from('users')
            .select('id')
            .eq(
                'auth_id',
                user.id
            )
            .single()

    let enrollment:
        {
            id: string
            status: string
            progress: number
            last_lesson_id:
                string | null
        } | null = null

    if (profile) {
        const {
            data: enrollmentData,
            error: enrollmentError,
        } = await supabase
            .from(
                'lms_courses_enrollment'
            )
            .select(
                'id, status, progress, last_lesson_id'
            )
            .eq(
                'user_id',
                profile.id
            )
            .eq(
                'course_id',
                courseId
            )
            .maybeSingle()

        if (enrollmentError) {
            console.error('fetchLesson enrollment lookup error:', enrollmentError)
        }

        if (enrollmentData) {
            enrollment = {
                id:
                    enrollmentData.id,
                status:
                    enrollmentData.status ??
                    'enrolled',
                progress:
                    enrollmentData.progress ??
                    0,
                last_lesson_id:
                    enrollmentData.last_lesson_id ??
                    null,
            }
        }
    }

    return {
        lesson,
        prevLesson,
        nextLesson,
        enrollment,
        totalLessons:
            lessons.length,
        courseTitle:
            row.title,
    }
}

// ─────────────────────────────────────────────
// markLessonComplete
// ─────────────────────────────────────────────

export async function markLessonComplete(
    courseId: string,
    lessonId: string
): Promise<{
    progress: number
    completed: boolean
}> {
    const supabase =
        await createClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new Error(
            'Unauthenticated'
        )
    }

    const { data: profile } =
        await supabase
            .from('users')
            .select('id')
            .eq(
                'auth_id',
                user.id
            )
            .single()

    if (!profile) {
        throw new Error(
            'User profile not found'
        )
    }

    const { data: row } =
        await supabase
            .from('lms_courses')
            .select(
                'course_outline'
            )
            .eq(
                'id',
                courseId
            )
            .single()

    const outline:
        CourseOutlineSection[] =
        parseCourseOutline(row?.course_outline)

    const {
        lessons,
    } =
        flattenOutline(
            outline
        )

    const totalLessons =
        lessons.length

    const lessonIndex =
        lessons.findIndex(
            (lesson) =>
                lesson.id ===
                lessonId
        )

    if (lessonIndex === -1) {
        throw new Error(
            'Lesson not found'
        )
    }

    const {
        data: enrollment,
        error: enrollmentError,
    } =
        await supabase
            .from(
                'lms_courses_enrollment'
            )
            .select(
                'id, progress, last_lesson_id, status'
            )
            .eq(
                'user_id',
                profile.id
            )
            .eq(
                'course_id',
                courseId
            )
            .maybeSingle()

    if (enrollmentError) {
        console.error('markLessonComplete enrollment lookup error:', enrollmentError)
    }

    if (!enrollment) {
        throw new Error(
            'Not enrolled in this course'
        )
    }

    const completedCount =
        lessonIndex + 1

    const progress =
        totalLessons > 0
            ? Math.round(
                (completedCount /
                    totalLessons) *
                    100
            )
            : 0

    const courseCompleted =
        completedCount >=
        totalLessons

    const status =
        courseCompleted
            ? 'completed'
            : 'enrolled'

    await supabase
        .from(
            'lms_courses_enrollment'
        )
        .update({
            last_lesson_id:
                lessonId,
            progress,
            status,
        })
        .eq(
            'id',
            enrollment.id
        )

    revalidatePath(
        `/app/learn/${courseId}`
    )

    return {
        progress,
        completed:
            courseCompleted,
    }
}

// ─────────────────────────────────────────────
// createCourse
// ─────────────────────────────────────────────

export interface CreateCourseInput {
    title: string
    description: string | null
    category_id: string | null
    amount: number
    is_free: boolean
    cover_image_url: string | null
    video_url: string | null
    course_outline:
        CourseOutlineSection[]
}

export async function createCourse(
    data: CreateCourseInput
): Promise<string> {
    const supabase =
        await createClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new Error(
            'Unauthenticated'
        )
    }

    const { data: profile } =
        await supabase
            .from('users')
            .select('id')
            .eq(
                'auth_id',
                user.id
            )
            .single()

    if (!profile) {
        throw new Error(
            'User profile not found'
        )
    }

    const {
        data: course,
        error: insertError,
    } = await supabase
        .from('lms_courses')
        .insert({
            user_id:
                profile.id,
            title:
                data.title,
            description:
                data.description,
            category_id:
                data.category_id,
            amount:
                data.amount,
            is_free:
                data.is_free,
            cover_image_url:
                data.cover_image_url,
            video_url:
                data.video_url,
            course_outline:
                data.course_outline,
        })
        .select('id')
        .single()

    if (insertError || !course) {
        console.error(
            'createCourse error:',
            insertError
        )

        throw new Error(
            insertError?.message ??
            'Failed to create course'
        )
    }

    revalidatePath(
        '/app/learn'
    )

    return course.id
}