import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Wave step used to stagger sibling skeletons — one ripple beat per item. */
export const WAVE_STEP = 60

export function SkeletonAvatar({
    size = 40,
    className,
    delay = 0,
}: {
    size?: number
    className?: string
    delay?: number
}) {
    return (
        <Skeleton
            delay={delay}
            className={cn('rounded-full shrink-0', className)}
            style={{ width: size, height: size }}
        />
    )
}

export function SkeletonLine({
    width = '100%',
    height = 12,
    className,
    delay = 0,
}: {
    width?: string | number
    height?: number
    className?: string
    delay?: number
}) {
    return (
        <Skeleton
            delay={delay}
            className={cn('rounded-full', className)}
            style={{ width, height }}
        />
    )
}

/** Rounded-rectangle block — hero banners, illustration slots, media placeholders. */
export function SkeletonBlock({
    className,
    delay = 0,
    base,
}: {
    className?: string
    delay?: number
    base?: string
}) {
    return <Skeleton delay={delay} base={base} className={cn('rounded-2xl', className)} />
}

export function SkeletonPill({
    className,
    delay = 0,
}: {
    className?: string
    delay?: number
}) {
    return <Skeleton delay={delay} className={cn('h-8 w-24 rounded-full', className)} />
}

/** A bordered card shell matching `bg-card` surfaces used throughout the app. */
export function SkeletonCard({
    className,
    children,
    delay = 0,
}: {
    className?: string
    children?: React.ReactNode
    delay?: number
}) {
    return (
        <div
            className={cn('rounded-2xl border border-border bg-card p-4', className)}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    )
}
