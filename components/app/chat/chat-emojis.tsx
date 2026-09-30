'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  X,
  Sparkles,
  Smile,
  Hand,
  Heart,
  PartyPopper,
  Lightbulb,
  Plus,
  ArrowLeft,
} from 'lucide-react'
import {
  useMessageContext,
  useDialogOnNearestManager,
  ReactionSelector,
  type ReactionSelectorProps,
} from 'stream-chat-react'

export interface EmojiDefinition {
  type: string
  name: string
  emoji: string
  category: 'smileys' | 'gestures' | 'hearts' | 'party' | 'objects'
}

// ─── 1. Quick Reactions (12 Top Favorites) ──────────────────────────────────
export const QUICK_EMOJIS: EmojiDefinition[] = [
  { type: 'haha', name: 'Joy', emoji: '😂', category: 'smileys' },
  { type: 'like', name: 'Thumbs up', emoji: '👍', category: 'gestures' },
  { type: 'love', name: 'Heart', emoji: '❤️', category: 'hearts' },
  { type: 'fire', name: 'Fire', emoji: '🔥', category: 'party' },
  { type: 'clap', name: 'Clap', emoji: '👏', category: 'gestures' },
  { type: 'party', name: 'Party Popper', emoji: '🎉', category: 'party' },
  { type: 'wow', name: 'Astonished', emoji: '😮', category: 'smileys' },
  { type: 'sad', name: 'Sad', emoji: '😔', category: 'smileys' },
  { type: 'pray', name: 'Pray', emoji: '🙏', category: 'gestures' },
  { type: 'hundred', name: '100', emoji: '💯', category: 'party' },
  { type: 'heart_eyes', name: 'Heart eyes', emoji: '😍', category: 'smileys' },
  { type: 'rocket', name: 'Rocket', emoji: '🚀', category: 'party' },
]

