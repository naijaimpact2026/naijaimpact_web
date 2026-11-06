'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LayoutGrid, Trophy } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { COMPETITION_NAV } from '@/lib/competitions/icons'

const BASE = '/app/competitions'

/**
 * "Competitions" nav group. Drawer (< lg) and full sidebar (xl+): a
 * collapsible list under the item. Icon-only rail (lg): a flyout to the
 * right, portalled so the sidebar's overflow doesn't clip it.
 */
export default function SidebarCompetitions({ onNavigate }: { onNavigate: () => void })
{
    const pathname = usePathname()
    const inSection = pathname === BASE || pathname.startsWith(BASE + '/')
    const [expanded, setExpanded] = useState(inSection)
    const [flyoutOpen, setFlyoutOpen] = useState(false)

    // Open the group when navigating into the section from elsewhere.
    useEffect(() => { if (inSection) setExpanded(true) }, [inSection])

    const itemClass = (active: boolean) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`

    const links = (close: () => void) => (
        <>
            <Link href={BASE} onClick={close} className={itemClass(pathname === BASE)}>
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span className="truncate">All competitions</span>
            </Link>
            {COMPETITION_NAV.map(({ slug, label, icon: Icon }) =>
            {
                const href = `${BASE}/${slug}`
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                    <Link key={slug} href={href} onClick={close} className={itemClass(active)}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{label}</span>
                    </Link>
                )
            })}
        </>
    )

    const triggerClass = `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${inSection
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`

    return (
        <>
            {/* Drawer + full sidebar: collapsible group */}
            <div className="lg:hidden xl:block">
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className={triggerClass}
                >
                    <Trophy className="w-5 h-5 shrink-0" strokeWidth={inSection ? 2.4 : 1.9} />
                    <span className="flex-1 text-left">Competitions</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 leading-none shrink-0">
                        New
                    </span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </button>
                <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                    <div className="overflow-hidden">
                        <div className="ml-5 mt-0.5 mb-1 pl-2 border-l border-border space-y-0.5" inert={!expanded}>
                            {links(onNavigate)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Icon rail (lg only): flyout */}
            <div className="hidden lg:block xl:hidden">
                <Popover open={flyoutOpen} onOpenChange={setFlyoutOpen}>
                    <PopoverTrigger asChild>
                        <button type="button" title="Competitions" aria-label="Competitions" className={`${triggerClass} justify-center relative`}>
                            <Trophy className="w-5 h-5 shrink-0" strokeWidth={inSection ? 2.4 : 1.9} />
                            <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-emerald-500" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" sideOffset={10} className="w-64 p-2">
                        <p className="px-3 pt-1 pb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Competitions</p>
                        <div className="space-y-0.5">{links(() => { setFlyoutOpen(false); onNavigate() })}</div>
                    </PopoverContent>
                </Popover>
            </div>
        </>
    )
}
