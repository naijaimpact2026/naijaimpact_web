'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, MessageCircle, Wallet, Bell } from 'lucide-react'

interface BottomNavProps
{
    messageCount?: number
    notificationCount?: number
}

const navItems = [
    { icon: Home, label: 'Home', href: '/app/feed' },
    { icon: ShoppingBag, label: 'Market', href: '/app/market' },
    { icon: MessageCircle, label: 'Chat', href: '/app/chat', badgeProp: 'messageCount' as const },
    { icon: Wallet, label: 'Wallet', href: '/app/wallet' },
    { icon: Bell, label: 'Alerts', href: '/app/notifications', badgeProp: 'notificationCount' as const },
]

export default function BottomNav({ messageCount = 0, notificationCount = 0 }: BottomNavProps)
{
    const pathname = usePathname()

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

    const badges: Record<string, number> = { messageCount, notificationCount }

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around h-16"
            style={{ background: 'linear-gradient(90deg,#0a2d1c 0%,#0f3d25 60%,#065f46 100%)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {navItems.map(({ icon: Icon, label, href, badgeProp }) =>
            {
                const active = isActive(href)
                const count = badgeProp ? badges[badgeProp] : 0

                return (
                    <Link
                        key={href + label}
                        href={href}
                        className={`relative flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors pt-1 ${active ? 'text-primary' : 'text-white/50'
                            }`}
                        aria-label={label}
                    >
                        {/* Active indicator bar at top */}
                        {active && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                        )}

                        <div className="relative">
                            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                            {count > 0 && (
                                <span className="absolute -top-1 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold leading-none">
                                    {count > 99 ? '99+' : count}
                                </span>
                            )}
                        </div>

                        <span className={`text-[10px] font-medium ${active ? 'text-primary font-semibold' : ''}`}>
                            {label}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
