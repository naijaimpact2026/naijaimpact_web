export type MascotCategory = 'core' | 'finance' | 'skills' | 'community' | 'learning'

export interface MascotLook {
  id: string
  name: string
  role: string
  tagline: string
  image: string
  category: MascotCategory
  matchedRoutes: string[]
  themeColor: string
  glowColor: string
  badgeText: string
  welcomeGreeting: string
  quickPrompts: string[]
  idleTips: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  mascotLookId?: string
  suggestions?: string[]
}

export interface MascotPosition {
  x: number
  y: number
  dockedSide: 'left' | 'right'
}

export interface MascotPreferences {
  soundEnabled: boolean
  speechEnabled: boolean
  wanderMode: boolean
  minimized: boolean
  customLookId: string | null // null = auto detect by screen
}
