'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import
{
    Home,
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
    Sprout,
    ArrowRight,
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
    { icon: Home, label: 'Home', href: '/app' },
    { icon: Search, label: 'Search', href: '/app/search' },
    { icon: Users, label: 'Community', href: '/app/feed' },
    { icon: ShoppingBag, label: 'Marketplace', href: '/app/market' },
    { icon: BookOpen, label: 'Learn', href: '/app/learn' },
    { icon: Briefcase, label: 'Business LaunchPad', href: '/app/services' },
    { icon: Wallet, label: 'Wallet & Save', href: '/app/wallet' },
    { icon: HandCoins, label: 'Crowdfunding', href: '/app/funding' },
    { icon: LayoutGrid, label: 'Fintech', href: '/app/fintech' },
    { icon: MessageCircle, label: 'Messages', href: '/app/chat', badgeProp: 'messageCount' as const },
    { icon: Bell, label: 'Notifications', href: '/app/notifications', badgeProp: 'notificationCount' as const },
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

    const isActive = (href: string) =>
    {
        if (href === '/app') return pathname === '/app'
        return pathname === href || pathname.startsWith(href + '/')
    }

    async function handleInviteFriends()
    {
        const url = typeof window !== 'undefined' ? window.location.origin : 'https://hubnovo.com'
        const shareData = { title: 'Hubnovo', text: 'Join me on Hubnovo — People. Opportunities. Prosperity.', url }

        if (navigator.share)
        {
            try { await navigator.share(shareData) } catch { /* user cancelled — not an error */ }
            return
        }

        try
        {
            await navigator.clipboard.writeText(url)
            const { toast } = await import('sonner')
            toast.success('Invite link copied to clipboard')
        } catch { /* clipboard unavailable — silently no-op */ }
    }

    return (
        <>
            {/* Sidebar — the only global nav chrome (no top bar). Overlay drawer below lg,
                persistent rail from lg up. Compact (icon-only) at lg, full width with labels at xl+. */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 z-40 flex flex-col bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-in-out
                    lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:w-20 lg:shrink-0 lg:shadow-none lg:translate-x-0
                    xl:w-64
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header — mobile/tablet drawer only (lg+ already has the logo in the top bar) */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-border lg:hidden">
                    <Link href="/app" onClick={onClose} className="flex items-center gap-2">
                        {/* Light Mode Logo */}
                        <Image src="/logo.png" alt="Hubnovo" width={30} height={30} className="rounded-md shrink-0 dark:hidden" unoptimized />
                        {/* Dark Mode Logo */}
                        <Image src="/logo-darkmode (1).png" alt="Hubnovo" width={30} height={30} className="rounded-md shrink-0 hidden dark:block" unoptimized />
                        <div className="leading-none">
                            {/* Light Mode Wordmark */}
                            <Image src="/logo-wordmark.png" alt="Hubnovo" width={84} height={28} className="h-4 w-auto dark:hidden" unoptimized />
                            {/* Dark Mode Wordmark */}
                            <Image src="/logo-darkmode (2).png" alt="Hubnovo" width={84} height={28} className="h-4 w-auto hidden dark:block" unoptimized />
                            <p className="text-[8px] font-medium text-emerald mt-0.5">People. Opportunities. Prosperity.</p>
                        </div>
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
                    {navItems.map(({ icon: Icon, label, href, badgeProp }) =>
                    {
                        const active = isActive(href)
                        const count = badgeProp ? badgeCounts[badgeProp] : 0
                        return (
                            <Link
                                key={href + label}
                                href={href}
                                onClick={onClose}
                                title={label}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all lg:justify-center xl:justify-start ${active
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <span className="relative shrink-0">
                                    <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.9} />
                                    {count > 0 && (
                                        <span className="lg:flex xl:hidden absolute -top-1.5 -right-2 items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-white text-[9px] font-bold leading-none">
                                            {count > 99 ? '99+' : count}
                                        </span>
                                    )}
                                </span>
                                <span className="flex-1 lg:hidden xl:inline">{label}</span>
                                {count > 0 && (
                                    <span className="hidden xl:flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold leading-none shrink-0">
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
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <User className="w-5 h-5 shrink-0" strokeWidth={pathname.startsWith('/app/profile') ? 2.4 : 1.9} />
                        <span className="lg:hidden xl:inline">Profile</span>
                    </Link>

                    <Link
                        href="/app/settings"
                        onClick={onClose}
                        title="Settings"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all lg:justify-center xl:justify-start ${pathname.startsWith('/app/settings')
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <Settings className="w-5 h-5 shrink-0" strokeWidth={pathname.startsWith('/app/settings') ? 2.4 : 1.9} />
                        <span className="lg:hidden xl:inline">Settings</span>
                    </Link>
                </nav>

                {/* Invite friends — full sidebar (xl+) only */}
                <div className="hidden xl:block px-3 pb-3">
                    <div className="relative overflow-hidden rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #0A1E33 0%, #102A43 55%, #00688A 100%)' }}>
                        <Sprout className="absolute -right-2 -bottom-2 w-16 h-16 opacity-20" />
                        <p className="relative font-display font-bold text-sm leading-tight">A Brighter Tomorrow Together</p>
                        <p className="relative text-[11px] text-white/80 mt-1">People. Opportunities. Prosperity.</p>
                        <button
                            onClick={handleInviteFriends}
                            className="relative mt-3 inline-flex items-center gap-1.5 bg-white text-secondary text-xs font-bold px-3.5 py-2 rounded-full hover:bg-white/90 transition-colors"
                        >
                            Invite Friends <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* User + sign out */}
                <div className="px-2 py-3 space-y-1 border-t border-border">
                    <Link
                        href={profileHref}
                        onClick={onClose}
                        title={user?.display_name ?? 'User'}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted transition-colors lg:justify-center xl:justify-start"
                    >
                        <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
                            <AvatarImage src={user?.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                {getInitials(user?.display_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 lg:hidden xl:block">
                            <p className="text-xs font-semibold text-foreground truncate">{user?.display_name ?? 'User'}</p>
                            <p className="text-[10px] text-muted-foreground truncate">@{user?.username ?? 'username'}</p>
                        </div>
                    </Link>

                    <button
                        onClick={() => { onClose(); onSignOut() }}
                        title="Sign out"
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all lg:justify-center xl:justify-start"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span className="lg:hidden xl:inline">Sign out</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
