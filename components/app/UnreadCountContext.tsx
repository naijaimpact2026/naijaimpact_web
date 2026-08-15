'use client'

import React, { createContext, useContext, useState } from 'react'

interface UnreadCountContextValue
{
    messageCount: number
    setMessageCount: React.Dispatch<React.SetStateAction<number>>
    notificationCount: number
    setNotificationCount: React.Dispatch<React.SetStateAction<number>>
}

const UnreadCountContext = createContext<UnreadCountContextValue>({
    messageCount: 0,
    setMessageCount: () => { },
    notificationCount: 0,
    setNotificationCount: () => { },
})

interface UnreadCountProviderProps
{
    children: React.ReactNode
    initialNotificationCount?: number
}

export function UnreadCountProvider({
    children,
    initialNotificationCount = 0,
}: UnreadCountProviderProps)
{
    const [messageCount, setMessageCount] = useState(0)
    const [notificationCount, setNotificationCount] = useState(initialNotificationCount)

    return (
        <UnreadCountContext.Provider
            value={{ messageCount, setMessageCount, notificationCount, setNotificationCount }}
        >
            {children}
        </UnreadCountContext.Provider>
    )
}

export function useUnreadCount()
{
    return useContext(UnreadCountContext)
}
