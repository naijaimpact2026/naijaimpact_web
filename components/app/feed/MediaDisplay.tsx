'use client'

import Image from 'next/image'
import
{
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'
import type { PostMedia } from '@/lib/types'

interface MediaDisplayProps
{
    medias: PostMedia[]
    caption: string | null
}

export default function MediaDisplay({ medias, caption }: MediaDisplayProps)
{
    if (!medias || medias.length === 0) return null

    const altText = caption
        ? caption.replace(/[#@]\w+/g, '').trim().slice(0, 100) || 'Post image'
        : 'Post image'

    // Single video — fixed square frame, cropped to fill (matches the image frame
    // below and the grid/carousel frames, so every post occupies the same footprint
    // regardless of the source media's native dimensions — Facebook/Instagram-style).
    if (medias.length === 1 && medias[0].media_type === 'video')
    {
        return (
            <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-black">
                <video
                    src={medias[0].url}
                    controls
                    poster={undefined}
                    className="absolute inset-0 h-full w-full object-cover"
                    preload="metadata"
                />
            </div>
        )
    }

    // Single image — same fixed square frame, cropped to fill.
    if (medias.length === 1 && medias[0].media_type === 'image')
    {
        const media = medias[0]

        return (
            <div className="relative w-full aspect-square overflow-hidden rounded-xl">
                <Image
                    src={media.url}
                    alt={altText}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px"
                />
            </div>
        )
    }

    // Multiple images — carousel
    return (
        <div className="w-full overflow-hidden rounded-xl">
            <Carousel className="w-full" opts={{ loop: false }}>
                <CarouselContent>
                    {medias.map((media, index) => (
                        <CarouselItem key={media.id}>
                            {media.media_type === 'video' ? (
                                <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-black">
                                    <video
                                        src={media.url}
                                        controls
                                        className="absolute inset-0 h-full w-full object-cover"
                                        preload="metadata"
                                    />
                                </div>
                            ) : (
                                <div className="relative w-full aspect-square overflow-hidden rounded-xl">
                                    <Image
                                        src={media.url}
                                        alt={`${altText} ${index + 1}`}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 600px"
                                    />
                                </div>
                            )}
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {medias.length > 1 && (
                    <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                    </>
                )}
            </Carousel>
            {/* Media counter */}
            <div className="flex justify-center gap-1 mt-2">
                {medias.map((_, i) => (
                    <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                    />
                ))}
            </div>
        </div>
    )
}
