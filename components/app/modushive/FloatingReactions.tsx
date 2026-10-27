'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Channel } from 'stream-chat'
import { Heart } from 'lucide-react'
import { useChatClient } from '@/components/app/ChatProvider'

const QUICK_REACTIONS = [
    { emoji: '❤️', label: 'Love' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '👏', label: 'Applause' },
    { emoji: '🎉', label: 'Celebrate' },
    { emoji: '🚀', label: 'Rocket' },
    { emoji: '💯', label: '100' },
    { emoji: '🤩', label: 'Star eyes' },
]

interface ReactionParticle {
    id: string
    emoji: string
    startX: number
    sway1: number
    sway2: number
    sway3: number
    sway4: number
    rot: number
    duration: number
    size: number
}

interface FloatingReactionsProps {
    channelId?: string | null
    channel?: Channel | null
    className?: string
    onDoubleTapTrigger?: boolean
}

export default function FloatingReactions({
    channelId,
    channel: propChannel,
    className = '',
}: FloatingReactionsProps) {
    const { client, isReady } = useChatClient()
    const [channel, setChannel] = useState<Channel | null>(propChannel ?? null)
    const [particles, setParticles] = useState<ReactionParticle[]>([])
    const [lastTapTime, setLastTapTime] = useState(0)

    // Keep reference to channel state
    useEffect(() => {
        if (propChannel) {
            setChannel(propChannel)
            return
        }
        if (!client || !isReady || !channelId) return

        let cancelled = false
        const ch = client.channel('livestream', channelId)
        ch.watch()
            .then(() => {
                if (!cancelled) setChannel(ch)
            })
            .catch(() => {
                // degrades gracefully to local-only reactions
            })

        return () => {
            cancelled = true
        }
    }, [client, isReady, channelId, propChannel])

    // Spawn an animated floating particle
    const spawnParticle = useCallback((emoji: string, originXPercent = 85) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        // Randomize sway offsets for organic fluid movement
        const sway1 = (Math.random() - 0.5) * 40
        const sway2 = (Math.random() - 0.5) * 70
        const sway3 = (Math.random() - 0.5) * 50
        const sway4 = (Math.random() - 0.5) * 60
        const rot = (Math.random() - 0.5) * 35
        const duration = 2.0 + Math.random() * 0.8
        const size = 30 + Math.floor(Math.random() * 14)

        const newParticle: ReactionParticle = {
            id,
            emoji,
            startX: originXPercent + (Math.random() - 0.5) * 8,
            sway1,
            sway2,
            sway3,
            sway4,
            rot,
            duration,
            size,
        }

        setParticles((prev) => [...prev.slice(-30), newParticle])

        // Auto remove particle after animation completes
        setTimeout(() => {
            setParticles((prev) => prev.filter((p) => p.id !== id))
        }, duration * 1000 + 100)
    }, [])

    // Subscribe to remote reactions from other live viewers
    useEffect(() => {
        if (!channel) return

        const handleReactionEvent = (event: any) => {
            const emoji = event?.emoji || event?.text || '❤️'
            if (emoji === '🪙') {
                // Golden celebration shower for tips!
                const celebratory = ['🪙', '⭐', '🪙', '✨', '👑', '🎉', '🪙', '⭐']
                celebratory.forEach((em, idx) => {
                    setTimeout(() => {
                        spawnParticle(em, 35 + Math.random() * 50)
                    }, idx * 100)
                })
            } else {
                spawnParticle(emoji, 82)
            }
        }

        const sub = (channel as any).on('live_reaction', handleReactionEvent)
        const subGeneric = channel.on('reaction.new', (event: any) => {
            if (event?.reaction?.type) {
                spawnParticle(event.reaction.type, 85)
            }
        })

        return () => {
            sub.unsubscribe()
            subGeneric.unsubscribe()
        }
    }, [channel, spawnParticle])

    // Trigger reaction locally and broadcast to stream chat
    const handleReact = useCallback(
        async (emoji: string) => {
            // Instant local visual feedback
            spawnParticle(emoji, 86)

            // Broadcast to other live stream viewers
            if (channel) {
                try {
                    await channel.sendEvent({
                        type: 'live_reaction',
                        emoji,
                    } as any)
                } catch {
                    // Non-blocking if network blips
                }
            }
        },
        [channel, spawnParticle]
    )

    // Handle double-tap anywhere on screen/video to send heart
    const handleScreenTap = useCallback(() => {
        const now = Date.now()
        if (now - lastTapTime < 300) {
            handleReact('❤️')
            setLastTapTime(0)
        } else {
            setLastTapTime(now)
        }
    }, [lastTapTime, handleReact])

    return (
        <div
            className={`pointer-events-none absolute inset-0 z-20 overflow-hidden ${className}`}
            onClick={handleScreenTap}
        >
            {/* Floating Particles Stage */}
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="animate-float-reaction absolute bottom-16 select-none"
                        style={
                            {
                                left: `${p.startX}%`,
                                fontSize: `${p.size}px`,
                                '--reaction-sway-1': `${p.sway1}px`,
                                '--reaction-sway-2': `${p.sway2}px`,
                                '--reaction-sway-3': `${p.sway3}px`,
                                '--reaction-sway-4': `${p.sway4}px`,
                                '--reaction-rot': `${p.rot}deg`,
                                '--reaction-duration': `${p.duration}s`,
                            } as React.CSSProperties
                        }
                    >
                        <span className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]">
                            {p.emoji}
                        </span>
                    </div>
                ))}
            </div>

            {/* Bottom Right Reactions Emitter Bar */}
            <div className="pointer-events-auto absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-2xl">
                {QUICK_REACTIONS.map((item) => (
                    <button
                        key={item.label}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleReact(item.emoji)
                        }}
                        aria-label={`Send ${item.label} reaction`}
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-base sm:text-lg transition-transform active:scale-125 hover:scale-110 hover:bg-white/15 cursor-pointer"
                    >
                        {item.emoji}
                    </button>
                ))}
            </div>
        </div>
    )
}
