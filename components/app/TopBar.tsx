'use client'

import { useState, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, Bell, MessageCircle, Menu, PenSquare, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/lib/types'

interface TopBarProps
{
    user: User | null
    notificationCount?: number
    messageCount?: number
    onMenuToggle?: () => void
}

function getInitials(name: string | null | undefined): string
{
    if (!name) return 'U'
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

function TopBar({ user, notificationCount = 0, messageCount = 0, onMenuToggle }: TopBarProps)
{
    const router = useRouter()
    const [query, setQuery] = useState('')
    const profileHref = user?.username ? `/app/profile/${user.username}` : '/app/settings/onboarding'

    function handleSearchSubmit(e: React.FormEvent)
    {
        e.preventDefault()
        const q = query.trim()
        router.push(q ? `/app/search?q=${encodeURIComponent(q)}` : '/app/search')
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 bg-card border-b border-border">
            {/* Hamburger — mobile/tablet only, sidebar is a persistent rail on lg+ */}
            <button
                onClick={onMenuToggle}
                className="p-2 -ml-1 sm:-ml-2 rounded-full text-muted-foreground hover:bg-muted transition-colors shrink-0 lg:hidden"
                aria-label="Toggle menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link href="/app" className="flex items-center gap-2 shrink-0">
                {/* Light Mode Logo */}
                <Image src="/logo.png" alt="Hubnovo" width={30} height={30} className="rounded-md dark:hidden" unoptimized />
                {/* Dark Mode Logo */}
                <Image src="/logo-darkmode (1).png" alt="Hubnovo" width={30} height={30} className="rounded-md hidden dark:block" unoptimized />
                {/* Light Mode Wordmark */}
                <Image src="/logo-wordmark.png" alt="Hubnovo" width={90} height={30} className="hidden sm:block dark:hidden h-6 w-auto" unoptimized />
                {/* Dark Mode Wordmark */}
                <Image src="/logo-darkmode (2).png" alt="Hubnovo" width={90} height={30} className="hidden dark:sm:block h-6 w-auto" unoptimized />
            </Link>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 max-w-xl mx-1 sm:mx-auto">
                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 sm:px-4 sm:py-2 focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
                    <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search..."
                        className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        aria-label="Search"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </form>

            {/* Right cluster */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Link
                    href="/app/feed/create"
                    className="hidden sm:flex relative p-2.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Create a post"
                    title="Create a post"
                >
                    <PenSquare className="w-5 h-5" />
                </Link>

                <Link
                    href="/app/chat"
                    className="hidden sm:flex relative p-2.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Messages"
                >
                    <MessageCircle className="w-5 h-5" />
                    {messageCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-white text-[9px] font-bold leading-none">
                            {messageCount > 99 ? '99+' : messageCount}
                        </span>
                    )}
                </Link>

                <Link
                    href="/app/notifications"
                    className="hidden sm:flex relative p-2.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Notifications"
                >
                    <Bell className="w-5 h-5" />
                    {notificationCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-white text-[9px] font-bold leading-none">
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                    )}
                </Link>

                <Link href={profileHref} className="flex items-center gap-2 pl-1 sm:pl-1.5 pr-1 py-1 rounded-full hover:bg-muted transition-colors shrink-0" aria-label="Profile">
                    <Avatar className="h-8 w-8 ring-1 ring-border shrink-0">
                        <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.display_name ?? 'User'} />
                        <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                            {getInitials(user?.display_name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-semibold text-foreground pr-1">
                        {user?.display_name?.split(' ')[0] ?? 'Profile'}
                    </span>
                </Link>
            </div>
        </header>
    )
}

export default memo(TopBar)
