'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { X, Sparkles, Check, RotateCcw, Search, Compass, ShieldCheck } from 'lucide-react'
import { ALL_MASCOT_LOOKS } from '@/lib/mascot/config'
import { MascotLook, MascotCategory } from '@/lib/mascot/types'

interface MascotWardrobeModalProps {
  isOpen: boolean
  onClose: () => void
  currentLook: MascotLook
  autoMatchedLook: MascotLook
  selectedLookId: string | null // null = auto
  onSelectLook: (lookId: string | null) => void
  onPlayChime?: () => void
}

const CATEGORIES: { id: MascotCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Looks (24)' },
  { id: 'core', label: 'Portal & Hub' },
  { id: 'finance', label: 'Finance & Funding' },
  { id: 'skills', label: 'Skills & Artisans' },
  { id: 'community', label: 'Community & Trust' },
  { id: 'learning', label: 'Learning & Tech' }
]

export default function MascotWardrobeModal({
  isOpen,
  onClose,
  currentLook,
  autoMatchedLook,
  selectedLookId,
  onSelectLook,
  onPlayChime
}: MascotWardrobeModalProps) {
  const [activeTab, setActiveTab] = useState<MascotCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const isAutoMode = selectedLookId === null

  const filteredLooks = ALL_MASCOT_LOOKS.filter((look) => {
    const matchesCategory = activeTab === 'all' || look.category === activeTab
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      look.name.toLowerCase().includes(q) ||
      look.role.toLowerCase().includes(q) ||
      look.tagline.toLowerCase().includes(q) ||
      look.badgeText.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  function handleSelect(look: MascotLook) {
    onPlayChime?.()
    onSelectLook(look.id)
  }

  function handleResetToAuto() {
    onPlayChime?.()
    onSelectLook(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-card/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-500/25 dark:border-emerald-500/20 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-border/60 bg-gradient-to-r from-emerald-500/10 via-background to-teal-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-card dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Novo&apos;s Wardrobe
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  24 Looks
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Customize your AI companion or let Novo change outfits automatically per screen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAutoMode && (
              <button
                type="button"
                onClick={handleResetToAuto}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Auto-match Screen
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close wardrobe"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Status Banner */}
        <div className="px-6 py-2.5 bg-muted/40 border-b border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Active Look:</span>
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              {currentLook.name}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {currentLook.role}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAutoMode ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                Adaptive Mode (Changes per screen)
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResetToAuto}
                className="sm:hidden text-xs text-emerald-600 dark:text-emerald-400 underline font-medium"
              >
                Restore Auto-match
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Tabs */}
        <div className="p-4 sm:px-6 sm:py-3 border-b border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/50">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = activeTab === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative sm:w-60">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search looks..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/60 border border-border/80 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Grid of Mascot Looks */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredLooks.map((look) => {
            const isCurrentlySelected = currentLook.id === look.id
            const isScreenDefault = autoMatchedLook.id === look.id

            return (
              <div
                key={look.id}
                onClick={() => handleSelect(look)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleSelect(look)
                }}
                className={`relative group flex flex-col items-center p-3.5 rounded-2xl cursor-pointer border text-center transition-all duration-200 select-none ${
                  isCurrentlySelected
                    ? 'bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 border-emerald-500 shadow-[0_4px_20px_rgba(0,168,107,0.22)] ring-2 ring-emerald-500/40'
                    : 'bg-card hover:bg-muted/50 border-border/70 hover:border-emerald-500/50 hover:shadow-md'
                }`}
              >
                {/* Active checkmark badge */}
                {isCurrentlySelected && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}

                {/* Auto-match indicator */}
                {isScreenDefault && (
                  <span className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                    This Screen
                  </span>
                )}

                {/* Mascot Image with Glow Halo */}
                <div className="relative w-24 h-24 my-2 flex items-center justify-center">
                  <div
                    className="absolute inset-2 rounded-full blur-xl opacity-40 transition-opacity group-hover:opacity-75"
                    style={{ backgroundColor: look.themeColor }}
                  />
                  <div className="relative w-20 h-20 transition-transform duration-300 group-hover:scale-110">
                    <Image
                      src={look.image}
                      alt={look.name}
                      fill
                      className="object-contain drop-shadow-md"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Name & Role */}
                <h3 className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {look.name}
                </h3>
                <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {look.role}
                </span>

                {/* Tagline */}
                <p className="text-[10px] text-muted-foreground/80 line-clamp-2 mt-1 leading-tight">
                  {look.tagline}
                </p>

                {/* Action button */}
                <div className="mt-3 w-full">
                  <span
                    className={`block w-full py-1 rounded-xl text-[11px] font-semibold transition-all ${
                      isCurrentlySelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted group-hover:bg-emerald-500/15 text-muted-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
                    }`}
                  >
                    {isCurrentlySelected ? 'Selected' : 'Equip Look'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border/60 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Looks unlock special contextual greetings & prompt shortcuts!</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
