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
            className="relative h-screen w-full overflow-hidden"
            style={{
                background:
                    'linear-gradient(135deg, #19B5E6 0%, #087FD0 45%, #064EB3 100%)',
            }}
        >


            {/* =====================================================
                BACKGROUND EFFECTS
            ===================================================== */}
            <div className="absolute inset-0 pointer-events-none">

                <div
                    className="absolute inset-0"
                    style={{
                        background: `
                            radial-gradient(
                                circle at 15% 15%,
                                rgba(255,255,255,0.24) 0%,
                                transparent 30%
                            ),
                            radial-gradient(
                                circle at 85% 25%,
                                rgba(0,255,214,0.18) 0%,
                                transparent 32%
                            ),
                            radial-gradient(
                                circle at 45% 70%,
                                rgba(0,130,255,0.22) 0%,
                                transparent 45%
                            )
                        `,
                    }}
                />

                {/* Decorative circles */}
                <div className="absolute -right-32 -bottom-32 w-[500px] h-[500px] rounded-full border border-white/10" />

                <div className="absolute -right-20 -bottom-20 w-[360px] h-[360px] rounded-full bg-cyan-300/10" />

                <div className="absolute right-[-80px] bottom-[-100px] w-[300px] h-[300px] rounded-full bg-emerald-300/20" />

                <div className="absolute -left-32 top-[35%] w-[300px] h-[300px] rounded-full bg-white/5 blur-3xl" />

            </div>


            {/* =====================================================
                MAIN CONTENT
            ===================================================== */}
            <div className="relative z-10 h-full flex flex-col p-12 overflow-hidden">


                {/* =================================================
                    LOGO
                ================================================= */}
                <Link
                    href="/"
                    className="flex items-center gap-3 w-fit shrink-0"
                >
                    <Image
                        src="/logo.png"
                        alt="Hubnovo"
                        width={60}
                        height={60}
                        className="rounded-2xl shadow-xl"
                    />

                    <Image
                        src="/logo-wordmark.png"
                        alt="Hubnovo"
                        width={180}
                        height={60}
                        className="h-14 w-auto"
                    />

                </Link>


                {/* =================================================
                    ILLUSTRATION
                ================================================= */}
                <div className="absolute top-[15%] left-0 right-0 h-[300px] flex items-center justify-center">

                    {slides.map((slide, index) => (
                        <div
                            key={slide.title}
                            className={`
                                absolute
                                transition-all
                                duration-1000
                                ease-out
                                ${
                                    index === currentSlide
                                        ? 'opacity-100 scale-100'
                                        : 'opacity-0 scale-95 pointer-events-none'
                                }
                            `}
                        >
                            <div className="relative">

                                {/* Illustration glow */}
                                <div className="absolute inset-10 rounded-full bg-cyan-300/20 blur-3xl" />

                                <CommunityIllustration
                                    className="relative z-10 w-[320px] h-[240px] md:w-[360px] md:h-[270px]"
                                />

                            </div>
                        </div>
                    ))}

                </div>


                {/* =================================================
                    TEXT
                ================================================= */}
                <div className="absolute left-12 right-12 bottom-10 max-w-2xl text-white">

                    {/* Small label */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm mb-5">

                        <span className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,255,190,0.9)]" />

                        <span className="text-xs font-medium tracking-wide text-white/85">
                            BUILT FOR NIGERIA
                        </span>

                    </div>


                    {/* Heading */}
                    <h2 className="text-5xl md:text-6xl font-bold leading-[1.05] tracking-[-0.03em] min-h-[126px]">

                        {slides[currentSlide].title}

                        <br />

                        <span
                            style={{
                                backgroundImage:
                                    'linear-gradient(100deg, #FFFFFF 0%, #D9FBFF 35%, #42F2C8 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {slides[currentSlide].subtitle}
                        </span>

                    </h2>


                    {/* Description */}
                    <p className="mt-5 text-lg md:text-xl text-white/80 leading-relaxed max-w-xl min-h-[58px]">

                        {slides[currentSlide].description}

                    </p>


                    {/* =================================================
                        SLIDE CONTROLS
                    ================================================= */}
                    <div className="flex items-center gap-3 mt-6">

                        {slides.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setCurrentSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                className={`
                                    h-2 rounded-full transition-all duration-500
                                    ${
                                        index === currentSlide
                                            ? 'w-10 bg-white'
                                            : 'w-2 bg-white/35 hover:bg-white/60'
                                    }
                                `}
                            />
                        ))}

                        <span className="ml-2 text-xs text-white/50">
                            {currentSlide + 1} / {slides.length}
                        </span>

                    </div>

                </div>

            </div>
        </div>
    )
}