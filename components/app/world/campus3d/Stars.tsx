import { Star } from 'lucide-react'

/** 0–3 stars for a quest (filled = earned). */
export function Stars({ n, max = 3, className = '', size = 'h-4 w-4' }: { n: number; max?: number; className?: string; size?: string })
{
    return (
        <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${n} of ${max} stars`}>
            {Array.from({ length: max }, (_, i) => (
                <Star key={i} className={`${size} ${i < n ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-muted-foreground/40'}`} aria-hidden />
            ))}
        </span>
    )
}
