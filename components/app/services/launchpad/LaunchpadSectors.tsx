'use client'

import React from 'react'
import Image from 'next/image'
import { FEATURED_SECTORS, type BusinessSector } from '@/lib/launchpad-data'

interface LaunchpadSectorsProps
{
    onSelectSector: (sector: BusinessSector) => void
    onSeeAll?: () => void
}

export default function LaunchpadSectors({ onSelectSector, onSeeAll }: LaunchpadSectorsProps)
{
    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Featured Business Sectors
                </h2>
                <button
                    onClick={onSeeAll}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                    See All
                </button>
            </div>

            {/* 8 Sector Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-3.5">
                {FEATURED_SECTORS.map((sector) => (
                    <div
                        key={sector.id}
                        onClick={() => onSelectSector(sector)}
                        className="group flex flex-col items-center cursor-pointer"
                    >
                        {/* Sector Photo Thumbnail */}
                        <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden border border-border/80 bg-muted shadow-2xs group-hover:shadow-md group-hover:border-primary/50 transition-all">
                            <Image
                                src={sector.image}
                                alt={sector.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        </div>

                        {/* Title Underneath */}
                        <span className="mt-2 text-xs font-bold text-foreground text-center truncate w-full group-hover:text-primary transition-colors">
                            {sector.title}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
