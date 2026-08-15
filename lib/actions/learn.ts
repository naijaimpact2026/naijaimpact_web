'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────
// Types matching actual DB schema
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
  created_at: string
  updated_at: string
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
// fetchCourses — paginated catalogue
// ─────────────────────────────────────────────

export async function fetchCourses(
  cursor: string | null,
  limit = 12,
  categoryId?: string | null
): Promise<{ courses: Course[]; nextCursor: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { courses: [], nextCursor: null }

  let query = supabase
    .from('lms_courses')
    .select('id, user_id, title, description, cover_image_url, category_id, amount, is_free, video_url, course_outline, created_at, updated_at')
    .order('created_at', { ascending: false })
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
    return { courses: [], nextCursor: null }
  }

  const hasMore = data.length > limit
  const pageData = hasMore ? data.slice(0, limit) : data

  // Fetch instructor names separately
  const userIds = [...new Set(pageData.map((r: any) => r.user_id).filter(Boolean))]
  const instructorMap = new Map<string, { display_name: string; avatar_url: string | null }>()

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    for (const u of users ?? []) {
      instructorMap.set(u.id, { display_name: u.display_name ?? '', avatar_url: u.avatar_url ?? null })
    }
  }

  // Fetch category names separately
  const catIds = [...new Set(pageData.map((r: any) => r.category_id).filter(Boolean))]
  const catMap = new Map<string, string>()

  if (catIds.length > 0) {
    const { data: cats } = await supabase
      .from('lms_courses_categories')
      .select('id, name')
      .in('id', catIds)

    for (const c of cats ?? []) {
      catMap.set(c.id, c.name)
    }
  }

  const courses: Course[] = pageData.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description ?? null,
    cover_image_url: row.cover_image_url ?? null,
    category_id: row.category_id ?? null,
    category_name: row.category_id ? (catMap.get(row.category_id) ?? null) : null,
    amount: row.amount ?? 0,
    is_free: row.is_free ?? true,
    video_url: row.video_url ?? null,
    course_outline: Array.isArray(row.course_outline) ? row.course_outline : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    instructor: instructorMap.get(row.user_id) ?? { display_name: '', avatar_url: null },
  }))

  const last = pageData[pageData.length - 1]
  return { courses, nextCursor: hasMore ? last.created_at : null }
}

// ─────────────────────────────────────────────
// fetchCourseById
// ─────────────────────────────────────────────

export async function fetchCourseById(courseId: string): Promise<{
  course: Course
  enrollment: Enrollment | null
  sections: FlatSection[]
} | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: row, error } = await supabase
    .from('lms_courses')
    .select('id, user_id, title, description, cover_image_url, category_id, amount, is_free, video_url, course_outline, created_at, updated_at')
    .eq('id', courseId)
    .single()

  if (error || !row) return null

  // Instructor
  const { data: instructor } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', (row as any).user_id)
    .single()

  // Category
  let categoryName: string | null = null
  if ((row as any).category_id) {
    const { data: cat } = await supabase
      .from('lms_courses_categories')
      .select('name')
      .eq('id', (row as any).category_id)
      .single()
    categoryName = cat?.name ?? null
  }

  // Profile id for enrollment lookup
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  let enrollment: Enrollment | null = null
  if (profile) {
    const { data: enrollData } = await supabase
      .from('lms_courses_enrollment')
      .select('*')
      .eq('user_id', profile.id)
      .eq('course_id', courseId)
      .maybeSingle()
    enrollment = enrollData ?? null
  }

  const r = row as any
  return {
    course: {
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description ?? null,
      cover_image_url: r.cover_image_url ?? null,
      category_id: r.category_id ?? null,
      category_name: categoryName,
      amount: r.amount ?? 0,
      is_free: r.is_free ?? true,
      video_url: r.video_url ?? null,
      course_outline: Array.isArray(r.course_outline) ? r.course_outline : [],
      created_at: r.created_at,
      updated_at: r.updated_at,
      instructor: {
        display_name: instructor?.display_name ?? '',
        avatar_url: instructor?.avatar_url ?? null,
      },
    },
    enrollment,
    sections: flattenOutline(Array.isArray(r.course_outline) ? r.course_outline : []).sections,
  }
}

