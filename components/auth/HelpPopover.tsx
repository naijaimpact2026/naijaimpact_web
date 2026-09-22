'use client'

import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

interface HelpLink
{
    href: string
    label: string
    primary?: boolean
}

interface HelpPopoverProps
{
    description: string
    links: HelpLink[]
}

export default function HelpPopover({ description, links }: HelpPopoverProps)
{
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <span>Need help?</span>
                    <HelpCircle className="w-[18px] h-[18px]" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-72 rounded-2xl border border-[#294667] bg-[#0B1A31] p-4 shadow-2xl"
            >
                <h3 className="text-sm font-semibold text-white">Need help?</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {description}
                </p>

                <div className="mt-4 space-y-2">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={
                                link.primary
                                    ? 'block rounded-lg bg-gradient-to-r from-[#168BFF] to-[#2CE69B] px-3 py-2.5 text-center text-xs font-semibold text-white hover:brightness-105 transition-all'
                                    : 'block rounded-lg border border-[#3A5D87] px-3 py-2.5 text-xs font-medium text-slate-200 hover:bg-white/5 transition-colors'
                            }
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