// ─── 2. Extended Reactions (Categorized & Plentiful - 85+ emojis) ────────────
export const EXTENDED_EMOJIS: EmojiDefinition[] = [
  // Smileys & Emotions
  { type: 'rofl', name: 'Rolling on floor laughing', emoji: '🤣', category: 'smileys' },
  { type: 'smile', name: 'Smiling face', emoji: '😊', category: 'smileys' },
  { type: 'blush', name: 'Smiling with hearts', emoji: '🥰', category: 'smileys' },
  { type: 'star_struck', name: 'Star-struck', emoji: '🤩', category: 'smileys' },
  { type: 'kiss', name: 'Blowing kiss', emoji: '😘', category: 'smileys' },
  { type: 'wink', name: 'Wink', emoji: '😉', category: 'smileys' },
  { type: 'halo', name: 'Angel', emoji: '😇', category: 'smileys' },
  { type: 'sunglasses', name: 'Cool / Sunglasses', emoji: '😎', category: 'smileys' },
  { type: 'partying_face', name: 'Partying face', emoji: '🥳', category: 'smileys' },
  { type: 'nerd', name: 'Nerd', emoji: '🤓', category: 'smileys' },
  { type: 'thinking', name: 'Thinking', emoji: '🤔', category: 'smileys' },
  { type: 'shushing', name: 'Shushing face', emoji: '🤫', category: 'smileys' },
  { type: 'mind_blown', name: 'Mind blown', emoji: '🤯', category: 'smileys' },
  { type: 'pleading', name: 'Pleading face', emoji: '🥺', category: 'smileys' },
  { type: 'sob', name: 'Loudly crying', emoji: '😭', category: 'smileys' },
  { type: 'screaming', name: 'Screaming in fear', emoji: '😱', category: 'smileys' },
  { type: 'hot', name: 'Hot face', emoji: '🥵', category: 'smileys' },
  { type: 'cold', name: 'Cold face', emoji: '🥶', category: 'smileys' },
  { type: 'sleepy', name: 'Sleeping', emoji: '😴', category: 'smileys' },
  { type: 'vomit', name: 'Vomiting', emoji: '🤮', category: 'smileys' },
  { type: 'sneezing', name: 'Sneezing', emoji: '🤧', category: 'smileys' },
  { type: 'clown', name: 'Clown', emoji: '🤡', category: 'smileys' },
  { type: 'ghost', name: 'Ghost', emoji: '👻', category: 'smileys' },
  { type: 'skull', name: 'Skull', emoji: '💀', category: 'smileys' },
  { type: 'alien', name: 'Alien', emoji: '👽', category: 'smileys' },
  { type: 'salute', name: 'Saluting face', emoji: '🫡', category: 'smileys' },
  { type: 'melting', name: 'Melting face', emoji: '🫠', category: 'smileys' },
  { type: 'monocle', name: 'Monocle', emoji: '🧐', category: 'smileys' },
  { type: 'zipper', name: 'Zipper-mouth', emoji: '🤐', category: 'smileys' },
  { type: 'grimace', name: 'Grimacing', emoji: '😬', category: 'smileys' },
  { type: 'relieved', name: 'Relieved', emoji: '😌', category: 'smileys' },

  // Gestures & Hands
  { type: 'thumbs_down', name: 'Thumbs down', emoji: '👎', category: 'gestures' },
  { type: 'handshake', name: 'Handshake', emoji: '🤝', category: 'gestures' },
  { type: 'raised_hands', name: 'Raising hands', emoji: '🙌', category: 'gestures' },
  { type: 'open_hands', name: 'Open hands', emoji: '👐', category: 'gestures' },
  { type: 'fist', name: 'Fist bump', emoji: '👊', category: 'gestures' },
  { type: 'peace', name: 'Peace sign', emoji: '✌️', category: 'gestures' },
  { type: 'fingers_crossed', name: 'Fingers crossed', emoji: '🤞', category: 'gestures' },
  { type: 'wave', name: 'Waving hand', emoji: '👋', category: 'gestures' },
  { type: 'ok_hand', name: 'OK hand', emoji: '👌', category: 'gestures' },
  { type: 'pinched_fingers', name: 'Pinched fingers', emoji: '🤌', category: 'gestures' },
  { type: 'pointing_up', name: 'Point up', emoji: '☝️', category: 'gestures' },
  { type: 'muscle', name: 'Flexed bicep', emoji: '💪', category: 'gestures' },
  { type: 'call_me', name: 'Call me', emoji: '🤙', category: 'gestures' },
  { type: 'rock_on', name: 'Rock on', emoji: '🤘', category: 'gestures' },
  { type: 'writing', name: 'Writing', emoji: '✍️', category: 'gestures' },
  { type: 'eyes', name: 'Eyes', emoji: '👀', category: 'gestures' },

  // Hearts & Affection
  { type: 'sparkling_heart', name: 'Sparkling heart', emoji: '💖', category: 'hearts' },
  { type: 'broken_heart', name: 'Broken heart', emoji: '💔', category: 'hearts' },
  { type: 'growing_heart', name: 'Growing heart', emoji: '💗', category: 'hearts' },
  { type: 'two_hearts', name: 'Two hearts', emoji: '💕', category: 'hearts' },
  { type: 'heart_arrow', name: 'Heart with arrow', emoji: '💘', category: 'hearts' },
  { type: 'blue_heart', name: 'Blue heart', emoji: '💙', category: 'hearts' },
  { type: 'green_heart', name: 'Green heart', emoji: '💚', category: 'hearts' },
  { type: 'yellow_heart', name: 'Yellow heart', emoji: '💛', category: 'hearts' },
  { type: 'purple_heart', name: 'Purple heart', emoji: '💜', category: 'hearts' },
  { type: 'white_heart', name: 'White heart', emoji: '🤍', category: 'hearts' },
  { type: 'black_heart', name: 'Black heart', emoji: '🖤', category: 'hearts' },
  { type: 'kiss_mark', name: 'Kiss mark', emoji: '💋', category: 'hearts' },

  // Energy & Celebration
  { type: 'sparkles', name: 'Sparkles', emoji: '✨', category: 'party' },
  { type: 'star', name: 'Star', emoji: '⭐', category: 'party' },
  { type: 'glowing_star', name: 'Glowing star', emoji: '🌟', category: 'party' },
  { type: 'dizzy', name: 'Dizzy / Spark', emoji: '💫', category: 'party' },
  { type: 'boom', name: 'Boom / Collision', emoji: '💥', category: 'party' },
  { type: 'zap', name: 'Lightning zap', emoji: '⚡', category: 'party' },
  { type: 'trophy', name: 'Trophy', emoji: '🏆', category: 'party' },
  { type: 'medal', name: '1st place medal', emoji: '🥇', category: 'party' },
  { type: 'target', name: 'Target bullseye', emoji: '🎯', category: 'party' },
  { type: 'gem', name: 'Gem stone', emoji: '💎', category: 'party' },
  { type: 'crown', name: 'Crown', emoji: '👑', category: 'party' },
  { type: 'moneybag', name: 'Money bag', emoji: '💰', category: 'party' },
  { type: 'balloons', name: 'Balloons', emoji: '🎈', category: 'party' },
  { type: 'gift', name: 'Gift box', emoji: '🎁', category: 'party' },
  { type: 'cheers', name: 'Clinking glasses', emoji: '🥂', category: 'party' },
  { type: 'beer', name: 'Beer mugs', emoji: '🍻', category: 'party' },
  { type: 'popcorn', name: 'Popcorn', emoji: '🍿', category: 'party' },

  // Objects & Symbols
  { type: 'coffee', name: 'Hot coffee', emoji: '☕', category: 'objects' },
  { type: 'check_mark', name: 'Check mark', emoji: '✅', category: 'objects' },
  { type: 'warning', name: 'Warning', emoji: '⚠️', category: 'objects' },
  { type: 'bulb', name: 'Light bulb', emoji: '💡', category: 'objects' },
  { type: 'pin_symbol', name: 'Pushpin', emoji: '📌', category: 'objects' },
  { type: 'bell_symbol', name: 'Bell', emoji: '🔔', category: 'objects' },
  { type: 'lock', name: 'Locked', emoji: '🔒', category: 'objects' },
  { type: 'key', name: 'Key', emoji: '🔑', category: 'objects' },
  { type: 'speech', name: 'Speech bubble', emoji: '💬', category: 'objects' },
  { type: 'megaphone', name: 'Megaphone', emoji: '📢', category: 'objects' },
  { type: 'eyes_glass', name: 'Magnifying glass', emoji: '🔍', category: 'objects' },
]

