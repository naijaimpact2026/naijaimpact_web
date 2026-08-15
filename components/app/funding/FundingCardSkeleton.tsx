export default function FundingCardSkeleton()
{
    return (
        <div className="bento-card animate-pulse flex flex-col">
            {/* Cover image placeholder */}
            <div className="aspect-video w-full rounded-t-2xl bg-muted" />

            {/* Body */}
            <div className="p-4 flex flex-col gap-3">
                {/* Title */}
                <div className="space-y-1.5">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                </div>

                {/* Creator */}
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted" />
                    <div className="h-3 bg-muted rounded w-24" />
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                    <div className="h-2 bg-muted rounded-full w-full" />
                    <div className="flex justify-between">
                        <div className="h-3 bg-muted rounded w-20" />
                        <div className="h-3 bg-muted rounded w-20" />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between pt-2 border-t border-border/50">
                    <div className="h-3 bg-muted rounded w-16" />
                    <div className="h-3 bg-muted rounded w-16" />
                </div>
            </div>
        </div>
    )
}
