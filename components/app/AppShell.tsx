'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import TopBar from './TopBar'
import { UnreadCountProvider, useUnreadCount } from './UnreadCountContext'
import NotificationListener from './NotificationListener'
import ChatProvider from './ChatProvider'
import { disconnectChatUser } from '@/lib/stream'
import SignOutPromptModal, { type SignOutFeedback } from './SignOutPromptModal'
import { recordSignOutFeedback } from '@/lib/actions/auth'

interface AppShellInnerProps
{
    children: React.ReactNode
    user: User | null
}

function AppShellInner({ children, user }: AppShellInnerProps)
{
    const router = useRouter()
    const pathname = usePathname()
    const { messageCount, notificationCount } = useUnreadCount()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [signOutModalOpen, setSignOutModalOpen] = useState(false)
    const [isSigningOut, setIsSigningOut] = useState(false)

    const isChatConversation = pathname.startsWith('/app/chat/')

    const handleConfirmSignOut = async (feedback?: SignOutFeedback) =>
    {
        setIsSigningOut(true)
        try
        {
            if (feedback?.rating || feedback?.note)
            {
                recordSignOutFeedback(feedback).catch(() => {})
            }
            await disconnectChatUser()
            const supabase = createClient()
            await supabase.auth.signOut()
            router.push('/')
            router.refresh()
        }
        catch (err)
        {
            console.error('Sign out error:', err)
        }
        finally
        {
            setIsSigningOut(false)
            setSignOutModalOpen(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <TopBar
                user={user}
                notificationCount={notificationCount}
                messageCount={messageCount}
                onMenuToggle={() => setSidebarOpen((v) => !v)}
            />

            {/* Sidebar — persistent rail on lg+ (sits below the top bar), overlay drawer below lg */}
            <Sidebar
                user={user}
                onSignOut={() => setSignOutModalOpen(true)}
                messageCount={messageCount}
                notificationCount={notificationCount}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Backdrop for sidebar — mobile/tablet only, sidebar is persistent on lg+ */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Main content — full width, no left margin offset */}
            <main className={`flex-1 min-h-screen pt-16 ${isChatConversation ? 'pb-0' : 'pb-16'} lg:pb-0 overflow-x-hidden`}>
                <div key={pathname} className="w-full animate-in fade-in duration-200 slide-in-from-bottom-1">
                    {children}
                </div>
            </main>

            {/* Mobile bottom nav — hide inside active chat conversations so composer is unobstructed */}
            {!isChatConversation && (
                <BottomNav
                    messageCount={messageCount}
                    notificationCount={notificationCount}
                    onMenuToggle={() => setSidebarOpen((v) => !v)}
                />
            )}

            {/* Sign-out Confirmation & Question Modal */}
            <SignOutPromptModal
                isOpen={signOutModalOpen}
                onClose={() => setSignOutModalOpen(false)}
                onConfirmSignOut={handleConfirmSignOut}
                isSigningOut={isSigningOut}
            />
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
            <ChatProvider>
                <AppShellInner user={user}>{children}</AppShellInner>
            </ChatProvider>
        </UnreadCountProvider>
    )
}
