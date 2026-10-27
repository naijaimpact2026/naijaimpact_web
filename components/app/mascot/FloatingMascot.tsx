'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  MessageSquare,
  Shirt,
  Volume2,
  VolumeX,
  Sparkles,
  Minimize2
} from 'lucide-react'
import { MascotLook } from '@/lib/mascot/types'
import { playMascotChime, playMascotGiggle, playPopSound } from '@/lib/mascot/audio'
import SpeechBubble from './SpeechBubble'
import MascotFaceOverlay, { MascotExpression } from './MascotFaceOverlay'

interface FloatingMascotProps {
  currentLook: MascotLook
  onOpenChat: () => void
  onOpenWardrobe: () => void
  isChatOpen: boolean
  soundEnabled: boolean
  onToggleSound: () => void
  screenPath: string
}

/*
 * Pinned to the bottom-right corner with CSS (right/bottom), never moved by
 * JS. Mobile/tablet browsers fire `resize` whenever the address bar shows or
 * hides on scroll — a JS-positioned mascot re-animated on each one, which is
 * what made it drift up and down and flicker on tablets. No dragging or
 * roaming either, so a tap on the speech bubble's X can't be mistaken for a
 * tap on the mascot.
 */
const DOCK_CLASSES =
  'fixed z-[45] right-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:right-5 lg:bottom-6'

