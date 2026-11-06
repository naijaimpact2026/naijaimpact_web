'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'

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

    // Memoized so a change to one count doesn't force every consumer of the
    // OTHER count to re-render too (they'd otherwise see a new object
    // identity on every render of either field).
    const value = useMemo(
        () => ({ messageCount, setMessageCount, notificationCount, setNotificationCount }),
        [messageCount, setMessageCount, notificationCount, setNotificationCount],
    )

    return (
        <UnreadCountContext.Provider value={value}>
            {children}
        </UnreadCountContext.Provider>
    )
}

export function useUnreadCount()
{
    return useContext(UnreadCountContext)
}
