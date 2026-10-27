export default function CourseCardSkeleton()
{
    return (
        <div className="
            flex h-full flex-col overflow-hidden
            rounded-xl border border-border bg-card
            animate-pulse
        ">
            {/* Thumbnail */}
            <div className="aspect-video w-full bg-muted" />

            {/* Body */}
            <div className="flex flex-1 flex-col p-4">

                {/* Category */}
                <div className="mb-2 h-3 w-24 rounded bg-muted" />

                {/* Title */}
                <div className="space-y-1.5">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-4/5 rounded bg-muted" />
                </div>

                {/* Description */}
                <div className="mt-2 space-y-1.5">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                </div>

                {/* Metadata */}
                <div className="mt-3 flex gap-3">
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                </div>

                {/* Instructor */}
                <div className="
                    mt-auto flex items-center
                    gap-2 border-t border-border
                    pt-4 mt-4
                ">
                    <div className="
                        h-7 w-7 shrink-0
                        rounded-full bg-muted
                    " />

                    <div className="h-3 w-28 rounded bg-muted" />

                    {/* Arrow placeholder */}
                    <div className="
                        ml-auto h-4 w-4
                        rounded bg-muted
                    " />
                </div>
            </div>
        </div>
    )
}
