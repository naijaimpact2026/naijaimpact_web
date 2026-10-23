'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  X,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Shirt,
  Copy,
  Check,
  Minimize2,
  ExternalLink,
  Bot
} from 'lucide-react'
import { MascotLook, ChatMessage } from '@/lib/mascot/types'
import { playSendSound, playReceiveSound } from '@/lib/mascot/audio'

interface MascotChatBoxProps {
  isOpen: boolean
  onClose: () => void
  onMinimize: () => void
  currentLook: MascotLook
  onOpenWardrobe: () => void
  screenPath: string
  userName?: string
  userRole?: string
  soundEnabled: boolean
  onToggleSound: () => void
  dockedSide?: 'left' | 'right'
}

export default function MascotChatBox({
  isOpen,
  onClose,
  onMinimize,
  currentLook,
  onOpenWardrobe,
  screenPath,
  userName = 'Friend',
  userRole = 'Community Member',
  soundEnabled,
  onToggleSound,
  dockedSide = 'right'
}: MascotChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [speechActive, setSpeechActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize welcome message when opened or when look changes and messages are empty
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: `**${currentLook.name}** is online! ${currentLook.welcomeGreeting}`,
        timestamp: Date.now(),
        mascotLookId: currentLook.id,
        suggestions: currentLook.quickPrompts
      }
      setMessages([welcome])
    }
  }, [isOpen, currentLook, messages.length])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
    }
  }, [isOpen])

  if (!isOpen) return null

  async function handleSend(textToSend?: string) {
    const text = (textToSend || inputText).trim()
    if (!text || isLoading) return

    playSendSound(!soundEnabled)

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content
          })),
          screenPath,
          mascotId: currentLook.id,
          userName,
          userRole
        })
      })

      if (!res.ok) throw new Error('API request failed')
      const data = await res.json()

      const assistantMsg: ChatMessage = {
        id: 'novo-' + Date.now(),
        role: 'assistant',
        content: data.reply || 'I am right here to help you!',
        timestamp: Date.now(),
        mascotLookId: currentLook.id,
        suggestions: data.suggestions || []
      }

      setMessages((prev) => [...prev, assistantMsg])
      playReceiveSound(!soundEnabled)

      if (speechActive && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speakText(data.reply)
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: 'novo-err-' + Date.now(),
        role: 'assistant',
        content:
          'I ran into a temporary connection issue. Please feel free to ask again or select one of the suggested prompts!',
        timestamp: Date.now(),
        mascotLookId: currentLook.id,
        suggestions: currentLook.quickPrompts
      }
      setMessages((prev) => [...prev, fallbackMsg])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleCopy(id: string, text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  function speakText(raw: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const clean = raw.replace(/[#*_`>\[\]]/g, '')
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = 1.05
    utterance.pitch = 1.05
    window.speechSynthesis.speak(utterance)
  }

  function handleClearChat() {
    window.speechSynthesis?.cancel()
    setMessages([
      {
        id: 'welcome-reset-' + Date.now(),
        role: 'assistant',
        content: `Chat cleared! How else can **${currentLook.name}** assist you?`,
        timestamp: Date.now(),
        mascotLookId: currentLook.id,
        suggestions: currentLook.quickPrompts
      }
    ])
  }

  const isDockedLeft = dockedSide === 'left'

  return (
    <div
      className={`fixed z-50 bottom-20 ${
        isDockedLeft ? 'left-3 sm:left-6' : 'right-3 sm:right-6'
      } w-[calc(100vw-24px)] sm:w-[420px] max-w-[440px] h-[580px] max-h-[82vh] flex flex-col bg-card/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 dark:border-emerald-500/20 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.35)] overflow-hidden animate-in zoom-in-95 duration-200`}
    >
      {/* Header */}
      <div className="relative px-4 py-3 border-b border-border/60 bg-gradient-to-r from-emerald-500/15 via-background to-teal-500/15 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-sm">
            <div className="relative w-full h-full bg-card dark:bg-slate-900 rounded-[14px] overflow-hidden flex items-center justify-center">
              <Image
                src={currentLook.image}
                alt={currentLook.name}
                width={32}
                height={32}
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card dark:border-slate-900" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-foreground tracking-tight">
                {currentLook.name}
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                AI
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate max-w-[170px]">
              {currentLook.role}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Wardrobe */}
          <button
            type="button"
            onClick={onOpenWardrobe}
            title="Open Mascot Wardrobe (24 looks)"
            className="p-1.5 rounded-full text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
          >
            <Shirt className="w-4 h-4" />
          </button>

          {/* Sound toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Clear Chat */}
          <button
            type="button"
            onClick={handleClearChat}
            title="Reset conversation"
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Minimize */}
          <button
            type="button"
            onClick={onMinimize}
            title="Minimize"
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen Context Pill */}
      <div className="px-4 py-1.5 bg-muted/30 border-b border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Context: <strong className="text-foreground">{screenPath}</strong>
        </span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
          {currentLook.badgeText}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
            >
              <div
                className={`relative group max-w-[86%] rounded-2xl p-3 text-xs leading-relaxed transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-primary to-blue-600 text-white rounded-br-xs shadow-md'
                    : 'bg-muted/70 dark:bg-slate-800/80 border border-border/70 text-foreground rounded-bl-xs shadow-sm'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between mb-1 pb-1 border-b border-border/40 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {currentLook.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}

                {/* Formatted Content */}
                <div className="whitespace-pre-wrap space-y-1 font-sans">
                  {renderFormattedText(msg.content)}
                </div>
              </div>

              {/* Suggestions / Prompt chips */}
              {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5 max-w-[95%]">
                  {msg.suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(s)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 transition-all text-left active:scale-95 disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Live typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-muted/60 border border-border/60 max-w-[140px] text-xs text-muted-foreground animate-pulse">
            <Bot className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            <span className="text-[11px] font-medium">Novo is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-3 border-t border-border/60 bg-card/60 backdrop-blur-md">
        <div className="relative flex items-center bg-muted/80 rounded-2xl border border-border/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${currentLook.name} anything...`}
            className="flex-1 max-h-24 py-2.5 pl-3.5 pr-10 text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="absolute right-1.5 w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5 -ml-0.5" />
          </button>
        </div>

        <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-muted-foreground/75">
          <span>Press Enter to send • Shift+Enter for new line</span>
          <span className="font-medium text-emerald-600/80 dark:text-emerald-400/80">
            HubNovo Companion
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Lightweight safe markdown formatter (handles bold, code blocks, lists, links, headings).
 */
function renderFormattedText(text: string) {
  const lines = text.split('\n')

  return lines.map((line, lIdx) => {
    // Heading 3
    if (line.startsWith('### ')) {
      return (
        <h4 key={lIdx} className="font-bold text-xs text-foreground mt-1 mb-0.5">
          {line.replace('### ', '')}
        </h4>
      )
    }

    // Blockquote
    if (line.startsWith('> ')) {
      return (
        <div
          key={lIdx}
          className="border-l-2 border-emerald-500 pl-2 my-1 text-muted-foreground italic text-[11px]"
        >
          {line.replace('> ', '')}
        </div>
      )
    }

    // Bullet list item
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const content = line.trim().replace(/^[-*]\s+/, '')
      return (
        <div key={lIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
          <span className="text-emerald-500 font-bold shrink-0">•</span>
          <span>{renderInlineStyles(content)}</span>
        </div>
      )
    }

    // Numbered list item
    if (/^\d+\.\s/.test(line.trim())) {
      const match = line.trim().match(/^(\d+\.)\s+(.*)/)
      if (match) {
        return (
          <div key={lIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-[11px]">
              {match[1]}
            </span>
            <span>{renderInlineStyles(match[2])}</span>
          </div>
        )
      }
    }

    // Regular line
    return (
      <p key={lIdx} className={line.trim() === '' ? 'h-1.5' : 'my-0.5'}>
        {renderInlineStyles(line)}
      </p>
    )
  })
}

function renderInlineStyles(str: string): React.ReactNode {
  // Check for internal links [Text](/path)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(formatBoldAndCode(str.substring(lastIndex, match.index)))
    }
    const label = match[1]
    const href = match[2]
    parts.push(
      <Link
        key={match.index}
        href={href}
        className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold underline hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
      >
        {label}
        <ExternalLink className="w-2.5 h-2.5 inline" />
      </Link>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < str.length) {
    parts.push(formatBoldAndCode(str.substring(lastIndex)))
  }

  return parts
}

function formatBoldAndCode(text: string): React.ReactNode {
  // Format bold **text**
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g)
  return boldParts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2)
      return (
        <strong key={pIdx} className="font-semibold text-foreground">
          {inner}
        </strong>
      )
    }

    // Format code `code`
    const codeParts = part.split(/(`[^`]+`)/g)
    return codeParts.map((sub, cIdx) => {
      if (sub.startsWith('`') && sub.endsWith('`')) {
        return (
          <code
            key={`${pIdx}-${cIdx}`}
            className="px-1 py-0.5 rounded bg-muted text-emerald-600 dark:text-emerald-400 font-mono text-[10px]"
          >
            {sub.slice(1, -1)}
          </code>
        )
      }
      return sub
    })
  })
}
