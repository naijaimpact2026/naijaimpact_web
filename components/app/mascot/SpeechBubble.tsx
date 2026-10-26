'use client'

import React from 'react'
import { X, Sparkles } from 'lucide-react'

interface SpeechBubbleProps {
  message: string
  onClose?: () => void
  onClick?: () => void
  side?: 'left' | 'right' | 'center'
  isNearTop?: boolean
}

export default function SpeechBubble({
  message,
  onClose,
  onClick,
  side = 'right',
  isNearTop = false
}: SpeechBubbleProps) {
  if (!message) return null

  // Horizontal alignment:
  // If mascot is on the right of the screen (side === 'right'),
  // the bubble MUST align to the right ('right-0') and expand to the LEFT into the open screen.
  // If mascot is on the left of the screen (side === 'left'),
  // the bubble MUST align to the left ('left-0') and expand to the RIGHT into the open screen.
  const horizontalClass =
    side === 'right'
      ? 'right-0'
      : side === 'left'
      ? 'left-0'
      : 'left-1/2 -translate-x-1/2'

  // Vertical alignment:
  // If mascot is near the top edge of the screen, place the bubble BELOW it.
  // Otherwise, place it ABOVE the mascot.
  const verticalClass = isNearTop ? 'top-full mt-3' : 'bottom-full mb-3'

  // Tail positioning pointing towards the mascot:
  // If side is 'right', the mascot is under the right side of the bubble -> tail at right-6.
  // If side is 'left', the mascot is under the left side of the bubble -> tail at left-6.
  // If isNearTop is true, tail points UP (-top-2 border-b-card).
  // If isNearTop is false, tail points DOWN (-bottom-2 border-t-card).
  const tailSideClass =
    side === 'right' ? 'right-7' : side === 'left' ? 'left-7' : 'left-1/2 -translate-x-1/2'

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.()
        }
      }}
      className={`absolute z-30 ${verticalClass} ${horizontalClass} cursor-pointer select-none transition-all duration-300 animate-in fade-in zoom-in-90 ${
        isNearTop ? 'slide-in-from-top-2' : 'slide-in-from-bottom-2'
      }`}
      style={{
        maxWidth: 'min(280px, calc(100vw - 32px))',
        minWidth: '190px',
        width: 'max-content'
      }}
      aria-label="Mascot suggestion"
    >
      <div className="relative group px-3.5 py-2.5 rounded-2xl bg-card dark:bg-slate-900 border border-emerald-500/35 dark:border-emerald-400/30 shadow-[0_8px_28px_rgba(0,168,107,0.22)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.6)] text-foreground text-xs leading-relaxed font-medium hover:border-emerald-500 hover:shadow-[0_8px_32px_rgba(0,168,107,0.32)] transition-all">
        {/* Tail pointing toward mascot */}
        {isNearTop ? (
          // Tail pointing UP toward mascot above
          <div
            className={`absolute -top-2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-card dark:border-b-slate-900 ${tailSideClass}`}
          />
        ) : (
          // Tail pointing DOWN toward mascot below
          <div
            className={`absolute -bottom-2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-card dark:border-t-slate-900 ${tailSideClass}`}
          />
        )}

        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="flex-1 text-[12px] line-clamp-3 text-slate-800 dark:text-slate-100 font-medium">
            {message}
          </p>
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              // ~32px touch target: a finger that just misses a 20px X would
              // land on the bubble, which opens the chat.
              className="flex items-center justify-center w-8 h-8 -mr-2.5 -mt-2 shrink-0 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 transition-colors touch-manipulation"
              aria-label="Dismiss tip"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="mt-1.5 pt-1 border-t border-border/50 flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
          <span>Tap to ask Novo</span>
          <span className="opacity-75 group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      </div>
    </div>
  )
}
