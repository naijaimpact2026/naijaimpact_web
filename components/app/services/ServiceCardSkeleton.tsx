export default function ServiceCardSkeleton()
{
    return (
        <div className="bento-card noise-bg flex flex-col h-full animate-pulse">
            {/* Cover image placeholder */}
            <div className="aspect-video w-full rounded-t-2xl bg-muted" />

            {/* Body */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Title */}
                <div className="space-y-1.5">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                </div>

                {/* Provider row */}
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                </div>

                {/* Price */}
                <div className="mt-auto pt-2 border-t border-border/50">
                    <div className="h-4 w-28 rounded bg-muted" />
                </div>
            </div>
        </div>
    )
}
