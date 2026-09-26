'use client'

import React from 'react'

export default function ChatWallpaper()
{
    return (
        <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 bg-background"
        >
            {/* ── 1. Animated Ambient Aurora Glowing Mesh Orbs (GPU accelerated) ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Orb 1: Primary Sky / Electric Blue */}
                <div
                    className="chat-aurora-orb-1 absolute -top-16 -left-12 w-[400px] h-[400px] md:w-[560px] md:h-[560px] rounded-full filter blur-[80px] md:blur-[110px] opacity-55 dark:opacity-40 will-change-transform"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(14, 165, 233, 0.7) 0%, rgba(56, 189, 248, 0.35) 50%, transparent 75%)',
                    }}
                />

                {/* Orb 2: Hubnovo Emerald / Fresh Mint */}
                <div
                    className="chat-aurora-orb-2 absolute top-[35%] -right-16 w-[360px] h-[360px] md:w-[500px] md:h-[500px] rounded-full filter blur-[80px] md:blur-[110px] opacity-50 dark:opacity-35 will-change-transform"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(16, 185, 129, 0.65) 0%, rgba(52, 211, 153, 0.3) 50%, transparent 75%)',
                    }}
                />

                {/* Orb 3: Violet / Indigo Ambient Pulse */}
                <div
                    className="chat-aurora-orb-3 absolute -bottom-12 left-[18%] w-[340px] h-[340px] md:w-[460px] md:h-[460px] rounded-full filter blur-[70px] md:blur-[100px] opacity-45 dark:opacity-30 will-change-transform"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(168, 85, 247, 0.25) 50%, transparent 75%)',
                    }}
                />

                {/* Orb 4: Warm Amber / Sun Glow for rich color contrast */}
                <div
                    className="chat-aurora-orb-4 absolute top-[15%] left-[45%] w-[280px] h-[280px] md:w-[380px] md:h-[380px] rounded-full filter blur-[70px] md:blur-[95px] opacity-40 dark:opacity-25 will-change-transform"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, rgba(251, 191, 36, 0.2) 50%, transparent 75%)',
                    }}
                />
            </div>

            {/* ── 2. Vector Telegram/WhatsApp-style Doodle Pattern (240x240 tile) ── */}
            <svg
                className="absolute inset-0 w-full h-full text-slate-800/[0.13] dark:text-cyan-200/[0.18]"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
            >
                <defs>
                    <pattern
                        id="chat-doodle-pattern"
                        width="240"
                        height="240"
                        patternUnits="userSpaceOnUse"
                    >
                        {/* ── Row 1 ── */}
                        {/* Speech Bubble with Typing Dots */}
                        <g transform="translate(14, 14)">
                            <path
                                d="M 4 4 h 26 a 5 5 0 0 1 5 5 v 12 a 5 5 0 0 1 -5 5 h -15 l -7 5 v -5 h -4 a 5 5 0 0 1 -5 -5 v -12 a 5 5 0 0 1 5 -5 z"
                                stroke="currentColor"
                                fill="currentColor"
                                fillOpacity="0.04"
                                strokeWidth="1.55"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="12" cy="15" r="1.4" fill="currentColor" />
                            <circle cx="17" cy="15" r="1.4" fill="currentColor" />
                            <circle cx="22" cy="15" r="1.4" fill="currentColor" />
                        </g>

                        {/* 4-point Sparkle */}
                        <path
                            d="M 90 20 q 0 7 7 7 q -7 0 -7 7 q 0 -7 -7 -7 q 7 0 7 -7 z"
                            stroke="currentColor"
                            fill="currentColor"
                            fillOpacity="0.12"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Telegram Paper Airplane */}
                        <g transform="translate(142, 16)">
                            <path
                                d="M 2 16 l 22 -12 l -11 22 l -3 -8 l -8 -2 z"
                                stroke="currentColor"
                                fill="currentColor"
                                fillOpacity="0.05"
                                strokeWidth="1.55"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M 10 10 l 14 -6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* Music Headphones */}
                        <g transform="translate(202, 16)">
                            <path
                                d="M 3 16 a 9 9 0 0 1 18 0 v 5 a 2 2 0 0 1 -2 2 h -1 a 2 2 0 0 1 -2 -2 v -3 a 2 2 0 0 1 2 -2 h 3"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M 3 16 h 3 a 2 2 0 0 1 2 2 v 3 a 2 2 0 0 1 -2 2 h -1 a 2 2 0 0 1 -2 -2 v -5"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </g>

                        {/* ── Row 2 ── */}
                        {/* Romantic / Like Heart */}
                        <path
                            d="M 32 76 c -3 -5 -11 -5 -14 0 c -3 5 3 10 14 17 c 11 -7 17 -12 14 -17 c -3 -5 -11 -5 -14 0 z"
                            stroke="currentColor"
                            fill="currentColor"
                            fillOpacity="0.10"
                            strokeWidth="1.55"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Voice Message Waveform */}
                        <g transform="translate(80, 74)">
                            <path
                                d="M 2 12 v 6 M 7 7 v 16 M 12 2 v 26 M 17 9 v 12 M 22 13 v 4"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* Friendly Smiley */}
                        <g transform="translate(142, 74)">
                            <circle
                                cx="12"
                                cy="12"
                                r="11"
                                stroke="currentColor"
                                fill="currentColor"
                                fillOpacity="0.04"
                                strokeWidth="1.55"
                            />
                            <circle cx="8" cy="9.5" r="1.3" fill="currentColor" />
                            <circle cx="16" cy="9.5" r="1.3" fill="currentColor" />
                            <path
                                d="M 8 14.5 q 4 4 8 0"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* Energy Lightning Spark */}
                        <polygon
                            points="212,70 206,82 211,82 207,94 219,80 214,80"
                            stroke="currentColor"
                            fill="currentColor"
                            fillOpacity="0.12"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* ── Row 3 ── */}
                        {/* Security Padlock */}
                        <g transform="translate(20, 134)">
                            <rect
                                x="2"
                                y="8"
                                width="16"
                                height="13"
                                rx="3"
                                stroke="currentColor"
                                fill="currentColor"
                                fillOpacity="0.05"
                                strokeWidth="1.55"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M 6 8 v -4 a 4 4 0 0 1 8 0 v 4"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <circle cx="10" cy="14" r="1.4" fill="currentColor" />
                        </g>

                        {/* 5-Point Rating Star */}
                        <polygon
                            points="92,134 94.5,140 101,140.5 96,145 97.5,151.5 92,148 86.5,151.5 88,145 83,140.5 89.5,140"
                            stroke="currentColor"
                            fill="currentColor"
                            fillOpacity="0.10"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Double Read Checkmark */}
                        <g transform="translate(142, 138)">
                            <path
                                d="M 2 8 l 4 4 l 9 -10 M 7 8 l 4 4 l 9 -10"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </g>

                        {/* Coffee Break Mug */}
                        <g transform="translate(200, 136)">
                            <path
                                d="M 3 5 h 13 a 2 2 0 0 1 2 2 v 5 a 5 5 0 0 1 -5 5 h -5 a 5 5 0 0 1 -5 -5 v -5 a 2 2 0 0 1 2 -2 z"
                                stroke="currentColor"
                                fill="currentColor"
                                fillOpacity="0.04"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M 18 7 h 2.5 a 2 2 0 0 1 2 2 v 1 a 2 2 0 0 1 -2 2 h -2.5 M 1 19 h 17"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* ── Row 4 ── */}
                        {/* Conversation Overlap Bubbles */}
                        <g transform="translate(18, 194)">
                            <path
                                d="M 2 4 h 14 a 4 4 0 0 1 4 4 v 6 a 4 4 0 0 1 -4 4 h -8 l -4 3 v -3 h -2 a 4 4 0 0 1 -4 -4 v -6 a 4 4 0 0 1 4 -4 z"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M 16 12 h 6 a 3 3 0 0 1 3 3 v 4 a 3 3 0 0 1 -3 3 h -2 v 2 l -3 -2 h -1"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </g>

                        {/* Melodic Eighth Notes */}
                        <g transform="translate(84, 194)">
                            <path
                                d="M 8 18 v -13 l 12 -3 v 13 M 2 18 a 4 3 0 1 0 6 -2.5 M 14 15 a 4 3 0 1 0 6 -2.5"
                                stroke="currentColor"
                                fill="currentColor"
                                fillOpacity="0.10"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </g>

                        {/* Rocket / Velocity */}
                        <g transform="translate(142, 194)">
                            <path
                                d="M 12 2 q 8 8 2 18 l -3 -3 l -3 3 q 10 -6 4 -18 z"
                                stroke="currentColor"
                                fill="currentColor"
                                fillOpacity="0.08"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M 6 13 l -4 3 v -4 z M 16 13 l 4 3 v -4 z"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* Thumbs Up Like */}
                        <g transform="translate(202, 194)">
                            <path
                                d="M 2 8 v 7 h 3 v -7 z M 5 8 h 7 a 2 2 0 0 1 2 2 v 1 a 2 2 0 0 1 -1 1.8 a 2 2 0 0 1 0 2.4 a 2 2 0 0 1 -1 1.8 h -7 v -9 l 3 -5 a 1.5 1.5 0 0 1 2.5 1.5 l -1.5 3.5"
                                stroke="currentColor"
                                fill="currentColor"
                                fillOpacity="0.08"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </g>
                    </pattern>
                </defs>

                <rect
                    width="100%"
                    height="100%"
                    fill="url(#chat-doodle-pattern)"
                />
            </svg>

            {/* ── 3. Subtle Vignette Overlay to blend edges into headers and composer ── */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,var(--color-background)_100%)] opacity-25 dark:opacity-20 pointer-events-none" />
        </div>
    )
}
