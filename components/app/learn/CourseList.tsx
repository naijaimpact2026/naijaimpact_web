'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchCourses } from '@/lib/actions/learn'
import type { Course } from '@/lib/actions/learn'
import CourseCard from './CourseCard'
import CourseCardSkeleton from './CourseCardSkeleton'
import Link from 'next/link'

interface CourseListProps
{
    initialCourses: Course[]
    initialCursor: string | null
    // categoryId is now a UUID string or null/undefined for "all"
    categoryId?: string | null
}

export default function CourseList({ initialCourses, initialCursor, categoryId }: CourseListProps)
{
    const [courses, setCourses] = useState<Course[]>(initialCourses)
    const [cursor, setCursor] = useState<string | null>(initialCursor)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(initialCursor !== null)
    const sentinelRef = useRef<HTMLDivElement>(null)

    useEffect(() =>
    {
        setCourses(initialCourses)
        setCursor(initialCursor)
        setHasMore(initialCursor !== null)
    }, [initialCourses, initialCursor, categoryId])

    const loadMore = useCallback(async () =>
    {
        if (loading || !hasMore || cursor === null) return
        setLoading(true)
        try
        {
            const { courses: next, nextCursor } = await fetchCourses(cursor, 12, categoryId)
            setCourses(prev =>
            {
                const ids = new Set(prev.map(c => c.id))
                return [...prev, ...next.filter(c => !ids.has(c.id))]
            })
            setCursor(nextCursor)
            setHasMore(nextCursor !== null)
        } catch (err)
        {
            console.error('CourseList loadMore error:', err)
        } finally
        {
            setLoading(false)
        }
    }, [loading, hasMore, cursor, categoryId])

    useEffect(() =>
    {
        const sentinel = sentinelRef.current
        if (!sentinel) return
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) loadMore() },
            { rootMargin: '200px' }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [loadMore])

    if (courses.length === 0 && !loading)
    {
        return (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                    <span className="text-3xl">🎓</span>
                </div>
                <div>
                    <p className="font-bold text-gray-800">No courses found</p>
                    <p className="text-sm text-gray-500 mt-0.5">Be the first to create one!</p>
                </div>
                <Link href="/app/learn/create"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white mt-1 hover:opacity-90 transition-all"
                    style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                    Create Course
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map(course => (
                    <CourseCard key={course.id} course={course} />
                ))}
                {loading && Array.from({ length: 3 }).map((_, i) => (
                    <CourseCardSkeleton key={`sk-${i}`} />
                ))}
            </div>
            <div ref={sentinelRef} className="h-4" />
            {!hasMore && courses.length > 0 && (
                <p className="text-center text-sm text-gray-400 py-6">You&apos;ve seen all courses</p>
            )}
        </div>
    )
}