export default function FloatingMascot({
  currentLook,
  onOpenChat,
  onOpenWardrobe,
  isChatOpen,
  soundEnabled,
  onToggleSound,
  screenPath
}: FloatingMascotProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)
  const [activeSpeechTip, setActiveSpeechTip] = useState<string | null>(null)
  const [sparkleActive, setSparkleActive] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Real-time facial expressions & waving states
  const [expression, setExpression] = useState<MascotExpression>('idle')
  const [isHovered, setIsHovered] = useState(false)
  const [isTalking, setIsTalking] = useState(false)
  const [isWaving, setIsWaving] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem('novo_mascot_minimized') === 'true') setIsMinimized(true)
      // Positions saved by the old draggable/roaming mascot no longer apply.
      localStorage.removeItem('novo_mascot_user_dragged')
      localStorage.removeItem('novo_mascot_x')
      localStorage.removeItem('novo_mascot_y')
      localStorage.removeItem('novo_wander_mode_v2')
    } catch {}
    setIsInitialized(true)
  }, [])

  // ── Waving Animation Trigger ──
  // Only the hand waves; the body stays put.
  const triggerWave = useCallback(() => {
    setIsWaving(true)
    setTimeout(() => setIsWaving(false), 2200)
  }, [])

  // ── Natural Eye Blinking & Facial Expressions Engine ──
  // Every timer in the chain is tracked so a re-run (e.g. hover changes, which
  // a tap triggers on touch screens) cancels the old chain instead of leaving
  // it running alongside the new one.
  useEffect(() => {
    if (!isInitialized || isMinimized || isHovered) return

    const timers = new Set<ReturnType<typeof setTimeout>>()
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t)
        fn()
      }, ms)
      timers.add(t)
    }

    function scheduleBlink() {
      // Natural interval between 2.8s and 5.2s
      later(() => {
        const rand = Math.random()
        if (rand < 0.22) {
          setExpression('wink')
          later(() => {
            setExpression('idle')
            scheduleBlink()
          }, 600)
        } else if (rand < 0.45) {
          setExpression('blink')
          later(() => {
            setExpression('idle')
            later(() => {
              setExpression('blink')
              later(() => {
                setExpression('idle')
                scheduleBlink()
              }, 130)
            }, 70)
          }, 130)
        } else {
          setExpression('blink')
          later(() => {
            setExpression('idle')
            scheduleBlink()
          }, 140)
        }
      }, Math.floor(Math.random() * 2400) + 2800)
    }

    scheduleBlink()
    return () => timers.forEach(clearTimeout)
  }, [isInitialized, isMinimized, isHovered])

  // Wave hello on screen change or initial load
  useEffect(() => {
    if (!isInitialized || isMinimized) return
    const timer = setTimeout(triggerWave, 800)
    return () => clearTimeout(timer)
  }, [isInitialized, isMinimized, triggerWave, screenPath])

  // Periodic friendly wave while idle (every ~16 seconds)
  useEffect(() => {
    if (!isInitialized || isMinimized || isChatOpen) return
    const waveInterval = setInterval(() => {
      if (!isHovered && Math.random() > 0.4) triggerWave()
    }, 16000)
    return () => clearInterval(waveInterval)
  }, [isInitialized, isMinimized, isChatOpen, isHovered, triggerWave])

  // Synchronize mouth talking when speech tip is shown
  useEffect(() => {
    if (!activeSpeechTip) {
      setIsTalking(false)
      return
    }
    setIsTalking(true)
    const timer = setTimeout(() => setIsTalking(false), 3500)
    return () => clearTimeout(timer)
  }, [activeSpeechTip])

  // Contextual speech tip on screen change; auto-hides after 7 seconds
  useEffect(() => {
    if (!isInitialized || isChatOpen || isMinimized) return

    const tip =
      currentLook.idleTips[Math.floor(Math.random() * currentLook.idleTips.length)] ||
      currentLook.welcomeGreeting

    let hideTimer: ReturnType<typeof setTimeout> | undefined
    const showTimer = setTimeout(() => {
      setActiveSpeechTip(tip)
      playPopSound(!soundEnabled)
      hideTimer = setTimeout(() => setActiveSpeechTip(null), 7000)
    }, 1200)

    return () => {
      clearTimeout(showTimer)
      if (hideTimer) clearTimeout(hideTimer)
    }
    // soundEnabled is read when the tip appears; toggling sound shouldn't re-show it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenPath, currentLook, isInitialized, isChatOpen, isMinimized])

  function handleMascotClick() {
    setSparkleActive(true)
    setExpression('happy')
    triggerWave()
    setTimeout(() => {
      setSparkleActive(false)
      setExpression('idle')
    }, 1400)

    playMascotChime(!soundEnabled)
    onOpenChat()
  }

  function handleToggleMinimize() {
    setIsMinimized((prev) => {
      const next = !prev
      try {
        localStorage.setItem('novo_mascot_minimized', next.toString())
      } catch {}
      return next
    })
  }

  if (!isInitialized) return null

  // Minimized: a small badge in the same corner
  if (isMinimized) {
    return (
      <div className={`${DOCK_CLASSES} animate-in fade-in zoom-in-75 duration-200`}>
        <button
          type="button"
          onClick={() => {
            setIsMinimized(false)
            onOpenChat()
          }}
          className="group relative flex items-center gap-2 px-3 py-2 rounded-full bg-card dark:bg-slate-900 border border-emerald-500/40 shadow-lg hover:border-emerald-500 transition-colors active:scale-95 text-xs font-semibold text-foreground"
          aria-label="Wake up Novo AI"
        >
          <div className="relative w-7 h-7">
            <Image
              src={currentLook.image}
              alt={currentLook.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <span className="hidden sm:inline text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Novo AI
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`${DOCK_CLASSES} group select-none`}
      onMouseEnter={() => {
        setShowToolbar(true)
        setIsHovered(true)
        setExpression('happy')
      }}
      onMouseLeave={() => {
        setShowToolbar(false)
        setIsHovered(false)
        setExpression('idle')
      }}
      aria-label={`Novo AI Companion (${currentLook.name})`}
    >
      {/* Speech bubble — a sibling of the mascot button, so its X only closes it */}
      {activeSpeechTip && !isChatOpen && (
        <SpeechBubble
          message={activeSpeechTip}
          onClose={() => setActiveSpeechTip(null)}
          onClick={() => {
            setActiveSpeechTip(null)
            onOpenChat()
          }}
          side="right"
          isNearTop={false}
        />
      )}

      {/* Sparkle burst on tap */}
      {sparkleActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-ping">
          <Sparkles className="w-16 h-16 text-emerald-400 opacity-75" />
        </div>
      )}

      {/* Quick action toolbar (shown on hover; right-aligned so it never runs off-screen) */}
      <div
        className={`absolute -top-10 right-0 flex items-center gap-1 px-2 py-1 rounded-full bg-card dark:bg-slate-900 border border-emerald-500/30 shadow-md transition-opacity duration-200 z-50 ${
          showToolbar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={onOpenChat}
          title="Open AI Chat"
          className="p-1 rounded-full text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onOpenWardrobe}
          title="Wardrobe (24 looks)"
          className="p-1 rounded-full text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
        >
          <Shirt className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <VolumeX className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={handleToggleMinimize}
          title="Snooze / Minimize to Corner"
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mascot — the only thing that opens the chat */}
      <button
        type="button"
        onClick={handleMascotClick}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') playMascotGiggle(!soundEnabled)
        }}
        aria-label={`Chat with ${currentLook.name}`}
        className="relative block w-20 h-20 sm:w-24 sm:h-24 cursor-pointer touch-manipulation"
      >
        {/* Static glow — no blur animation, which flickers on tablet GPUs */}
        <span
          className="absolute inset-2 rounded-full blur-lg opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none"
          style={{ backgroundColor: currentLook.glowColor }}
        />

        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-3 bg-black/25 dark:bg-black/50 rounded-full blur-[3px] pointer-events-none" />

        <span className="relative block w-full h-full">
          <Image
            src={currentLook.image}
            alt={currentLook.name}
            fill
            priority
            sizes="96px"
            className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] pointer-events-none select-none"
            unoptimized
          />

          {/* Real-time facial expressions (blinking, winking, happy eyes, talking) */}
          <MascotFaceOverlay
            imagePath={currentLook.image}
            expression={expression}
            isHovered={isHovered}
            isTalking={isTalking}
          />

          {/* Waving hand */}
          {isWaving && (
            <span
              className="absolute -top-3.5 -right-2 z-20 pointer-events-none"
              style={{
                transformOrigin: 'bottom center',
                animation: 'novoArmWave 0.25s ease-in-out infinite alternate'
              }}
            >
              <span className="flex w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-white dark:border-slate-800 shadow-lg items-center justify-center text-sm">
                👋
              </span>
            </span>
          )}
        </span>

        {/* Name pill on hover */}
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-card dark:bg-slate-900 border border-emerald-500/30 text-[9px] font-bold text-foreground shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {currentLook.name}
        </span>
      </button>

      <style jsx global>{`
        @keyframes novoArmWave {
          0% {
            transform: rotate(-22deg);
          }
          100% {
            transform: rotate(26deg);
          }
        }
      `}</style>
    </div>
  )
}
