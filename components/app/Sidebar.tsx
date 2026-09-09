'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import
{
    Home,
    FileText,
    Search,
    HandCoins,
    MessageCircle,
    Bell,
    Wallet,
    BookOpen,
    Briefcase,
    LayoutGrid,
    Users,
    User,
    LogOut,
    Settings,
    X,
    ShoppingBag,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User as UserType } from '@/lib/types'

interface SidebarProps
{
    user: UserType | null
    onSignOut: () => void
    notificationCount?: number
    messageCount?: number
    isOpen: boolean
    onClose: () => void
}

const navItems = [
    { icon: Home, label: 'Community', href: '/app/feed' },
    { icon: Search, label: 'Search', href: '/app/search' },
    { icon: HandCoins, label: 'Crowd Funding', href: '/app/funding' },
    { icon: MessageCircle, label: 'Chat', href: '/app/chat', badgeProp: 'messageCount' as const },
    { icon: Bell, label: 'Notifications', href: '/app/notifications', badgeProp: 'notificationCount' as const },
    { icon: Wallet, label: 'Wallet', href: '/app/wallet' },
    { icon: BookOpen, label: 'Learn', href: '/app/learn' },
    { icon: Briefcase, label: 'Business Launch', href: '/app/services' },
    { icon: ShoppingBag, label: 'NaijaMarket', href: '/app/market' },
    { icon: LayoutGrid, label: 'Fintech', href: '/app/fintech' },
    { icon: Users, label: 'Groups', href: '/app/funding' },
]

function getInitials(name: string | null | undefined): string
{
    if (!name) return 'U'
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function Sidebar({
    user,
    onSignOut,
    notificationCount = 0,
    messageCount = 0,
    isOpen,
    onClose,
}: SidebarProps)
{
    const pathname = usePathname()
    const profileHref = user?.username ? `/app/profile/${user.username}` : '/app/settings/onboarding'
    const badgeCounts: Record<string, number> = { messageCount, notificationCount }

    const isActive = (href: string, label?: string) =>
    {
        if (label === 'Microblog') return false
        if (href === '/app/feed') return pathname === '/app/feed' || pathname.startsWith('/app/feed/')
        return pathname.startsWith(href)
    }

    return (
        <>
            {/* Sidebar drawer */}
            <aside
                style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', background: 'linear-gradient(160deg, #0a2d1c 0%, #0f3d25 50%, #0a2d1c 100%)' }}
                className="fixed top-0 left-0 h-full w-64 z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Link href="/app/feed" onClick={onClose} className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Hubnovo" width={28} height={28} className="rounded-md" unoptimized />
                        <div className="leading-none">
                            <p className="font-bold text-sm text-white tracking-tight">Hubnovo</p>
                            <p className="text-[8px] font-medium" style={{ color: '#6ee7b7' }}>Empower. Equip. Elevate.</p>
                        </div>
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full transition-colors"
                        style={{ color: '#6ee7b7' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        aria-label="Close menu"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ icon: Icon, label, href, badgeProp }) =>
                    {
                        const active = isActive(href, label)
                        const count = badgeProp ? badgeCounts[badgeProp] : 0
                        return (
                            <Link
                                key={href + label}
                                href={href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                                    ? 'text-primary'
                                    : 'text-green-100/70 hover:text-white'
                                    }`}
                                style={active ? { background: 'rgba(110,231,183,0.15)' } : undefined}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = '' }}
                            >
                                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary' : ''}`} />
                                <span className="flex-1">{label}</span>
                                {count > 0 && (
                                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shrink-0">
                                        {count > 99 ? '99+' : count}
                                    </span>
                                )}
                            </Link>
                        )
                    })}

                    <Link
                        href={profileHref}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${pathname.startsWith('/app/profile')
                            ? 'text-primary'
                            : 'text-green-100/70 hover:text-white'
                            }`}
                        style={pathname.startsWith('/app/profile') ? { background: 'rgba(110,231,183,0.15)' } : {}}
                    >
                        <User className="w-5 h-5 shrink-0" />
                        <span>Profile</span>
                    </Link>

                    <Link
                        href="/app/settings"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${pathname.startsWith('/app/settings')
                            ? 'text-primary'
                            : 'text-green-100/70 hover:text-white'
                            }`}
                        style={pathname.startsWith('/app/settings') ? { background: 'rgba(110,231,183,0.15)' } : {}}
                    >
                        <Settings className="w-5 h-5 shrink-0" />
                        <span>Settings</span>
                    </Link>
                </nav>

                {/* User + sign out */}
                <div className="px-2 py-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Link
                        href={profileHref}
                        onClick={onClose}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
                        style={{ color: 'inherit' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <Avatar className="h-8 w-8 shrink-0" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                            <AvatarImage src={user?.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                                {getInitials(user?.display_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{user?.display_name ?? 'User'}</p>
                            <p className="text-[10px] truncate" style={{ color: '#6ee7b7' }}>@{user?.username ?? 'username'}</p>
                        </div>
                    </Link>

                    <button
                        onClick={() => { onClose(); onSignOut() }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ color: '#fca5a5' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Sign out
                    </button>
                </div>
            </aside>
        </>
    )
}
