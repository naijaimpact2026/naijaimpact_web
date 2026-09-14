'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, MessageCircle, Bell, Menu } from 'lucide-react'

interface BottomNavProps
{
    messageCount?: number
    notificationCount?: number
    onMenuToggle?: () => void
}

const navItems = [
    { icon: Home, label: 'Home', href: '/app' },
    { icon: Users, label: 'Community', href: '/app/feed' },
    { icon: MessageCircle, label: 'Chat', href: '/app/chat', badgeProp: 'messageCount' as const },
    { icon: Bell, label: 'Alerts', href: '/app/notifications', badgeProp: 'notificationCount' as const },
]

export default function BottomNav({ messageCount = 0, notificationCount = 0, onMenuToggle }: BottomNavProps)
{
    const pathname = usePathname()

    const isActive = (href: string) =>
        href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(href + '/')

    const badges: Record<string, number> = { messageCount, notificationCount }

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around h-16 bg-card border-t border-border shadow-[0_-4px_16px_rgba(16,42,67,0.06)]">
            {navItems.map(({ icon: Icon, label, href, badgeProp }) =>
            {
                const active = isActive(href)
                const count = badgeProp ? badges[badgeProp] : 0

                return (
                    <Link
                        key={href + label}
                        href={href}
                        className={`relative flex flex-col items-center justify-center flex-1 gap-0.5 pt-1 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        aria-label={label}
                    >
                        {active && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                        )}

                        <div className="relative">
                            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                            {count > 0 && (
                                <span className="absolute -top-1 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-destructive text-white text-[8px] font-bold leading-none">
                                    {count > 99 ? '99+' : count}
                                </span>
                            )}
                        </div>

                        <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
                    </Link>
                )
            })}

            {/* Menu — opens the full sidebar drawer (search, marketplace, learn, wallet, profile, settings, sign out) */}
            <button
                onClick={onMenuToggle}
                className="relative flex flex-col items-center justify-center flex-1 gap-0.5 pt-1 text-muted-foreground transition-colors"
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5" strokeWidth={1.8} />
                <span className="text-[10px] font-medium">Menu</span>
            </button>
        </nav>
    )
}
