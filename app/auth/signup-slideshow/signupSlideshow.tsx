'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const slides = [
    {
        image: '/signup/slide1.png',
        title: 'Join the movement.',
        subtitle: 'Build Nigeria.',
        description:
            'Connect with people, discover opportunities, and be part of a movement creating real impact.',
    },
    {
        image: '/signup/slide2.png',
        title: 'Fund great ideas.',
        subtitle: 'Create real impact.',
        description:
            'Support innovative ideas and projects that can make a difference in communities across Nigeria.',
    },
    {
        image: '/signup/slide3.png',
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
        <div className="relative min-h-screen w-full overflow-hidden">

            {/* Background slides */}
            {slides.map((slide, index) => (
                <div
                    key={slide.image}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                        index === currentSlide
                            ? 'opacity-100'
                            : 'opacity-0'
                    }`}
                >
                    <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        sizes="50vw"
                        loading={index === 0 ? 'eager' : 'lazy'}
                        priority={index === 0}
                        className="object-cover object-center scale-100"
                    />

                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/60" />

                    {/* Bottom gradient */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
            ))}

            {/* Content */}
            <div className="relative z-10 flex min-h-screen flex-col justify-between p-12">

                {/* Logo */}
                <div className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="Hubnovo"
                        width={52}
                        height={52}
                        className="rounded-xl"
                    />

                    <span className="text-white font-bold text-2xl">
                        Hubnovo
                    </span>
                </div>

                {/* Text */}
                <div className="max-w-xl text-white pb-8">

                    <h2 className="text-5xl font-bold leading-tight drop-shadow-lg">
                        {slides[currentSlide].title}
                        <br />
                        {slides[currentSlide].subtitle}
                    </h2>

                    <p className="mt-5 text-xl text-white leading-relaxed drop-shadow-lg max-w-lg">
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
                                className={`h-2 rounded-full transition-all ${
                                    index === currentSlide
                                        ? 'w-8 bg-white'
                                        : 'w-2 bg-white/50'
                                }`}
                            />
                        ))}
                    </div>

                </div>
            </div>
        </div>
    )
}