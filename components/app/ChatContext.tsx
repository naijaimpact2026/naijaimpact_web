'use client'

import { createContext, useContext } from 'react'

interface ChatContextValue
{
    unreadCount: number
    setUnreadCount: (count: number) => void
}

export const ChatContext = createContext<ChatContextValue>({
    unreadCount: 0,
    setUnreadCount: () => { },
})

export function useChatContext()
{
    return useContext(ChatContext)
}
