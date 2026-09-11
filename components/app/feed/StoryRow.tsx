'use client'

import { useState } from 'react'
import Image from 'next/image'
import { GraduationCap, ShoppingBag } from 'lucide-react'
import type { PromotedItem } from '@/lib/actions/promoted'
import StoryViewer from './StoryViewer'

interface StoryRowProps
{
    promotedItems?: PromotedItem[]
}

const KIND_RING = {
    market: 'from-blue-400 to-blue-600',
    learn: 'from-primary to-secondary',
} as const

const KIND_ICON = {
    market: ShoppingBag,
    learn: GraduationCap,
} as const

export default function StoryRow({ promotedItems = [] }: StoryRowProps)
{
    const [viewerIndex, setViewerIndex] = useState<number | null>(null)

    if (promotedItems.length === 0) return null

    return (
        <div className="flex items-start gap-3 overflow-x-auto scrollbar-none pb-1">

            {/* Promoted — real Marketplace listings and Learn courses.
                Tapping opens a full-screen story viewer; the redirect only
                happens from the CTA button inside it. */}
            {promotedItems.map((item, i) => {
                const Icon = KIND_ICON[item.kind]
                return (
                    <button
                        key={item.id}
                        onClick={() => setViewerIndex(i)}
                        className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                    >
                        <div className="relative">
                            <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${KIND_RING[item.kind]} p-0.5 group-hover:scale-105 transition-transform shadow`}>
                                <div className="relative h-full w-full overflow-hidden rounded-full border-[2px] border-card bg-muted">
                                    {item.image_url && (
                                        <Image
                                            src={item.image_url}
                                            alt={item.title}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                            sizes="56px"
                                        />
                                    )}
                                </div>
                            </div>
                            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full border border-card bg-primary px-1.5 py-0.5 text-white shadow">
                                <Icon className="h-2 w-2" />
                                <span className="text-[7px] font-bold uppercase tracking-wide">
                                    {item.kind === 'learn' ? 'Learn' : 'Market'}
                                </span>
                            </span>
                        </div>
                        <span className="text-[10px] font-medium text-foreground text-center w-14 truncate leading-tight">
                            {item.title}
                        </span>
                    </button>
                )
            })}

            {viewerIndex !== null && (
                <StoryViewer
                    items={promotedItems}
                    startIndex={viewerIndex}
                    onClose={() => setViewerIndex(null)}
                />
            )}
        </div>
    )
}
