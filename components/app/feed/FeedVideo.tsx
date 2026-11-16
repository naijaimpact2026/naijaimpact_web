'use client'

import { useEffect, useRef } from 'react'

interface FeedVideoProps
{
    src: string
    className?: string
}

/**
 * Feed video that pauses itself once it scrolls (or is swiped, inside a
 * carousel) mostly out of view. Playback is never auto-resumed — the user
 * presses play again, matching Instagram/Facebook behaviour for sound-on video.
 */
export default function FeedVideo({ src, className }: FeedVideoProps)
{
    const ref = useRef<HTMLVideoElement>(null)

    useEffect(() =>
    {
        const video = ref.current
        if (!video || typeof IntersectionObserver === 'undefined') return

        const observer = new IntersectionObserver(
            ([entry]) =>
            {
                if (entry.intersectionRatio < 0.5 && !video.paused) video.pause()
            },
            { threshold: [0, 0.5] },
        )
        observer.observe(video)
        return () => observer.disconnect()
    }, [])

    return (
        <video
            ref={ref}
            src={src}
            controls
            playsInline
            preload="metadata"
            className={className}
        />
    )
}
