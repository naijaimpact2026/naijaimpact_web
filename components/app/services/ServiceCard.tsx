'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Wrench } from 'lucide-react'
import type { ServiceWithProvider } from '@/lib/types'

interface ServiceCardProps
{
    service: ServiceWithProvider
}

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function getStartingPrice(service: ServiceWithProvider): number | null
{
    if (!service.pricing_tiers || service.pricing_tiers.length === 0) return null
    return Math.min(...service.pricing_tiers.map((t) => t.price))
}

export default function ServiceCard({ service }: ServiceCardProps)
{
    const startingPrice = getStartingPrice(service)

    return (
        <Link href={`/app/services/${service.id}`} className="block group">
            <div className="bento-card noise-bg flex flex-col h-full">
                {/* Cover image */}
                <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-muted">
                    {service.cover_url ? (
                        <Image
                            src={service.cover_url}
                            alt={service.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="absolute inset-0 gradient-primary opacity-60 flex items-center justify-center">
                            <Wrench className="h-10 w-10 text-white/80" />
                        </div>
                    )}

                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                        <Badge
                            variant="secondary"
                            className="capitalize bg-black/50 text-white border-0 backdrop-blur-sm"
                        >
                            {service.category}
                        </Badge>
                    </div>
                </div>

                {/* Card body */}
                <div className="relative z-10 p-4 flex flex-col gap-3 flex-1">
                    {/* Title */}
                    <h3 className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {service.title}
                    </h3>

                    {/* Provider */}
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={service.provider.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {(service.provider.display_name || service.provider.username)
                                    .charAt(0)
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                            {service.provider.display_name || `@${service.provider.username}`}
                        </span>
                    </div>

                    {/* Starting price */}
                    <div className="mt-auto pt-2 border-t border-border/50">
                        {startingPrice !== null ? (
                            <p className="text-sm font-semibold text-primary">
                                From {formatNGN(startingPrice)}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">Price on request</p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
