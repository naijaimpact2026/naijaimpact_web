'use client'

import React from 'react'
import { BUSINESS_TEMPLATES, type BusinessTemplate } from '@/lib/launchpad-data'
import {
    FileText,
    BarChart3,
    Megaphone,
    Settings,
    Presentation,
} from 'lucide-react'

interface LaunchpadTemplatesProps
{
    onUseTemplate: (template: BusinessTemplate) => void
    onSeeAll?: () => void
}

function getTemplateIcon(icon: string)
{
    switch (icon)
    {
        case 'file-text':
            return <FileText className="w-6 h-6 text-blue-500" />
        case 'bar-chart-3':
            return <BarChart3 className="w-6 h-6 text-emerald-500" />
        case 'megaphone':
            return <Megaphone className="w-6 h-6 text-rose-500" />
        case 'settings':
            return <Settings className="w-6 h-6 text-indigo-500" />
        case 'presentation':
            return <Presentation className="w-6 h-6 text-sky-500" />
        default:
            return <FileText className="w-6 h-6 text-primary" />
    }
}

export default function LaunchpadTemplates({ onUseTemplate, onSeeAll }: LaunchpadTemplatesProps)
{
    return (
        <div className="w-full">
            {/* Header with See All */}
            <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Business Templates
                </h2>
                <button
                    onClick={onSeeAll}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                    See All
                </button>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                {BUSINESS_TEMPLATES.map((tpl) => (
                    <div
                        key={tpl.id}
                        className="flex flex-col items-center justify-between p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md transition-all text-center group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                            {getTemplateIcon(tpl.icon)}
                        </div>

                        <div className="flex-1 flex flex-col justify-center mb-3">
                            <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-tight">
                                {tpl.title}
                            </h3>
                        </div>

                        <button
                            onClick={() => onUseTemplate(tpl)}
                            className="w-full py-1.5 px-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground active:scale-98 transition-all cursor-pointer"
                        >
                            Use Template
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
