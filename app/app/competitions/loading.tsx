import { Skeleton } from '@/components/ui/skeleton'

export default function Loading()
{
    return (
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-52 w-full rounded-3xl" />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-3">
                    <Skeleton className="h-36 w-full rounded-3xl" />
                    <Skeleton className="h-48 w-full rounded-3xl" />
                    <Skeleton className="h-48 w-full rounded-3xl" />
                </div>
                <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
        </div>
    )
}
