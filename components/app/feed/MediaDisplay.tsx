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

    // Single video
    if (medias.length === 1 && medias[0].media_type === 'video')
    {
        return (
            <div className="w-full overflow-hidden rounded-xl bg-black">
                <video
                    src={medias[0].url}
                    controls
                    poster={undefined}
                    className="w-full max-h-[500px] object-contain"
                    preload="metadata"
                />
            </div>
        )
    }

    // Single image
    if (medias.length === 1 && medias[0].media_type === 'image')
    {
        const media = medias[0]
        const aspectRatio =
            media.width && media.height ? media.width / media.height : 1

        return (
            <div className="w-full overflow-hidden rounded-xl">
                <div
                    className="relative w-full"
                    style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
                >
                    <Image
                        src={media.url}
                        alt={altText}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                    />
                </div>
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
                                <div className="bg-black rounded-xl overflow-hidden">
                                    <video
                                        src={media.url}
                                        controls
                                        className="w-full max-h-[500px] object-contain"
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
