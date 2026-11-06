'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { shouldSkipImageOptimization } from '@/lib/supabase-image'
import { ChevronRight, ShoppingBag, GraduationCap } from 'lucide-react'
import type { PromotedItem } from '@/lib/actions/promoted'

interface PromotedCarouselProps
{
    items: PromotedItem[]
}

const KIND_STYLES = {
    market: { label: 'Market', icon: ShoppingBag, badge: 'bg-blue-500 text-white' },
    learn: { label: 'Learn', icon: GraduationCap, badge: 'bg-primary text-primary-foreground' },
} as const

const AUTO_ADVANCE_MS = 6000

export default function PromotedCarousel({ items }: PromotedCarouselProps)
{
    const [index, setIndex] = useState(0)

    useEffect(() =>
    {
        if (items.length <= 1) return
        const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), AUTO_ADVANCE_MS)
        return () => clearInterval(timer)
    }, [items.length])

    if (items.length === 0) return null

    const item = items[index]
    const style = KIND_STYLES[item.kind]
    const Icon = style.icon

    return (
        <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden rounded-2xl border border-border bg-muted [transform:translateZ(0)] [-webkit-transform:translateZ(0)] [contain:paint]">
            {items.map((it, i) => {
                const isActive = i === index
                const itStyle = KIND_STYLES[it.kind]
                const ItIcon = itStyle.icon

                return (
                    <Link
                        key={it.id}
                        href={it.href}
                        className={`absolute inset-0 block transition-opacity duration-700 ease-in-out [transform:translateZ(0)] [-webkit-transform:translateZ(0)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden] ${
                            isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                        tabIndex={isActive ? 0 : -1}
                        aria-hidden={!isActive}
                    >
                        {it.image_url ? (
                            <Image
                                src={it.image_url}
                                alt={it.title}
                                fill
                                unoptimized={shouldSkipImageOptimization(it.image_url)}
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 672px"
                                priority={i === 0}
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#14532d] to-[#0f3d25]" />
                        )}

                        {/* Legibility gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                        {/* Kind badge */}
                        <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${itStyle.badge}`}>
                            <ItIcon className="h-3 w-3" />
                            {itStyle.label}
                        </span>

                        {/* Title + subtitle */}
                        <div className="absolute inset-x-3 bottom-3">
                            <p className="line-clamp-1 text-base font-bold text-white sm:text-lg">
                                {it.title}
                            </p>
                            <p className="text-xs font-medium text-white/75">
                                {it.subtitle}
                            </p>
                        </div>
                    </Link>
                )
            })}

            {/* Next control */}
            {items.length > 1 && (
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setIndex((i) => (i + 1) % items.length) }}
                    aria-label="Next promoted item"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            )}

            {/* Dot indicators */}
            {items.length > 1 && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1">
                    {items.map((dotItem, i) => (
                        <button
                            key={dotItem.id}
                            type="button"
                            onClick={(e) => { e.preventDefault(); setIndex(i) }}
                            aria-label={`Go to promoted item ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
