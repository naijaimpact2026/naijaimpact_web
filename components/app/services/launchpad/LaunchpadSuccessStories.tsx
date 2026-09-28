'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { SUCCESS_STORIES } from '@/lib/launchpad-data'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

interface LaunchpadSuccessStoriesProps
{
    onSeeAll?: () => void
}

export default function LaunchpadSuccessStories({ onSeeAll }: LaunchpadSuccessStoriesProps)
{
    const [currentIndex, setCurrentIndex] = useState(0)
    const currentStory = SUCCESS_STORIES[currentIndex]

    const handlePrev = () =>
    {
        setCurrentIndex((prev) => (prev === 0 ? SUCCESS_STORIES.length - 1 : prev - 1))
    }

    const handleNext = () =>
    {
        setCurrentIndex((prev) => (prev === SUCCESS_STORIES.length - 1 ? 0 : prev + 1))
    }

    if (!currentStory) return null

    return (
        <div className="w-full bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Success Stories
                </h3>
                <button
                    onClick={onSeeAll}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                    See All
                </button>
            </div>

            {/* Testimonial Card */}
            <div className="flex gap-3 items-center">
                {/* Founder Photo */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-border bg-muted shadow-2xs">
                    <Image
                        src={currentStory.image}
                        alt={currentStory.author}
                        fill
                        className="object-cover"
                        sizes="80px"
                    />
                </div>

                {/* Quote Content */}
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground italic leading-snug line-clamp-3">
                        &ldquo;{currentStory.quote}&rdquo;
                    </p>
                    <div className="mt-1.5">
                        <p className="text-xs font-bold text-foreground leading-none">
                            {currentStory.author}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            {currentStory.role}
                        </p>
                    </div>
                </div>
            </div>

            {/* Carousel Controls */}
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {SUCCESS_STORIES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                i === currentIndex
                                    ? 'w-4 bg-primary'
                                    : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                            }`}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrev}
                        aria-label="Previous story"
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleNext}
                        aria-label="Next story"
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
