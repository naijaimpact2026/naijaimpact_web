/**
 * Soft animated blob backdrop shared by the brand illustrations.
 * Pure CSS/SVG — no external images — so it always matches the live theme colors.
 */
export default function BlobField({ className = '' }: { className?: string })
{
    return (
        <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
            <div className="blob-float absolute -top-6 -left-8 h-32 w-32 rounded-full bg-lime/30 blur-2xl" />
            <div className="blob-float-delayed absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-cyan/25 blur-2xl" />
            <div className="blob-float absolute top-1/3 right-1/4 h-20 w-20 rounded-full bg-primary/20 blur-xl" />
        </div>
    )
}
