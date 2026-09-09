'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, Bell, Menu } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/lib/types'

interface TopBarProps
{
    user: User | null
    notificationCount?: number
    onMenuToggle?: () => void
}

function getInitials(name: string | null | undefined): string
{
    if (!name) return 'U'
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function TopBar({ user, notificationCount = 0, onMenuToggle }: TopBarProps)
{
    const router = useRouter()
    const profileHref = user?.username ? `/app/profile/${user.username}` : '/app/settings/onboarding'

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b h-14 flex items-center px-3 gap-2 shadow-sm"
            style={{ background: 'linear-gradient(90deg, #0a2d1c 0%, #0f3d25 60%, #065f46 100%)', borderColor: 'rgba(255,255,255,0.08)' }}>
            {/* Hamburger menu toggle */}
            <button
                onClick={onMenuToggle}
                className="p-2 rounded-full transition-colors shrink-0"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                aria-label="Toggle menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link href="/app/feed" className="flex items-center gap-1.5 shrink-0">
                <Image src="/logo.png" alt="Hubnovo" width={28} height={28} className="rounded-md" unoptimized />
                <div className="leading-none hidden sm:block">
                    <p className="font-bold text-sm text-white tracking-tight">Hubnovo</p>
                    <p className="text-[8px] font-medium" style={{ color: '#6ee7b7' }}>Empower. Equip. Elevate.</p>
                </div>
            </Link>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <button
                onClick={() => router.push('/app/search')}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                aria-label="Search"
            >
                <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <Link
                href="/app/notifications"
                className="relative p-2 rounded-full transition-colors"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                        {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                )}
            </Link>

            {/* Avatar */}
            <Link href={profileHref} aria-label="Profile">
                <Avatar className="h-8 w-8" style={{ border: '2px solid rgba(110,231,183,0.5)' }}>
                    <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.display_name ?? 'User'} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                        {getInitials(user?.display_name)}
                    </AvatarFallback>
                </Avatar>
            </Link>
        </header>
    )
}