function makeEmojiComponent(emoji: string) {
  const Component = () => (
    <span className="text-base select-none leading-none inline-block">{emoji}</span>
  )
  Component.displayName = `Emoji_${emoji}`
  return Component
}

// Build maps for Stream Chat reactionOptions
const QUICK_MAP: Record<string, { Component: React.ComponentType; name: string; unicode?: string }> = {}
for (const item of QUICK_EMOJIS) {
  QUICK_MAP[item.type] = {
    Component: makeEmojiComponent(item.emoji),
    name: item.name,
  }
}

const EXTENDED_MAP: Record<string, { Component: React.ComponentType; name: string; unicode?: string }> = {}
for (const item of EXTENDED_EMOJIS) {
  EXTENDED_MAP[item.type] = {
    Component: makeEmojiComponent(item.emoji),
    name: item.name,
  }
}

export const customReactionOptions = {
  quick: QUICK_MAP,
  extended: EXTENDED_MAP,
}

const CATEGORIES: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'smileys', label: 'Smileys', icon: Smile },
  { id: 'gestures', label: 'Hands', icon: Hand },
  { id: 'hearts', label: 'Hearts', icon: Heart },
  { id: 'party', label: 'Hype', icon: PartyPopper },
  { id: 'objects', label: 'Symbols', icon: Lightbulb },
]

// ─── 3. Complete Custom Reaction Selector ────────────────────────────────────
// Handles both quick reaction pill and clean rectangular extended picker modal

