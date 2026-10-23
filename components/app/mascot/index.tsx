'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@/lib/types'
import { getMascotForPathname, ALL_MASCOT_LOOKS } from '@/lib/mascot/config'
import FloatingMascot from './FloatingMascot'
import MascotChatBox from './MascotChatBox'
import MascotWardrobeModal from './MascotWardrobeModal'
import { playMascotChime } from '@/lib/mascot/audio'

interface NovoCompanionProps {
  user: User | null
}

export default function NovoCompanion({ user }: NovoCompanionProps) {
  const pathname = usePathname()

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [wanderMode, setWanderMode] = useState(true)
  const [customLookId, setCustomLookId] = useState<string | null>(null)
  const [dockedSide, setDockedSide] = useState<'left' | 'right'>('right')
  const [mounted, setMounted] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedSound = localStorage.getItem('novo_sound_enabled')
      if (savedSound !== null) {
        setSoundEnabled(savedSound === 'true')
      }

      const savedWander = localStorage.getItem('novo_wander_mode')
      if (savedWander !== null) {
        setWanderMode(savedWander === 'true')
      }

      const savedLook = localStorage.getItem('novo_custom_look_id')
      if (savedLook) {
        setCustomLookId(savedLook)
      }
    } catch {
      // Ignore
    }
    setMounted(true)
  }, [])

  // Auto-matched look for the current screen
  const autoMatchedLook = useMemo(() => {
    return getMascotForPathname(pathname, null)
  }, [pathname])

  // Current active look (considers custom user selection if present)
  const currentLook = useMemo(() => {
    return getMascotForPathname(pathname, customLookId)
  }, [pathname, customLookId])

  function handleToggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem('novo_sound_enabled', next.toString())
      } catch { }
      return next
    })
  }

  function handleToggleWander() {
    setWanderMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem('novo_wander_mode', next.toString())
      } catch { }
      return next
    })
  }

  function handleSelectCustomLook(lookId: string | null) {
    setCustomLookId(lookId)
    try {
      if (lookId) {
        localStorage.setItem('novo_custom_look_id', lookId)
      } else {
        localStorage.removeItem('novo_custom_look_id')
      }
    } catch { }
  }

  if (!mounted) return null

  const displayName = user?.fullname || user?.username || 'Community Builder'
  const displayRole = user?.role || 'Member'

  return (
    <>
      {/* Draggable, animated floating mascot */}
      <FloatingMascot
        currentLook={currentLook}
        onOpenChat={() => {
          setIsChatOpen(true)
          playMascotChime(!soundEnabled)
        }}
        onOpenWardrobe={() => setIsWardrobeOpen(true)}
        isChatOpen={isChatOpen}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        wanderMode={wanderMode}
        onToggleWander={handleToggleWander}
        screenPath={pathname}
        userName={displayName}
        onPositionChange={(pos) => setDockedSide(pos.dockedSide)}
      />

      {/* AI Chat Box */}
      <MascotChatBox
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onMinimize={() => setIsChatOpen(false)}
        currentLook={currentLook}
        onOpenWardrobe={() => setIsWardrobeOpen(true)}
        screenPath={pathname}
        userName={displayName}
        userRole={displayRole}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        dockedSide={dockedSide}
      />

      {/* Wardrobe Modal */}
      <MascotWardrobeModal
        isOpen={isWardrobeOpen}
        onClose={() => setIsWardrobeOpen(false)}
        currentLook={currentLook}
        autoMatchedLook={autoMatchedLook}
        selectedLookId={customLookId}
        onSelectLook={handleSelectCustomLook}
        onPlayChime={() => playMascotChime(!soundEnabled)}
      />
    </>
  )
}
