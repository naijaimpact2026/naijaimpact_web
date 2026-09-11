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
            {/* Sidebar — overlay drawer below lg, persistent sticky rail from lg up.
                Compact (icon-only) at lg, full width with labels at xl+. */}
            <aside
                style={{ background: 'linear-gradient(160deg, #0a2d1c 0%, #0f3d25 50%, #0a2d1c 100%)' }}
                className={`fixed top-0 left-0 h-full w-64 z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
                    lg:sticky lg:top-14 lg:z-0 lg:h-[calc(100vh-3.5rem)] lg:w-20 lg:shrink-0 lg:shadow-none lg:translate-x-0
                    xl:w-64
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b lg:justify-center xl:justify-between" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Link href="/app/feed" onClick={onClose} className="flex items-center gap-2">
                        <Image src="/logo.png" alt="HubNovo" width={28} height={28} className="rounded-md shrink-0" unoptimized />
                        <div className="leading-none lg:hidden xl:block">
                            <p className="font-bold text-sm text-white tracking-tight">HubNovo</p>
                            <p className="text-[8px] font-medium" style={{ color: '#6ee7b7' }}>Empower. Equip. Elevate.</p>
                        </div>
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full transition-colors lg:hidden"
                        style={{ color: '#6ee7b7' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        aria-label="Close menu"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
                    {navItems.map(({ icon: Icon, label, href, badgeProp }) =>
                    {
                        const active = isActive(href, label)
                        const count = badgeProp ? badgeCounts[badgeProp] : 0
                        return (
                            <Link
                                key={href + label}
                                href={href}
                                onClick={onClose}
                                title={label}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all lg:justify-center xl:justify-start ${active
                                    ? 'text-primary'
                                    : 'text-green-100/70 hover:text-white'
                                    }`}
                                style={active ? { background: 'rgba(110,231,183,0.15)' } : undefined}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = '' }}
                            >
                                <span className="relative shrink-0">
                                    <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                                    {count > 0 && (
                                        <span className="lg:flex xl:hidden absolute -top-1.5 -right-2 items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                                            {count > 99 ? '99+' : count}
                                        </span>
                                    )}
                                </span>
                                <span className="flex-1 lg:hidden xl:inline">{label}</span>
                                {count > 0 && (
                                    <span className="hidden xl:flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shrink-0">
                                        {count > 99 ? '99+' : count}
                                    </span>
                                )}
                            </Link>
                        )
                    })}

                    <Link
                        href={profileHref}
                        onClick={onClose}
                        title="Profile"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all lg:justify-center xl:justify-start ${pathname.startsWith('/app/profile')
                            ? 'text-primary'
                            : 'text-green-100/70 hover:text-white'
                            }`}
                        style={pathname.startsWith('/app/profile') ? { background: 'rgba(110,231,183,0.15)' } : {}}
                    >
                        <User className="w-5 h-5 shrink-0" />
                        <span className="lg:hidden xl:inline">Profile</span>
                    </Link>

                    <Link
                        href="/app/settings"
                        onClick={onClose}
                        title="Settings"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all lg:justify-center xl:justify-start ${pathname.startsWith('/app/settings')
                            ? 'text-primary'
                            : 'text-green-100/70 hover:text-white'
                            }`}
                        style={pathname.startsWith('/app/settings') ? { background: 'rgba(110,231,183,0.15)' } : {}}
                    >
                        <Settings className="w-5 h-5 shrink-0" />
                        <span className="lg:hidden xl:inline">Settings</span>
                    </Link>
                </nav>

                {/* User + sign out */}
                <div className="px-2 py-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Link
                        href={profileHref}
                        onClick={onClose}
                        title={user?.display_name ?? 'User'}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors lg:justify-center xl:justify-start"
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
                        <div className="flex-1 min-w-0 lg:hidden xl:block">
                            <p className="text-xs font-semibold text-white truncate">{user?.display_name ?? 'User'}</p>
                            <p className="text-[10px] truncate" style={{ color: '#6ee7b7' }}>@{user?.username ?? 'username'}</p>
                        </div>
                    </Link>

                    <button
                        onClick={() => { onClose(); onSignOut() }}
                        title="Sign out"
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all lg:justify-center xl:justify-start"
                        style={{ color: '#fca5a5' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span className="lg:hidden xl:inline">Sign out</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
