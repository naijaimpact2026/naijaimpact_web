'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import TopBar from './TopBar'
import { UnreadCountProvider, useUnreadCount } from './UnreadCountContext'
import NotificationListener from './NotificationListener'

interface AppShellInnerProps
{
    children: React.ReactNode
    user: User | null
}

function AppShellInner({ children, user }: AppShellInnerProps)
{
    const router = useRouter()
    const { messageCount, notificationCount } = useUnreadCount()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleSignOut = async () =>
    {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <div className="flex min-h-screen bg-[#f0f4f2] text-foreground app-bg">
            {/* Fixed top header */}
            <TopBar
                user={user}
                notificationCount={notificationCount}
                onMenuToggle={() => setSidebarOpen((v) => !v)}
            />

            {/* Sidebar drawer — controlled by inline transform so Tailwind purging can't break it */}
            <Sidebar
                user={user}
                onSignOut={handleSignOut}
                messageCount={messageCount}
                notificationCount={notificationCount}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Backdrop for sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Main content — full width, no left margin offset */}
            <main className="flex-1 min-h-screen pt-14 pb-16 lg:pb-4 overflow-x-hidden">
                {children}
            </main>

            {/* Mobile bottom nav */}
            <BottomNav messageCount={messageCount} notificationCount={notificationCount} />
        </div>
    )
}

interface AppShellProps
{
    children: React.ReactNode
    user: User | null
    initialNotificationCount?: number
}

export default function AppShell({ children, user, initialNotificationCount = 0 }: AppShellProps)
{
    return (
        <UnreadCountProvider initialNotificationCount={initialNotificationCount}>
            {user && (
                <NotificationListener userId={user.id} initialUnreadCount={initialNotificationCount} />
            )}
            <AppShellInner user={user}>{children}</AppShellInner>
        </UnreadCountProvider>
    )
}