// ─────────────────────────────────────────────
// enrolCourse
// ─────────────────────────────────────────────

export async function enrolCourse(courseId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthenticated')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) throw new Error('User profile not found')

  const { data: course } = await supabase
    .from('lms_courses')
    .select('id, is_free, amount')
    .eq('id', courseId)
    .single()

  if (!course) throw new Error('Course not found')
  if (!course.is_free && course.amount > 0) throw new Error('This course requires payment')

  // Check if already enrolled — avoids duplicate key errors
  const { data: existing } = await supabase
    .from('lms_courses_enrollment')
    .select('id, status')
    .eq('user_id', profile.id)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existing) {
    // Already enrolled — if dropped, reactivate; otherwise it's a no-op
    if (existing.status === 'dropped') {
      const { error: updateError } = await supabase
        .from('lms_courses_enrollment')
        .update({ status: 'enrolled' })
        .eq('id', existing.id)
      if (updateError) throw new Error('Failed to re-enrol in course')
    }
    // Already enrolled — treat as success
  } else {
    const { error: insertError } = await supabase
      .from('lms_courses_enrollment')
      .insert({ user_id: profile.id, course_id: courseId, status: 'enrolled' })
    if (insertError) {
      console.error('enrolCourse insert error — code:', insertError.code, '| message:', insertError.message, '| details:', insertError.details, '| hint:', insertError.hint)
      if (insertError.code === '23505') {
        // Race condition — row already exists, treat as success
      } else {
        throw new Error(`Failed to enrol in course: ${insertError.message}`)
      }
    }
  }

  revalidatePath(`/app/learn/${courseId}`)
  return { success: true }
}

// ─────────────────────────────────────────────
// Lesson helpers — derive flat lesson list from course_outline JSON
// Each lesson gets a stable id: `${sectionIndex}-${lessonIndex}`
// ─────────────────────────────────────────────

export type FlatLesson = {
  id: string          // "${si}-${li}"
  section_id: string  // "${si}"
  title: string
  video_url: string | null
  duration_s: number | null
  position: number    // global 0-based index
}

export type FlatSection = {
  id: string
  title: string
  lessons: FlatLesson[]
}

function flattenOutline(outline: CourseOutlineSection[]): { sections: FlatSection[]; lessons: FlatLesson[] } {
  const sections: FlatSection[] = []
  const lessons: FlatLesson[] = []
  let pos = 0

  for (let si = 0; si < outline.length; si++) {
    const sec = outline[si]
    const sectionId = String(si)
    const sectionLessons: FlatLesson[] = []

    for (let li = 0; li < (sec.lessons ?? []).length; li++) {
      const raw = sec.lessons[li]
      const lesson: FlatLesson = {
        id: `${si}-${li}`,
        section_id: sectionId,
        title: raw.title,
        video_url: raw.video_url ?? null,
        duration_s: raw.duration_mins ? raw.duration_mins * 60 : null,
        position: pos++,
      }
      sectionLessons.push(lesson)
      lessons.push(lesson)
    }

    sections.push({ id: sectionId, title: sec.title, lessons: sectionLessons })
  }

  return { sections, lessons }
}

// ─────────────────────────────────────────────
// fetchLesson
// ─────────────────────────────────────────────

