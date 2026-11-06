'use client'

import React from 'react'
import { TOOLS_AND_RESOURCES, type BusinessToolResource } from '@/lib/launchpad-data'
import {
    FileCheck2,
    ShieldCheck,
    Calculator,
    PieChart,
    Search,
    Sparkles,
    ChevronRight,
} from 'lucide-react'

interface LaunchpadToolsResourcesProps
{
    onSelectTool: (tool: BusinessToolResource) => void
    onSeeAll?: () => void
}

function getToolIcon(icon: string)
{
    switch (icon)
    {
        case 'file-check-2':
            return <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        case 'shield-check':
            return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        case 'calculator':
            return <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        case 'pie-chart':
            return <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        case 'search':
            return <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        case 'sparkles':
            return <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        default:
            return <FileCheck2 className="w-4 h-4 text-primary" />
    }
}

export default function LaunchpadToolsResources({
    onSelectTool,
    onSeeAll,
}: LaunchpadToolsResourcesProps)
{
    return (
        <div className="w-full bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Tools & Resources
                </h2>
                <button
                    onClick={onSeeAll}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                    See All
                </button>
            </div>

            {/* List */}
            <div className="divide-y divide-border/60">
                {TOOLS_AND_RESOURCES.map((tool) => (
                    <div
                        key={tool.id}
                        onClick={() => onSelectTool(tool)}
                        className="flex items-center justify-between py-2.5 px-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                {getToolIcon(tool.icon)}
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {tool.title}
                            </span>
                            {tool.badge && (
                                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary shrink-0">
                                    {tool.badge}
                                </span>
                            )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </div>
                ))}
            </div>
        </div>
    )
}
