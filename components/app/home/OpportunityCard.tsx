import Link from 'next/link'
import Image from 'next/image'

/** Featured Opportunities card on the app home page, with a photo banner. */
export default function OpportunityCard({
    image,
    imageAlt,
    imagePosition = 'center',
    tag,
    tagClass,
    title,
    sub,
    meta,
    cta,
    href,
}: {
    /** Unsplash photo id, e.g. "photo-1655720348616-184ae7fad7e3" (free Unsplash license). */
    image: string
    imageAlt: string
    /** CSS object-position, to keep faces in frame. */
    imagePosition?: string
    tag: string
    tagClass: string
    title: string
    sub: string
    meta: string[]
    cta: string
    href: string | null
})
{
    return (
        <div className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300">
            {/* Photo banner */}
            <div className="relative h-48 w-full overflow-hidden bg-muted">
                <Image
                    src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=1200&q=75`}
                    alt={imageAlt}
                    fill
                    sizes="(min-width: 1280px) 600px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: imagePosition }}
                />
                {/* soft top fade so the tag stays legible on any photo */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />
                <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md ${tagClass}`}>
                    {tag}
                </span>
            </div>
            <div className="p-4">
                <h3 className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{sub}</p>
                <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
                    {meta.map((m) => <span key={m}>{m}</span>)}
                </div>
                {href ? (
                    <Link
                        href={href}
                        className="mt-3 inline-flex w-full items-center justify-center bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-xs group-hover:shadow-md animate-heartbeat"
                    >
                        {cta}
                    </Link>
                ) : (
                    <span className="mt-3 inline-flex w-full items-center justify-center bg-muted text-muted-foreground text-xs font-bold px-4 py-2.5 rounded-xl cursor-default">
                        {cta}
                    </span>
                )}
            </div>
        </div>
    )
}
