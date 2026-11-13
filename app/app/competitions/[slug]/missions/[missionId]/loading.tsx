import { Skeleton } from '@/components/ui/skeleton'

/** Instant mission-page skeleton while the server loads the mission. */
export default function Loading()
{
    return (
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
            <Skeleton className="h-4 w-20 rounded-full" />
            <div className="flex gap-2"><Skeleton className="h-6 w-28 rounded-full" /><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-14 rounded-full" /></div>
            <Skeleton className="h-9 w-4/5 rounded-xl" />
            <div className="flex gap-3"><Skeleton className="h-4 w-14 rounded-full" /><Skeleton className="h-4 w-14 rounded-full" /><Skeleton className="h-4 w-24 rounded-full" /></div>
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
    )
}
