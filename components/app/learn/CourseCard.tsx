'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GraduationCap, Video } from 'lucide-react'
import { toPublicStorageUrl } from '@/lib/supabase-image'
import type { Course } from '@/lib/actions/learn'

export default function CourseCard({ course }: { course: Course })
{
    const outline = Array.isArray(course.course_outline) ? course.course_outline : []
    const totalLessons = outline.reduce((s, sec) => s + (Array.isArray(sec.lessons) ? sec.lessons.length : 0), 0)
    const amount = typeof course.amount === 'number' ? course.amount : 0
    const coverUrl = toPublicStorageUrl(course.cover_image_url)

    return (
        <Link href={`/app/learn/${course.id}`} className="block group">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all overflow-hidden flex flex-col h-full">
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-50">
                    {coverUrl ? (
                        <Image src={coverUrl} alt={course.title} fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized={coverUrl.includes('supabase.co')} />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            <GraduationCap className="w-10 h-10 text-white/30" />
                        </div>
                    )}
                    {/* Price pill */}
                    <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${course.is_free ? 'bg-emerald-500 text-white' : 'bg-white text-gray-900 border border-gray-200'
                            }`}>
                            {course.is_free ? 'Free' : `₦${amount.toLocaleString('en-NG')}`}
                        </span>
                    </div>
                    {/* Video indicator */}
                    {course.video_url && (
                        <div className="absolute bottom-3 left-3">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-bold">
                                <Video className="w-3 h-3" /> Preview
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-4 flex flex-col gap-2.5 flex-1">
                    {/* Category */}
                    {course.category_name && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border bg-green-50 text-green-700 border-green-100 w-fit">
                            {course.category_name}
                        </span>
                    )}

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug group-hover:text-green-800 transition-colors">
                        {course.title}
                    </h3>

                    {/* Description */}
                    {course.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{course.description}</p>
                    )}

                    {/* Lessons count */}
                    {totalLessons > 0 && (
                        <p className="text-[11px] text-gray-400">
                            {outline.length} section{outline.length !== 1 ? 's' : ''} · {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                        </p>
                    )}

                    {/* Instructor */}
                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-50">
                        <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={course.instructor.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px] font-bold bg-green-100 text-green-700">
                                {course.instructor.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500 truncate">{course.instructor.display_name}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
