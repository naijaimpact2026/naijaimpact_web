'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  MessageSquare,
  Shirt,
  Volume2,
  VolumeX,
  Compass,
  Footprints,
  Sparkles,
  Minimize2
} from 'lucide-react'
import { MascotLook, MascotPosition } from '@/lib/mascot/types'
import { playMascotChime, playMascotHop, playMascotGiggle, playPopSound } from '@/lib/mascot/audio'
import SpeechBubble from './SpeechBubble'
import MascotFaceOverlay, { MascotExpression } from './MascotFaceOverlay'

interface FloatingMascotProps {
  currentLook: MascotLook
  onOpenChat: () => void
  onOpenWardrobe: () => void
  isChatOpen: boolean
  soundEnabled: boolean
  onToggleSound: () => void
  wanderMode: boolean
  onToggleWander: () => void
  screenPath: string
  userName?: string
  onPositionChange?: (pos: MascotPosition) => void
}

export default function FloatingMascot({
  currentLook,
  onOpenChat,
  onOpenWardrobe,
  isChatOpen,
  soundEnabled,
  onToggleSound,
  wanderMode,
  onToggleWander,
  screenPath,
  userName = 'Friend',
  onPositionChange
}: FloatingMascotProps) {
  // Mascot position (x, y) relative to viewport
  const [position, setPosition] = useState<MascotPosition>({
    x: -9999,
    y: -9999,
    dockedSide: 'right'
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragTilt, setDragTilt] = useState(0)
  const [isWalking, setIsWalking] = useState(false)
  const [facingDirection, setFacingDirection] = useState<'left' | 'right'>('right')
  const [showToolbar, setShowToolbar] = useState(false)
  const [activeSpeechTip, setActiveSpeechTip] = useState<string | null>(null)
  const [sparkleActive, setSparkleActive] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Real-time facial expressions & waving states
  const [expression, setExpression] = useState<MascotExpression>('idle')
  const [isHovered, setIsHovered] = useState(false)
  const [isTalking, setIsTalking] = useState(false)
  const [isWaving, setIsWaving] = useState(false)

  const mascotRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ startX: number; startY: number; mouseStartX: number; mouseStartY: number } | null>(null)
  const lastInteractionRef = useRef<number>(Date.now())
  const hasDraggedRef = useRef(false)

  // Clamp position to viewport safe zone
  const clampPosition = useCallback((x: number, y: number): { x: number; y: number } => {
    if (typeof window === 'undefined') return { x, y }
    const size = 88
    const margin = 16
    const topSafe = 72 // clear top bar
    const bottomSafe = window.innerWidth < 1024 ? 90 : 24 // clear mobile bottom nav
    const maxX = Math.max(margin, window.innerWidth - size - margin)
    const maxY = Math.max(topSafe, window.innerHeight - size - bottomSafe)

    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(topSafe, y), maxY)
    }
  }, [])

  // Default docked position in the bottom-right corner
  const getDefaultBottomRightPosition = useCallback((): { x: number; y: number } => {
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    const isMobile = window.innerWidth < 1024
    const size = isMobile ? 80 : 96
    const margin = isMobile ? 12 : 20
    const bottomSafe = isMobile ? 86 : 28 // Clears mobile bottom navigation bar
    const x = window.innerWidth - size - margin
    const y = window.innerHeight - size - bottomSafe

    return clampPosition(x, y)
  }, [clampPosition])

  // Initialize position on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedMin = localStorage.getItem('novo_mascot_minimized')
      if (savedMin === 'true') {
        setIsMinimized(true)
      }

      // Check if user has explicitly dragged the mascot to a custom position
      const hasUserDragged = localStorage.getItem('novo_mascot_user_dragged') === 'true'
      const savedX = localStorage.getItem('novo_mascot_x')
      const savedY = localStorage.getItem('novo_mascot_y')

      if (hasUserDragged && savedX && savedY) {
        const clamped = clampPosition(parseFloat(savedX), parseFloat(savedY))
        setPosition({
          x: clamped.x,
          y: clamped.y,
          dockedSide: clamped.x > window.innerWidth / 2 ? 'right' : 'left'
        })
      } else {
        // By default, stay anchored in the bottom-right corner
        const def = getDefaultBottomRightPosition()
        setPosition({
          x: def.x,
          y: def.y,
          dockedSide: 'right'
        })
      }
    } catch {
      const def = getDefaultBottomRightPosition()
      setPosition({
        x: def.x,
        y: def.y,
        dockedSide: 'right'
      })
    }

    setIsInitialized(true)
  }, [clampPosition, getDefaultBottomRightPosition])

  // Return smoothly to bottom-right if wanderMode is turned off and user hasn't custom dragged
  useEffect(() => {
    if (!wanderMode && isInitialized && position.x !== -9999) {
      try {
        const hasUserDragged = localStorage.getItem('novo_mascot_user_dragged') === 'true'
        if (!hasUserDragged) {
          const def = getDefaultBottomRightPosition()
          setPosition({
            x: def.x,
            y: def.y,
            dockedSide: 'right'
          })
        }
      } catch {}
    }
  }, [wanderMode, isInitialized, getDefaultBottomRightPosition, position.x])

  // Notify parent of position changes for smart chatbox docking
  useEffect(() => {
    if (isInitialized && position.x !== -9999) {
      onPositionChange?.(position)
    }
  }, [position, isInitialized, onPositionChange])

  // Handle window resizing - keep docked to bottom-right unless manually placed by user
  useEffect(() => {
    function handleResize() {
      setPosition((prev) => {
        if (prev.x === -9999) return prev
        try {
          const hasUserDragged = localStorage.getItem('novo_mascot_user_dragged') === 'true'
          if (!hasUserDragged) {
            const def = getDefaultBottomRightPosition()
            return {
              x: def.x,
              y: def.y,
              dockedSide: 'right'
            }
          }
        } catch {}

        const clamped = clampPosition(prev.x, prev.y)
        return {
          ...prev,
          x: clamped.x,
          y: clamped.y,
          dockedSide: clamped.x > window.innerWidth / 2 ? 'right' : 'left'
        }
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [clampPosition, getDefaultBottomRightPosition])

  // ── Waving Animation Trigger ──
  const triggerWave = useCallback(() => {
    setIsWaving(true)
    setTimeout(() => {
      setIsWaving(false)
    }, 2200)
  }, [])

  // ── Natural Eye Blinking & Facial Expressions Engine ──
  useEffect(() => {
    if (!isInitialized || isMinimized) return

    let blinkTimer: ReturnType<typeof setTimeout>

    function scheduleBlink() {
      // Natural interval between 2.8s and 5.2s
      const delay = Math.floor(Math.random() * 2400) + 2800
      blinkTimer = setTimeout(() => {
        if (!isDragging && !isHovered) {
          const rand = Math.random()

          if (rand < 0.22) {
            // WINK! (22% chance)
            setExpression('wink')
            setTimeout(() => {
              setExpression('idle')
              scheduleBlink()
            }, 600)
            return
          } else if (rand < 0.45) {
            // DOUBLE BLINK! (23% chance)
            setExpression('blink')
            setTimeout(() => {
              setExpression('idle')
              setTimeout(() => {
                setExpression('blink')
                setTimeout(() => {
                  setExpression('idle')
                  scheduleBlink()
                }, 130)
              }, 70)
            }, 130)
            return
          } else {
            // REGULAR NATURAL BLINK (55% chance)
            setExpression('blink')
            setTimeout(() => {
              setExpression('idle')
              scheduleBlink()
            }, 140)
            return
          }
        }
        scheduleBlink()
      }, delay)
    }

    scheduleBlink()

    return () => clearTimeout(blinkTimer)
  }, [isInitialized, isMinimized, isDragging, isHovered])

  // Wave hello on screen change or initial load
  useEffect(() => {
    if (isInitialized && !isMinimized) {
      const timer = setTimeout(() => {
        triggerWave()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isInitialized, isMinimized, triggerWave, screenPath])

  // Periodic friendly wave while idle (every ~16 seconds)
  useEffect(() => {
    if (!isInitialized || isMinimized || isChatOpen) return

    const waveInterval = setInterval(() => {
      if (!isDragging && !isHovered && Math.random() > 0.4) {
        triggerWave()
      }
    }, 16000)

    return () => clearInterval(waveInterval)
  }, [isInitialized, isMinimized, isChatOpen, isDragging, isHovered, triggerWave])

  // Synchronize mouth talking when speech tip is shown
  useEffect(() => {
    if (activeSpeechTip) {
      setIsTalking(true)
      const timer = setTimeout(() => {
        setIsTalking(false)
      }, 3500)
      return () => clearTimeout(timer)
    } else {
      setIsTalking(false)
    }
  }, [activeSpeechTip])

  // Contextual speech tip trigger on screen change
  useEffect(() => {
    if (!isInitialized || isChatOpen || isMinimized) return

    // Pick a tip or greeting for this screen
    const tip =
      currentLook.idleTips[Math.floor(Math.random() * currentLook.idleTips.length)] ||
      currentLook.welcomeGreeting

    const timer = setTimeout(() => {
      setActiveSpeechTip(tip)
      playPopSound(!soundEnabled)

      // Auto-hide after 7 seconds
      const hideTimer = setTimeout(() => {
        setActiveSpeechTip(null)
      }, 7000)

      return () => clearTimeout(hideTimer)
    }, 1200)

    return () => clearTimeout(timer)
  }, [screenPath, currentLook, isInitialized, isChatOpen, isMinimized, soundEnabled])

  // Autonomous wandering / roaming logic
  useEffect(() => {
    if (!wanderMode || isChatOpen || isDragging || isMinimized || !isInitialized) return

    const wanderInterval = setInterval(() => {
      const now = Date.now()
      // Roam only if user hasn't interacted for 16 seconds
      if (now - lastInteractionRef.current < 16000) return

      if (typeof window === 'undefined') return

      const safeWidth = window.innerWidth
      const safeHeight = window.innerHeight
      const bottomSafe = safeWidth < 1024 ? 120 : 60

      // Choose a fun patrol waypoint
      const destinations: { x: number; y: number }[] = [
        { x: safeWidth - 110, y: safeHeight - (bottomSafe + 20) }, // Bottom-right
        { x: 30, y: safeHeight - (bottomSafe + 30) }, // Bottom-left
        { x: safeWidth - 110, y: Math.max(120, safeHeight / 2 - 40) }, // Mid-right
        { x: 30, y: Math.max(120, safeHeight / 2 - 40) } // Mid-left
      ]

      // Filter out the closest destination so it moves somewhere new
      const nextDest = destinations[Math.floor(Math.random() * destinations.length)]

      setIsWalking(true)
      setFacingDirection(nextDest.x < position.x ? 'left' : 'right')
      playMascotHop(!soundEnabled)

      const clamped = clampPosition(nextDest.x, nextDest.y)

      setPosition((prev) => ({
        x: clamped.x,
        y: clamped.y,
        dockedSide: clamped.x > safeWidth / 2 ? 'right' : 'left'
      }))

      // Stop walking animation after transition completes (1.2s)
      setTimeout(() => {
        setIsWalking(false)
        // Occasionally show a speech tip on arrival
        if (Math.random() > 0.4 && !activeSpeechTip) {
          const randomTip =
            currentLook.idleTips[Math.floor(Math.random() * currentLook.idleTips.length)]
          if (randomTip) {
            setActiveSpeechTip(randomTip)
            playPopSound(!soundEnabled)
            setTimeout(() => setActiveSpeechTip(null), 6000)
          }
        }
      }, 1200)
    }, 18000)

    return () => clearInterval(wanderInterval)
  }, [
    wanderMode,
    isChatOpen,
    isDragging,
    isMinimized,
    isInitialized,
    position.x,
    clampPosition,
    soundEnabled,
    activeSpeechTip,
    currentLook
  ])

  // Drag Pointer Handlers
  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return // Only primary click
    e.preventDefault()
    e.stopPropagation()

    lastInteractionRef.current = Date.now()
    hasDraggedRef.current = false
    setIsDragging(true)
    setIsWalking(false)

    dragStartRef.current = {
      startX: position.x,
      startY: position.y,
      mouseStartX: e.clientX,
      mouseStartY: e.clientY
    }

    if (mascotRef.current) {
      mascotRef.current.setPointerCapture(e.pointerId)
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging || !dragStartRef.current) return

    const deltaX = e.clientX - dragStartRef.current.mouseStartX
    const deltaY = e.clientY - dragStartRef.current.mouseStartY

    if (Math.hypot(deltaX, deltaY) > 5) {
      hasDraggedRef.current = true
    }

    const newX = dragStartRef.current.startX + deltaX
    const newY = dragStartRef.current.startY + deltaY

    // Calculate subtle tilt
    const tilt = Math.max(-25, Math.min(25, deltaX * 0.4))
    setDragTilt(tilt)
    setFacingDirection(deltaX < 0 ? 'left' : 'right')

    const clamped = clampPosition(newX, newY)
    setPosition({
      x: clamped.x,
      y: clamped.y,
      dockedSide: clamped.x > window.innerWidth / 2 ? 'right' : 'left'
    })
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isDragging) return
    setIsDragging(false)
    setDragTilt(0)

    if (mascotRef.current) {
      try {
        mascotRef.current.releasePointerCapture(e.pointerId)
      } catch {}
    }

    lastInteractionRef.current = Date.now()

    // If it was just a tap / click (not a drag), trigger click action!
    if (!hasDraggedRef.current) {
      handleMascotClick()
    } else {
      // Persist custom user-dragged position
      try {
        localStorage.setItem('novo_mascot_user_dragged', 'true')
        localStorage.setItem('novo_mascot_x', position.x.toString())
        localStorage.setItem('novo_mascot_y', position.y.toString())
      } catch {}
      playMascotHop(!soundEnabled)
    }
  }

  function handleMascotClick() {
    lastInteractionRef.current = Date.now()
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

  function handlePetGiggle(e: React.MouseEvent) {
    e.stopPropagation()
    lastInteractionRef.current = Date.now()
    playMascotGiggle(!soundEnabled)
    setSparkleActive(true)
    setExpression('happy')
    triggerWave()
    setTimeout(() => {
      setSparkleActive(false)
      setExpression('idle')
    }, 1200)
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

  if (!isInitialized || position.x === -9999) return null

  // If minimized, display a sleek floating badge on the docked side
  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          left: position.dockedSide === 'left' ? '8px' : 'auto',
          right: position.dockedSide === 'right' ? '8px' : 'auto',
          bottom: '80px',
          zIndex: 45
        }}
        className="animate-in fade-in zoom-in-75 duration-200"
      >
        <button
          type="button"
          onClick={() => {
            setIsMinimized(false)
            onOpenChat()
          }}
          className="group relative flex items-center gap-2 px-3 py-2 rounded-full bg-card/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 shadow-lg hover:shadow-emerald-500/25 hover:border-emerald-500 transition-all active:scale-95 text-xs font-semibold text-foreground"
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
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={mascotRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => {
        setShowToolbar(true)
        setIsHovered(true)
        setExpression('happy')
        triggerWave()
        playMascotGiggle(!soundEnabled)
      }}
      onMouseLeave={() => {
        setShowToolbar(false)
        setIsHovered(false)
        setExpression('idle')
      }}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 45,
        touchAction: 'none',
        transform: `rotate(${dragTilt}deg) scale(${isDragging ? 1.12 : 1})`,
        transition: isDragging ? 'none' : 'left 1.1s cubic-bezier(0.2, 0.8, 0.2, 1), top 1.1s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.2s ease-out'
      }}
      className={`group select-none cursor-grab active:cursor-grabbing ${
        isWalking ? 'animate-bounce' : ''
      }`}
      aria-label={`Novo AI Companion (${currentLook.name})`}
    >
      {/* Speech / Thought Bubble */}
      {activeSpeechTip && !isChatOpen && (
        <SpeechBubble
          message={activeSpeechTip}
          onClose={() => setActiveSpeechTip(null)}
          onClick={() => {
            setActiveSpeechTip(null)
            onOpenChat()
          }}
          side={position.dockedSide}
          isNearTop={position.y < 160}
        />
      )}

      {/* Floating Sparkles Burst */}
      {sparkleActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-ping">
          <Sparkles className="w-16 h-16 text-emerald-400 opacity-75" />
        </div>
      )}

      {/* Quick Action Toolbar (Pill on Hover) */}
      <div
        className={`absolute ${
          position.y < 80 ? '-bottom-10' : '-top-10'
        } left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-card/90 dark:bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 shadow-md transition-all duration-200 z-50 ${
          showToolbar || isDragging ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
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
          onClick={onToggleWander}
          title={wanderMode ? 'Wander Mode ON (Roaming) — Click to Dock in Corner' : 'Wander Mode OFF (Docked in Corner) — Click to Roam'}
          className={`p-1 rounded-full transition-colors ${
            wanderMode
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Footprints className="w-3.5 h-3.5" />
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

      {/* Mascot Body & Animated Glow */}
      <div
        className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center transition-transform"
        style={{
          transform: facingDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
          animation: isWaving
            ? 'novoBodyWave 0.5s ease-in-out infinite alternate'
            : isWalking
            ? 'novoWalkBob 0.35s ease-in-out infinite alternate'
            : 'novoIdleFloat 3.2s ease-in-out infinite alternate'
        }}
      >
        {/* Glowing Aura Ring */}
        <div
          className="absolute inset-1 rounded-full blur-xl opacity-50 group-hover:opacity-85 transition-opacity pointer-events-none animate-pulse"
          style={{ backgroundColor: currentLook.glowColor }}
        />

        {/* Soft ground shadow when hovering or floating */}
        <div className="absolute -bottom-1 w-14 h-3 bg-black/25 dark:bg-black/50 rounded-full blur-[3px] scale-x-90 transition-transform group-hover:scale-x-105 pointer-events-none" />

        {/* High-res Mascot Character PNG */}
        <div className="relative w-full h-full transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1">
          <Image
            src={currentLook.image}
            alt={currentLook.name}
            fill
            priority
            sizes="96px"
            className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] pointer-events-none select-none"
            unoptimized
          />

          {/* Real-time Facial Expressions (Blinking, Winking, Happy Eyes, Mouth Speaking) */}
          <MascotFaceOverlay
            imagePath={currentLook.image}
            expression={expression}
            isHovered={isHovered}
            isTalking={isTalking}
          />

          {/* Animated Waving Hand Gesture */}
          {isWaving && (
            <div
              className="absolute -top-3.5 -right-2 z-20 pointer-events-none animate-in fade-in zoom-in-75 duration-200"
              style={{
                transformOrigin: 'bottom center',
                animation: 'novoArmWave 0.25s ease-in-out infinite alternate'
              }}
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute -top-1 -right-1 flex gap-0.5 pointer-events-none opacity-85">
                  <span className="w-1.5 h-3 border-r-2 border-emerald-400 rounded-r-full animate-ping" />
                  <span className="w-2 h-4 border-r-2 border-amber-300 rounded-r-full" />
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-white dark:border-slate-800 shadow-lg flex items-center justify-center text-sm drop-shadow-md">
                  👋
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mascot Name Pill Badge beneath character */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-card/90 dark:bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 text-[9px] font-bold text-foreground shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            transform: facingDirection === 'left' ? 'translateX(50%) scaleX(-1)' : 'translateX(-50%)'
          }}
        >
          {currentLook.name}
        </div>
      </div>

      {/* Keyframe animations for Blinking, Waving, and Floating */}
      <style jsx global>{`
        @keyframes novoArmWave {
          0% {
            transform: rotate(-22deg) translateY(0);
          }
          100% {
            transform: rotate(26deg) translateY(-5px);
          }
        }
        @keyframes novoBodyWave {
          0% {
            transform: rotate(-6deg) translateY(-2px);
          }
          100% {
            transform: rotate(6deg) translateY(-6px);
          }
        }
        @keyframes novoIdleFloat {
          0% {
            transform: translateY(0px);
          }
          100% {
            transform: translateY(-8px);
          }
        }
        @keyframes novoWalkBob {
          0% {
            transform: translateY(0px) rotate(-3deg);
          }
          100% {
            transform: translateY(-10px) rotate(3deg);
          }
        }
      `}</style>
    </div>
  )
}
