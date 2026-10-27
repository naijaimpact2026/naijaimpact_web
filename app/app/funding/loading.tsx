import FundingCardSkeleton from '@/components/app/funding/FundingCardSkeleton'

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Hero skeleton */}
      <div className="h-64 sm:h-72 w-full rounded-3xl bg-muted/60 animate-pulse border border-border" />

      {/* Filter bar skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="h-10 w-full sm:w-72 rounded-2xl bg-muted animate-pulse" />
        <div className="h-10 w-48 rounded-2xl bg-muted animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <FundingCardSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
