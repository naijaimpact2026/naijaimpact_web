'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { getFaceCoordsForImage } from '@/lib/mascot/face-coordinates'

export type MascotExpression = 'idle' | 'blink' | 'wink' | 'happy' | 'talking' | 'surprised'

interface MascotFaceOverlayProps {
  imagePath: string
  expression: MascotExpression
  isHovered: boolean
  isTalking: boolean
}

export default function MascotFaceOverlay({
  imagePath,
  expression,
  isHovered,
  isTalking
}: MascotFaceOverlayProps) {
  const coords = getFaceCoordsForImage(imagePath)

  const isBlinking = expression === 'blink'
  const isWinking = expression === 'wink'
  const isHappy = expression === 'happy' || isHovered
  const isSpeaking = isTalking || expression === 'talking'

  // Cheeks horizontal offset (just outside each eye)
  const leftCheekX = Math.max(12, coords.leftEye.x - 14)
  const rightCheekX = Math.min(88, coords.rightEye.x + 14)
  const cheekY = (coords.leftEye.y + coords.mouth.y) / 2

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">
      {/* ── LEFT EYE OVERLAY ── */}
      <div
        className="absolute flex items-center justify-center transition-all"
        style={{
          left: `${coords.leftEye.x}%`,
          top: `${coords.leftEye.y}%`,
          width: `${coords.leftEye.w}%`,
          height: `${coords.leftEye.h}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Blinking Eyelid */}
        {isBlinking && (
          <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-50 duration-75">
            {/* Eyelid skin */}
            <div className="w-[104%] h-[104%] rounded-full bg-gradient-to-b from-[#E2F7EF] via-[#EDFBF5] to-[#D5F2E6] border-b-2 border-emerald-700/60 shadow-inner flex items-center justify-center">
              {/* Eyelash crease line */}
              <div className="w-4/5 h-0.5 bg-emerald-800/80 rounded-full" />
            </div>
          </div>
        )}

        {/* Happy Smiling Crescent Eye ( ◠ ) */}
        {isHappy && !isBlinking && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Skin base covering open eye */}
            <div className="w-[106%] h-[106%] rounded-full bg-gradient-to-b from-[#E2F7EF] via-[#EDFBF5] to-[#D5F2E6] flex items-center justify-center shadow-inner">
              {/* Curved smiling eye arc */}
              <div className="w-3/4 h-2.5 rounded-t-full border-t-[3px] border-emerald-900/90 shadow-sm" />
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT EYE OVERLAY ── */}
      <div
        className="absolute flex items-center justify-center transition-all"
        style={{
          left: `${coords.rightEye.x}%`,
          top: `${coords.rightEye.y}%`,
          width: `${coords.rightEye.w}%`,
          height: `${coords.rightEye.h}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Blinking Eyelid (closes on blink) */}
        {isBlinking && (
          <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-50 duration-75">
            <div className="w-[104%] h-[104%] rounded-full bg-gradient-to-b from-[#E2F7EF] via-[#EDFBF5] to-[#D5F2E6] border-b-2 border-emerald-700/60 shadow-inner flex items-center justify-center">
              <div className="w-4/5 h-0.5 bg-emerald-800/80 rounded-full" />
            </div>
          </div>
        )}

        {/* Winking Eyelid (right eye closes while left eye is open) */}
        {isWinking && !isBlinking && (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-[106%] h-[106%] rounded-full bg-gradient-to-b from-[#E2F7EF] via-[#EDFBF5] to-[#D5F2E6] border-b-2 border-emerald-700/60 shadow-inner flex items-center justify-center">
              <div className="w-3/4 h-1 rounded-t-full border-t-[3px] border-emerald-900/90" />
            </div>
            {/* Wink sparkle star */}
            <div className="absolute -top-2 -right-2 animate-spin text-amber-400">
              <Sparkles className="w-5 h-5 fill-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
            </div>
          </div>
        )}

        {/* Happy Smiling Crescent Eye ( ◠ ) */}
        {isHappy && !isBlinking && !isWinking && (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-[106%] h-[106%] rounded-full bg-gradient-to-b from-[#E2F7EF] via-[#EDFBF5] to-[#D5F2E6] flex items-center justify-center shadow-inner">
              <div className="w-3/4 h-2.5 rounded-t-full border-t-[3px] border-emerald-900/90 shadow-sm" />
            </div>
          </div>
        )}
      </div>

      {/* ── TALKING MOUTH ANIMATION ── */}
      {isSpeaking && (
        <div
          className="absolute flex items-center justify-center transition-all"
          style={{
            left: `${coords.mouth.x}%`,
            top: `${coords.mouth.y}%`,
            width: `${coords.mouth.w}%`,
            height: `${coords.mouth.h}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Animated chatting mouth */}
          <div className="w-full h-full flex items-center justify-center animate-pulse">
            <div className="w-full h-3/4 rounded-full bg-[#1A3A3A] border border-emerald-950 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Cute coral tongue */}
              <div className="w-3/5 h-1/2 bg-rose-400 rounded-t-full mt-1" />
            </div>
          </div>
        </div>
      )}

      {/* ── ROSY CHEEK BLUSH (Shows when Happy or Hovered) ── */}
      {isHappy && (
        <>
          {/* Left Cheek */}
          <div
            className="absolute rounded-full pointer-events-none animate-in fade-in zoom-in-75 duration-200"
            style={{
              left: `${leftCheekX}%`,
              top: `${cheekY}%`,
              width: '14%',
              height: '8%',
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(ellipse at center, rgba(255, 110, 145, 0.65) 0%, rgba(255, 140, 170, 0.25) 55%, transparent 75%)',
              filter: 'blur(1.5px)'
            }}
          />

          {/* Right Cheek */}
          <div
            className="absolute rounded-full pointer-events-none animate-in fade-in zoom-in-75 duration-200"
            style={{
              left: `${rightCheekX}%`,
              top: `${cheekY}%`,
              width: '14%',
              height: '8%',
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(ellipse at center, rgba(255, 110, 145, 0.65) 0%, rgba(255, 140, 170, 0.25) 55%, transparent 75%)',
              filter: 'blur(1.5px)'
            }}
          />
        </>
      )}
    </div>
  )
}
