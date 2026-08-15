export default function PostCardSkeleton()
{
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-muted rounded-full" />
                    <div className="h-2.5 w-20 bg-muted rounded-full" />
                </div>
            </div>

            {/* Caption lines */}
            <div className="px-4 pb-3 space-y-2">
                <div className="h-3 w-full bg-muted rounded-full" />
                <div className="h-3 w-4/5 bg-muted rounded-full" />
                <div className="h-3 w-3/5 bg-muted rounded-full" />
            </div>

            {/* Media placeholder */}
            <div className="mx-4 mb-3 h-48 bg-muted rounded-xl" />

            {/* Divider */}
            <div className="h-px bg-border mx-4" />

            {/* Action bar */}
            <div className="flex items-center justify-around px-4 py-3 gap-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-6 w-16 bg-muted rounded-full" />
                ))}
            </div>
        </div>
    )
}
