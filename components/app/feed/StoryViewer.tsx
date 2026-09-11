'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, GraduationCap, ShoppingBag, ArrowRight } from 'lucide-react'
import type { PromotedItem } from '@/lib/actions/promoted'

interface StoryViewerProps
{
    items: PromotedItem[]
    startIndex: number
    onClose: () => void
}

const SLIDE_DURATION_MS = 6000
const TICK_MS = 50

const KIND_META = {
    market: { label: 'Marketplace', icon: ShoppingBag, cta: 'View listing' },
    learn: { label: 'Learn', icon: GraduationCap, cta: 'View course' },
} as const

export default function StoryViewer({ items, startIndex, onClose }: StoryViewerProps)
{
    const router = useRouter()
    const [index, setIndex] = useState(startIndex)
    const [progress, setProgress] = useState(0)
    const [paused, setPaused] = useState(false)

    const indexRef = useRef(index)
    indexRef.current = index

    const goNext = useCallback(() =>
    {
        setIndex((i) =>
        {
            if (i >= items.length - 1)
            {
                onClose()
                return i
            }
            return i + 1
        })
        setProgress(0)
    }, [items.length, onClose])

    const goPrev = useCallback(() =>
    {
        setIndex((i) => Math.max(0, i - 1))
        setProgress(0)
    }, [])

    // Auto-advance timer
    useEffect(() =>
    {
        if (paused) return
        const tick = setInterval(() =>
        {
            setProgress((p) =>
            {
                const next = p + (TICK_MS / SLIDE_DURATION_MS) * 100
                if (next >= 100)
                {
                    goNext()
                    return 0
                }
                return next
            })
        }, TICK_MS)
        return () => clearInterval(tick)
    }, [paused, goNext, index])

    // Keyboard controls
    useEffect(() =>
    {
        function onKey(e: KeyboardEvent)
        {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowRight') goNext()
            if (e.key === 'ArrowLeft') goPrev()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose, goNext, goPrev])

    // Lock background scroll
    useEffect(() =>
    {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const item = items[index]
    if (!item) return null

    const meta = KIND_META[item.kind]
    const Icon = meta.icon

    function handleCta()
    {
        onClose()
        router.push(item.href)
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            role="dialog"
            aria-modal="true"
            aria-label="Promoted stories"
        >
            <div className="relative h-full w-full max-w-md overflow-hidden sm:h-[92vh] sm:rounded-2xl">
                {/* Progress bars */}
                <div className="absolute inset-x-2 top-2 z-20 flex gap-1">
                    {items.map((it, i) => (
                        <div key={it.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                            <div
                                className="h-full bg-white"
                                style={{
                                    width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                                    transition: i === index ? 'none' : 'width 150ms linear',
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute inset-x-3 top-6 z-20 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                    </span>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative h-full w-full">
                    {item.image_url ? (
                        <Image
                            key={item.id}
                            src={item.image_url}
                            alt={item.title}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="448px"
                            priority
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#14532d] to-[#0f3d25]" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
                </div>

                {/* Tap zones — left = prev, right = next */}
                <button
                    onClick={goPrev}
                    onPointerDown={() => setPaused(true)}
                    onPointerUp={() => setPaused(false)}
                    aria-label="Previous"
                    className="absolute inset-y-0 left-0 z-10 w-1/3"
                />
                <button
                    onClick={goNext}
                    onPointerDown={() => setPaused(true)}
                    onPointerUp={() => setPaused(false)}
                    aria-label="Next"
                    className="absolute inset-y-0 right-0 z-10 w-2/3"
                />

                {/* Desktop prev/next arrows */}
                {index > 0 && (
                    <button
                        onClick={goPrev}
                        aria-label="Previous story"
                        className="absolute left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 sm:flex"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                )}
                {index < items.length - 1 && (
                    <button
                        onClick={goNext}
                        aria-label="Next story"
                        className="absolute right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 sm:flex"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                )}

                {/* Title, subtitle + CTA */}
                <div className="absolute inset-x-4 bottom-6 z-20 space-y-3">
                    <div>
                        <p className="text-lg font-bold text-white line-clamp-2">{item.title}</p>
                        <p className="text-sm font-medium text-white/75">{item.subtitle}</p>
                    </div>
                    <button
                        onClick={handleCta}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold text-black transition-transform active:scale-[0.98]"
                    >
                        {meta.cta}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
