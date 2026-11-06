import { Skeleton } from '@/components/ui/skeleton'

export default function NotificationSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-4">
      <Skeleton className="h-10 w-10 rounded-full" />

      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>

      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  )
}