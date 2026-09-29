'use client'

import React from 'react'
import Image from 'next/image'
import {
    ArrowRight,
    Lightbulb,
    Handshake,
    TrendingUp,
    Rocket,
    Sparkles,
} from 'lucide-react'

interface LaunchpadHeroProps
{
    onStartJourney?: () => void
}

export default function LaunchpadHero({ onStartJourney }: LaunchpadHeroProps)
{
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c2237] via-[#102a43] to-[#081827] text-white shadow-xl border border-white/10">
            {/* Ambient background decorative glow */}
            <div className="absolute top-0 right-1/4 -mt-16 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 -mb-16 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-6 sm:p-8 lg:p-10 gap-8">
                {/* Left Column: Headlines & Call to Action */}
                <div className="flex-1 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-cyan-300 text-xs font-semibold mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Hubnovo Business Hub</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                        Business Launchpad
                    </h1>

                    <p className="mt-2 text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
                        Plan. Fund. Launch. Grow.
                    </p>

                    <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                        Everything you need to start and scale your business in one place. Turn your ideas into thriving enterprises with structured guidance and funding access.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-4">
                        <button
                            onClick={onStartJourney}
                            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-bold text-sm sm:text-base transition-all shadow-lg shadow-emerald-500/30 cursor-pointer group"
                        >
                            <span>Start Your Business Journey</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Right Column: Imagery with Floating "From Ideas to Impact" */}
                <div className="relative shrink-0 w-full sm:w-auto flex justify-center lg:justify-end">
                    {/* Handwritten Script Badge */}
                    <div className="absolute -top-3 -right-2 sm:-right-4 z-20 rotate-6 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full shadow-lg">
                        <span className="font-serif italic font-bold text-xs sm:text-sm text-amber-200 drop-shadow-sm whitespace-nowrap">
                            ✨ From Ideas to Impact
                        </span>
                    </div>

                    {/* Image Container with Soft Shadow & Border */}
                    <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl group">
                        <Image
                            src="/images/launchpad/hero-entrepreneur.jpg"
                            alt="African female entrepreneur working on her business launchpad"
                            fill
                            sizes="(max-width: 640px) 256px, (max-width: 1024px) 288px, 320px"
                            className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c2237]/80 via-transparent to-transparent" />
                    </div>
                </div>
            </div>

            {/* Bottom Value Proposition Pills */}
            <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm px-6 py-3.5 sm:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">Turn Ideas into Businesses</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                            <Handshake className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">Access Funding & Resources</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">Get Expert Guidance</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                            <Rocket className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">Create Jobs & Impact</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
