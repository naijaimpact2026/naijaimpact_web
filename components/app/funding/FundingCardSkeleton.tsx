export default function FundingCardSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-border/70 bg-card p-0 shadow-sm animate-pulse">
      {/* Cover image skeleton */}
      <div className="aspect-[16/10] w-full bg-muted" />

      {/* Body skeleton */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 flex-1 justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-4/5" />
          <div className="h-4 bg-muted rounded w-3/5" />
          <div className="h-3 bg-muted rounded w-full mt-2" />
        </div>

        {/* Creator skeleton */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
          <div className="h-3.5 bg-muted rounded w-28" />
        </div>

        {/* Progress skeleton */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded w-28" />
            <div className="h-4 bg-muted rounded w-10" />
          </div>
          <div className="h-2 bg-muted rounded-full w-full" />
          <div className="flex justify-between pt-1">
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-14" />
          </div>
        </div>
      </div>
    </div>
  )
}
