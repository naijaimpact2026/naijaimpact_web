'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchCourses } from '@/lib/actions/learn'
import type { Course } from '@/lib/actions/learn'
import CourseCard from './CourseCard'
import CourseCardSkeleton from './CourseCardSkeleton'
import Link from 'next/link'
import { GraduationCap, Plus } from 'lucide-react'

interface CourseListProps
{
    initialCourses: Course[]
    initialCursor: string | null
    categoryId?: string | null
}

export default function CourseList({
    initialCourses,
    initialCursor,
    categoryId,
}: CourseListProps)
{
    const [courses, setCourses] = useState<Course[]>(initialCourses)
    const [cursor, setCursor] = useState<string | null>(initialCursor)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(initialCursor !== null)

    const sentinelRef = useRef<HTMLDivElement>(null)

    /*
     * Reset the list whenever the server sends a new category/filter.
     */
    useEffect(() =>
    {
        setCourses(initialCourses)
        setCursor(initialCursor)
        setHasMore(initialCursor !== null)
    }, [initialCourses, initialCursor, categoryId])

    /*
     * Load another page.
     */
    const loadMore = useCallback(async () =>
    {
        if (loading || !hasMore || cursor === null) return

        setLoading(true)

        try
        {
            const {
                courses: nextCourses,
                nextCursor,
            } = await fetchCourses(
                cursor,
                12,
                categoryId
            )

            setCourses(previous =>
            {
                const existingIds = new Set(
                    previous.map(course => course.id)
                )

                const uniqueCourses = nextCourses.filter(
                    course => !existingIds.has(course.id)
                )

                return [...previous, ...uniqueCourses]
            })

            setCursor(nextCursor)
            setHasMore(nextCursor !== null)
        }
        catch (error)
        {
            console.error(
                'CourseList loadMore error:',
                error
            )
        }
        finally
        {
            setLoading(false)
        }
    }, [
        loading,
        hasMore,
        cursor,
        categoryId,
    ])

    /*
     * Infinite scrolling.
     */
    useEffect(() =>
    {
        const sentinel = sentinelRef.current

        if (!sentinel) return

        const observer = new IntersectionObserver(
            entries =>
            {
                if (entries[0]?.isIntersecting)
                {
                    loadMore()
                }
            },
            {
                rootMargin: '400px',
            }
        )

        observer.observe(sentinel)

        return () => observer.disconnect()
    }, [loadMore])

    /*
     * Empty state.
     */
    if (courses.length === 0 && !loading)
    {
        return (
            <div className="
                flex flex-col items-center
                justify-center
                rounded-2xl
                border border-dashed border-slate-200
                bg-slate-50/50
                px-6 py-20
                text-center
            ">
                <div className="
                    flex h-16 w-16
                    items-center justify-center
                    rounded-2xl
                    bg-emerald-50
                ">
                    <GraduationCap
                        className="h-8 w-8 text-emerald-700"
                    />
                </div>

                <h3 className="
                    mt-5
                    text-lg font-bold
                    text-slate-900
                ">
                    No courses found
                </h3>

                <p className="
                    mt-1 max-w-sm
                    text-sm leading-relaxed
                    text-slate-500
                ">
                    There aren't any courses in this category yet.
                    Check another category or create the first course.
                </p>

                <Link
                    href="/app/learn/create"
                    className="
                        mt-6
                        inline-flex items-center gap-2
                        rounded-lg
                        bg-emerald-700
                        px-5 py-2.5
                        text-sm font-semibold
                        text-white
                        transition-colors
                        hover:bg-emerald-800
                    "
                >
                    <Plus className="h-4 w-4" />
                    Create course
                </Link>
            </div>
        )
    }

    return (
        <div>

            {/* Course grid */}
            <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
                gap-x-5
                gap-y-8
            ">
                {courses.map(course => (
                    <CourseCard
                        key={course.id}
                        course={course}
                    />
                ))}

                {/* Loading skeletons */}
                {loading &&
                    Array.from({ length: 4 }).map((_, index) => (
                        <CourseCardSkeleton
                            key={`skeleton-${index}`}
                        />
                    ))
                }
            </div>

            {/* Infinite-scroll sentinel */}
            <div
                ref={sentinelRef}
                className="h-8"
                aria-hidden="true"
            />

            {/* End of catalog */}
            {!hasMore && courses.length > 0 && (
                <div className="
                    flex items-center justify-center
                    py-10
                ">
                    <div className="
                        flex items-center gap-3
                        text-sm text-slate-400
                    ">
                        <div className="h-px w-12 bg-slate-200" />

                        <span>
                            You&apos;ve seen all courses
                        </span>

                        <div className="h-px w-12 bg-slate-200" />
                    </div>
                </div>
            )}
        </div>
    )
}