export async function fetchLesson(courseId: string, lessonId: string): Promise<{
  lesson: FlatLesson
  prevLesson: FlatLesson | null
  nextLesson: FlatLesson | null
  enrollment: { id: string; status: string; progress: number; last_lesson_id: string | null } | null
  totalLessons: number
  courseTitle: string
} | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: row } = await supabase
    .from('lms_courses')
    .select('title, course_outline')
    .eq('id', courseId)
    .single()

  if (!row) return null

  const outline: CourseOutlineSection[] = Array.isArray(row.course_outline) ? row.course_outline : []
  const { lessons } = flattenOutline(outline)

  const idx = lessons.findIndex(l => l.id === lessonId)
  if (idx === -1) return null

  const lesson = lessons[idx]
  const prevLesson = idx > 0 ? lessons[idx - 1] : null
  const nextLesson = idx < lessons.length - 1 ? lessons[idx + 1] : null

  // Enrollment
  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()

  let enrollment: { id: string; status: string; progress: number; last_lesson_id: string | null } | null = null
  if (profile) {
    const { data: enrollData } = await supabase
      .from('lms_courses_enrollment')
      .select('id, status, progress, last_lesson_id')
      .eq('user_id', profile.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (enrollData) {
      enrollment = {
        id: enrollData.id,
        status: enrollData.status ?? 'enrolled',
        progress: enrollData.progress ?? 0,
        last_lesson_id: enrollData.last_lesson_id ?? null,
      }
    }
  }

  return {
    lesson,
    prevLesson,
    nextLesson,
    enrollment,
    totalLessons: lessons.length,
    courseTitle: row.title,
  }
}

// ─────────────────────────────────────────────
// markLessonComplete
// ─────────────────────────────────────────────

export async function markLessonComplete(
  courseId: string,
  lessonId: string
): Promise<{ progress: number; completed: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthenticated')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) throw new Error('User profile not found')

  // Get course outline to compute progress
  const { data: row } = await supabase
    .from('lms_courses')
    .select('course_outline')
    .eq('id', courseId)
    .single()

  const outline: CourseOutlineSection[] = Array.isArray(row?.course_outline) ? row!.course_outline : []
  const { lessons } = flattenOutline(outline)
  const totalLessons = lessons.length

  // Get current enrollment
  const { data: enrollment } = await supabase
    .from('lms_courses_enrollment')
    .select('id, progress, last_lesson_id, status')
    .eq('user_id', profile.id)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!enrollment) throw new Error('Not enrolled in this course')

  // Track completed lesson ids as a simple set stored in last_lesson_id
  // Since the DB may only have last_lesson_id (not a completed_lessons array),
  // we compute progress based on position in lesson list
  const lessonIdx = lessons.findIndex(l => l.id === lessonId)
  const completedCount = lessonIdx + 1  // treat all lessons up to current as done
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const courseCompleted = completedCount >= totalLessons

  const newStatus = courseCompleted ? 'completed' : 'enrolled'

  // Update enrollment — only update columns that exist
  const updatePayload: Record<string, unknown> = { last_lesson_id: lessonId }
  // Try to update progress if column exists (ignore error if not)
  try {
    await supabase
      .from('lms_courses_enrollment')
      .update({ last_lesson_id: lessonId, progress, status: newStatus })
      .eq('id', enrollment.id)
  } catch {
    // Fallback: update only last_lesson_id
    await supabase
      .from('lms_courses_enrollment')
      .update(updatePayload)
      .eq('id', enrollment.id)
  }

  revalidatePath(`/app/learn/${courseId}`)
  return { progress, completed: courseCompleted }
}

// ─────────────────────────────────────────────
// createCourse — matches actual DB columns
// ─────────────────────────────────────────────

export interface CreateCourseInput {
  title: string
  description: string | null
  category_id: string | null
  amount: number
  is_free: boolean
  cover_image_url: string | null
  video_url: string | null
  course_outline: CourseOutlineSection[]
}

export async function createCourse(data: CreateCourseInput): Promise<string> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthenticated')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) throw new Error('User profile not found')

  const { data: course, error: insertError } = await supabase
    .from('lms_courses')
    .insert({
      user_id: profile.id,
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      amount: data.amount,
      is_free: data.is_free,
      cover_image_url: data.cover_image_url,
      video_url: data.video_url,
      course_outline: data.course_outline,
    })
    .select('id')
    .single()

  if (insertError || !course) {
    console.error('createCourse error:', insertError)
    throw new Error(insertError?.message ?? 'Failed to create course')
  }

  revalidatePath('/app/learn')
  return course.id
}
