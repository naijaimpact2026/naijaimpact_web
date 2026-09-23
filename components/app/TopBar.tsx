'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
    Search,
    Bell,
    MessageCircle,
    Menu,
    Home,
    Plus,
    X,
    ChevronDown,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/lib/types'

interface TopBarProps {
    user: User | null
    notificationCount?: number
    messageCount?: number
    onMenuToggle?: () => void
}

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U'

    return name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export default function TopBar({
    user,
    notificationCount = 0,
    messageCount = 0,
    onMenuToggle,
}: TopBarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [query, setQuery] = useState('')

    const profileHref = user?.username
        ? `/app/profile/${user.username}`
        : '/app/settings/onboarding'

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault()

        const q = query.trim()

        router.push(
            q
                ? `/app/search?q=${encodeURIComponent(q)}`
                : '/app/search'
        )
    }

    const isHomeActive = pathname === '/app'

    const isMessagesActive =
        pathname === '/app/chat' ||
        pathname.startsWith('/app/chat/')

    const isNotificationsActive =
        pathname === '/app/notifications' ||
        pathname.startsWith('/app/notifications/')

    return (
        <header
            className="
                fixed inset-x-0 top-0 z-50
                h-16
                border-b border-white/10
                bg-[#0d2b43]
                text-white
                shadow-lg shadow-black/10
            "
        >
            <div className="flex h-full items-center gap-3 px-4 sm:px-5 lg:px-6">

                {/* Mobile menu */}
                <button
                    type="button"
                    onClick={onMenuToggle}
                    className="
                        -ml-1 flex h-10 w-10 shrink-0
                        items-center justify-center
                        rounded-xl
                        text-white/70
                        transition-colors
                        hover:bg-white/10
                        hover:text-white
                        lg:hidden
                    "
                    aria-label="Toggle menu"
                >
                    <Menu className="h-5 w-5" strokeWidth={2} />
                </button>

                {/* Logo */}
                <Link
                    href="/app"
                    className="flex shrink-0 items-center gap-2.5"
                    aria-label="Hubnovo"
                >
                    <Image
                        src="/logo.png"
                        alt="Hubnovo"
                        width={34}
                        height={34}
                        className="h-9 w-9 rounded-lg object-contain"
                        unoptimized
                    />

                    <Image
                        src="/logo-wordmark.png"
                        alt="Hubnovo"
                        width={100}
                        height={32}
                        className="hidden h-7 w-auto object-contain sm:block"
                        unoptimized
                    />
                </Link>

                {/* Search */}
                <form
                    onSubmit={handleSearchSubmit}
                    className="mx-auto flex min-w-0 flex-1 justify-center"
                >
                    <div
                        className="
                            group
                            flex h-10 w-full max-w-[580px]
                            items-center gap-3
                            rounded-xl
                            border border-white/5
                            bg-[#102f48]
                            px-4
                            transition-all
                            focus-within:border-white/15
                            focus-within:bg-[#123550]
                            focus-within:ring-2
                            focus-within:ring-white/5
                        "
                    >
                        <Search
                            className="
                                h-[18px] w-[18px]
                                shrink-0
                                text-white/45
                                transition-colors
                                group-focus-within:text-white/70
                            "
                            strokeWidth={2}
                        />

                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for people, posts, courses..."
                            className="
                                min-w-0
                                flex-1
                                bg-transparent
                                text-sm
                                text-white
                                outline-none
                                placeholder:text-white/40
                            "
                            aria-label="Search"
                        />

                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="
                                    flex h-6 w-6
                                    items-center justify-center
                                    rounded-md
                                    text-white/40
                                    hover:bg-white/10
                                    hover:text-white
                                "
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </form>

                {/* Right navigation */}
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">

                    {/* Home */}
                    <Link
                        href="/app"
                        aria-label="Home"
                        className={`
                            hidden sm:flex
                            h-14 w-14
                            flex-col
                            items-center
                            justify-center
                            gap-0.5
                            rounded-xl
                            transition-all
                            ${
                                isHomeActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                            }
                        `}
                    >
                        <Home
                            className="h-5 w-5"
                            strokeWidth={isHomeActive ? 2.2 : 1.9}
                        />
                        <span className="text-[10px] font-medium leading-none">
                            Home
                        </span>
                    </Link>

                    {/* Create */}
                    <Link
                        href="/app/feed/create"
                        aria-label="Create a post"
                        className="
                            hidden sm:flex
                            h-14 w-14
                            flex-col
                            items-center
                            justify-center
                            gap-0.5
                            rounded-xl
                            text-white/65
                            transition-all
                            hover:bg-white/10
                            hover:text-white
                        "
                    >
                        <span
                            className="
                                flex h-7 w-7
                                items-center justify-center
                                rounded-full
                                bg-emerald-500
                                shadow-sm
                                shadow-emerald-500/20
                            "
                        >
                            <Plus
                                className="h-4 w-4 text-white"
                                strokeWidth={2.5}
                            />
                        </span>

                        <span className="text-[10px] font-medium leading-none">
                            Create
                        </span>
                    </Link>

                    {/* Messages */}
                    <Link
                        href="/app/chat"
                        aria-label="Messages"
                        className={`
                            relative
                            flex h-14 w-14
                            flex-col
                            items-center
                            justify-center
                            gap-0.5
                            rounded-xl
                            transition-all
                            ${
                                isMessagesActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                            }
                        `}
                    >
                        <div className="relative">
                            <MessageCircle
                                className="h-5 w-5"
                                strokeWidth={isMessagesActive ? 2.2 : 1.9}
                            />

                            {messageCount > 0 && (
                                <span
                                    className="
                                        absolute
                                        -right-2
                                        -top-2
                                        flex h-[17px]
                                        min-w-[17px]
                                        items-center justify-center
                                        rounded-full
                                        border-2
                                        border-[#0d2b43]
                                        bg-red-500
                                        px-1
                                        text-[8px]
                                        font-bold
                                        leading-none
                                        text-white
                                    "
                                >
                                    {messageCount > 99
                                        ? '99+'
                                        : messageCount}
                                </span>
                            )}
                        </div>

                        <span className="text-[10px] font-medium leading-none">
                            Messages
                        </span>
                    </Link>

                    {/* Notifications */}
                    <Link
                        href="/app/notifications"
                        aria-label="Notifications"
                        className={`
                            relative
                            flex h-14 w-14
                            flex-col
                            items-center
                            justify-center
                            gap-0.5
                            rounded-xl
                            transition-all
                            ${
                                isNotificationsActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                            }
                        `}
                    >
                        <div className="relative">
                            <Bell
                                className="h-5 w-5"
                                strokeWidth={
                                    isNotificationsActive ? 2.2 : 1.9
                                }
                            />

                            {notificationCount > 0 && (
                                <span
                                    className="
                                        absolute
                                        -right-2
                                        -top-2
                                        flex h-[17px]
                                        min-w-[17px]
                                        items-center justify-center
                                        rounded-full
                                        border-2
                                        border-[#0d2b43]
                                        bg-red-500
                                        px-1
                                        text-[8px]
                                        font-bold
                                        leading-none
                                        text-white
                                    "
                                >
                                    {notificationCount > 99
                                        ? '99+'
                                        : notificationCount}
                                </span>
                            )}
                        </div>

                        <span className="text-[10px] font-medium leading-none">
                            Notifications
                        </span>
                    </Link>

                    {/* Divider */}
                    <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />

                    {/* Profile */}
                    <Link
                        href={profileHref}
                        aria-label="Profile"
                        className="
                            flex h-14
                            items-center
                            gap-2
                            rounded-xl
                            px-2
                            transition-all
                            hover:bg-white/10
                        "
                    >
                        <Avatar
                            className="
                                h-8 w-8
                                shrink-0
                                border
                                border-white/15
                                ring-1
                                ring-white/5
                            "
                        >
                            <AvatarImage
                                src={user?.avatar_url ?? undefined}
                                alt={user?.display_name ?? 'User'}
                            />

                            <AvatarFallback
                                className="
                                    bg-emerald-500/20
                                    text-emerald-300
                                    text-xs
                                    font-bold
                                "
                            >
                                {getInitials(user?.display_name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="hidden min-w-0 text-left md:block">
                            <p className="max-w-[90px] truncate text-sm font-semibold text-white">
                                {user?.display_name?.split(' ')[0] ?? 'Profile'}
                            </p>

                            <p className="max-w-[90px] truncate text-[10px] text-white/40">
                                @{user?.username ?? 'user'}
                            </p>
                        </div>

                        <ChevronDown className="hidden h-3.5 w-3.5 text-white/40 md:block" />
                    </Link>
                </div>
            </div>
        </header>
    )
}