export function CustomReactionSelector(props: ReactionSelectorProps) {
  const { dialogId: propDialogId, handleReaction: propHandleReaction, own_reactions: propOwnReactions } = props
  const [isExtended, setIsExtended] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [hoveredName, setHoveredName] = useState<string | null>(null)

  const { closeReactionSelectorOnClick, handleReaction: contextHandleReaction, message, threadList } =
    useMessageContext('ReactionSelector')

  const dialogId =
    propDialogId ??
    ReactionSelector.getDialogId({
      messageId: message.id,
      threadList,
    })

  const { dialog } = useDialogOnNearestManager({ id: dialogId })
  const handleReaction = propHandleReaction ?? contextHandleReaction
  const ownReactions = propOwnReactions ?? message?.own_reactions ?? []

  const ownReactionTypes = useMemo(() => {
    return new Set(ownReactions.map((r: any) => r.type))
  }, [ownReactions])

  const allEmojis = useMemo(() => {
    const seen = new Set<string>()
    const list: EmojiDefinition[] = []
    for (const e of [...QUICK_EMOJIS, ...EXTENDED_EMOJIS]) {
      if (!seen.has(e.type)) {
        seen.add(e.type)
        list.push(e)
      }
    }
    return list
  }, [])

  const filteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allEmojis.filter((e) => {
      const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory
      const matchesQuery = !q || e.name.toLowerCase().includes(q) || e.emoji.includes(q)
      return matchesCategory && matchesQuery
    })
  }, [allEmojis, searchQuery, selectedCategory])

  // ── State A: Compact Quick Reactions Pill ──
  if (!isExtended) {
    return (
      <div
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-card/98 backdrop-blur-md border border-border shadow-xl select-none animate-in fade-in-50 zoom-in-95 duration-100 z-50"
        role="group"
        aria-label="Reactions"
      >
        <ul className="flex items-center gap-1 list-none m-0 p-0">
          {QUICK_EMOJIS.map((item) => {
            const isSelected = ownReactionTypes.has(item.type)
            return (
              <li key={item.type}>
                <button
                  type="button"
                  title={item.name}
                  aria-label={item.name}
                  aria-pressed={isSelected}
                  onClick={(e) => {
                    handleReaction(item.type, e)
                    if (closeReactionSelectorOnClick) dialog?.close()
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-lg sm:text-xl transition-transform duration-100 hover:scale-125 hover:bg-muted active:scale-95 cursor-pointer ${
                    isSelected ? 'bg-primary/20 ring-1.5 ring-primary/60 scale-105' : ''
                  }`}
                >
                  <span className="leading-none">{item.emoji}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* Plus button to open extended 85+ emojis */}
        <button
          type="button"
          title="More reactions"
          aria-label="More reactions"
          onClick={() => setIsExtended(true)}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-muted/60 hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all ml-0.5 cursor-pointer hover:scale-110 active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // ── State B: Clean Rectangular Extended Emoji Card ──
  return (
    <div
      className="w-[330px] sm:w-[360px] max-h-[380px] bg-card border border-border text-foreground rounded-2xl shadow-2xl p-3 flex flex-col gap-2 select-none animate-in fade-in-50 zoom-in-95 duration-150 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Back, Search, and Close */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setIsExtended(false)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Back to quick reactions"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 85+ emojis..."
            className="w-full pl-8 pr-7 py-1 text-xs bg-muted/70 hover:bg-muted border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1.5 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => dialog?.close()}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Close reactions"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 grid grid-cols-7 sm:grid-cols-8 gap-1 scrollbar-thin scrollbar-thumb-muted-foreground/20">
        {filteredEmojis.map((e) => {
          const isSelected = ownReactionTypes.has(e.type)
          return (
            <button
              key={e.type}
              type="button"
              data-text={e.type}
              aria-label={e.name}
              title={e.name}
              onMouseEnter={() => setHoveredName(e.name)}
              onMouseLeave={() => setHoveredName(null)}
              onClick={(event) => {
                handleReaction(e.type, event)
                if (closeReactionSelectorOnClick) dialog?.close()
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-xl hover:scale-125 hover:bg-muted/80 active:scale-95 transition-transform duration-100 cursor-pointer ${
                isSelected ? 'bg-primary/20 ring-1.5 ring-primary/60 scale-105' : ''
              }`}
            >
              <span className="leading-none">{e.emoji}</span>
            </button>
          )
        })}

        {filteredEmojis.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            No emojis match &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>

      {/* Footer Info / Hovered Name */}
      <div className="pt-1.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground shrink-0 px-1">
        <span className="truncate max-w-[220px] font-medium text-foreground">
          {hoveredName || (filteredEmojis.length > 0 ? `${filteredEmojis.length} emojis` : 'Pick an emoji')}
        </span>
        <span className="text-[10px] text-muted-foreground/70">Click to react</span>
      </div>
    </div>
  )
}

CustomReactionSelector.displayName = 'ReactionSelector'
CustomReactionSelector.getDialogId = ReactionSelector.getDialogId
