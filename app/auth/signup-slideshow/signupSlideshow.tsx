'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import CommunityIllustration from '@/components/illustrations/CommunityIllustration'

const slides = [
    {
        title: 'Join the movement.',
        subtitle: 'Build Nigeria.',
        description:
            'Connect with people, discover opportunities, and be part of a movement creating real impact.',
    },
    {
        title: 'Fund great ideas.',
        subtitle: 'Create real impact.',
        description:
            'Support innovative ideas and projects that can make a difference in communities across Nigeria.',
    },
    {
        title: 'Connect and grow.',
        subtitle: 'Together we can.',
        description:
            'Build meaningful connections, share opportunities, and grow together.',
    },
]

export default function SignupSlideshow() {
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((current) => (current + 1) % slides.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div
            className="relative min-h-screen w-full overflow-hidden"
            style={{ background: 'linear-gradient(150deg, #0A1E33 0%, #102A43 55%, #00688A 100%)' }}
        >
            {/* Soft glow accents — no stock photos */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 25% 30%, #00A86B 0%, transparent 50%), radial-gradient(circle at 75% 75%, #00B8D9 0%, transparent 50%)',
                }}
            />

            {/* Content */}
            <div className="relative z-10 flex min-h-screen flex-col justify-between p-12">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Hubnovo" width={52} height={52} className="rounded-xl" />
                    <Image src="/logo-wordmark.png" alt="Hubnovo" width={156} height={52} className="h-12 w-auto" />
                </Link>

                {/* Illustration */}
                <div className="flex-1 flex items-center justify-center max-h-72">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.title}
                            className={`absolute transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <CommunityIllustration className="w-80 h-60" />
                        </div>
                    ))}
                </div>

                {/* Text */}
                <div className="max-w-xl text-white pb-8">
                    <h2 className="text-5xl font-bold leading-tight">
                        {slides[currentSlide].title}
                        <br />
                        {slides[currentSlide].subtitle}
                    </h2>

                    <p className="mt-5 text-xl text-white/80 leading-relaxed max-w-lg">
                        {slides[currentSlide].description}
                    </p>

                    {/* Slide indicators */}
                    <div className="flex gap-2 mt-8">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setCurrentSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                className={`h-2 rounded-full transition-all ${index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
