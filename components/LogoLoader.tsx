import Image from 'next/image'

interface LogoLoaderProps
{
    /** Icon pixel size. Defaults to a comfortable full-page size. */
    size?: number
    /** Wrap in a full-viewport centered container. Set false to inline it inside your own layout. */
    fullScreen?: boolean
    className?: string
}

/**
 * Branded loading state — the Hubnovo icon mark with a gentle breathing
 * animation, used wherever a full page/route is loading (see the various
 * loading.tsx route files) instead of a generic spinner.
 */
export default function LogoLoader({ size = 56, fullScreen = true, className = '' }: LogoLoaderProps)
{
    const mark = (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <span className="absolute inset-0 rounded-2xl bg-primary/15 animate-ping" style={{ animationDuration: '1.8s' }} />
            <Image
                src="/logo.png"
                alt="Loading"
                width={size}
                height={size}
                className="relative rounded-2xl"
                style={{ animation: 'logoBreathe 1.8s ease-in-out infinite' }}
                priority
                unoptimized
            />
        </div>
    )

    if (!fullScreen) return mark

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
            {mark}
        </div>
    )
}
