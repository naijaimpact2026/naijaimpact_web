export default function CourseCardSkeleton()
{
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
            {/* Thumbnail */}
            <div className="aspect-video w-full bg-gray-100" />
            {/* Body */}
            <div className="p-4 space-y-3">
                <div className="h-5 w-20 bg-gray-100 rounded-full" />
                <div className="space-y-1.5">
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="flex items-center gap-2 pt-3 border-t border-gray-50 mt-1">
                    <div className="h-6 w-6 rounded-full bg-gray-100 shrink-0" />
                    <div className="h-3 bg-gray-100 rounded w-28" />
                </div>
            </div>
        </div>
    )
}
