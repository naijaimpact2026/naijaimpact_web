import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────
// Previous implementation — flat pulse-fade block, no shape awareness.
// Replaced by the shimmer-wave version below (see `.skeleton-shimmer` in
// app/globals.css), which tints itself from the live theme tokens so it
// works in light/dark automatically, and supports a `delay` prop so a
// grid/list of skeletons can ripple in sequence instead of pulsing as one.
// ─────────────────────────────────────────────────────────────────────────
// function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="skeleton"
//       className={cn('bg-accent animate-pulse rounded-md', className)}
//       {...props}
//     />
//   )
// }

interface SkeletonProps extends React.ComponentProps<'div'> {
  /** Stagger the shimmer sweep in ms, so neighbouring skeletons ripple like a wave. */
  delay?: number
  /** Override the base fill colour — for skeletons sitting on a non-default surface (e.g. a dark brand-gradient hero). */
  base?: string
}

function Skeleton({ className, delay = 0, base, style, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn('skeleton-shimmer rounded-md', className)}
      style={{
        ...style,
        '--skeleton-delay': `${delay}ms`,
        ...(base ? { '--skeleton-base': base } : {}),
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Skeleton }
