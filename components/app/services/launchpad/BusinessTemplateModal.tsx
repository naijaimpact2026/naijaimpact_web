'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import type { BusinessTemplate } from '@/lib/launchpad-data'
import { Download, FileText, CheckCircle2, Copy } from 'lucide-react'
import { toast } from '@/components/toast'

interface BusinessTemplateModalProps
{
    template: BusinessTemplate | null
    onClose: () => void
}

export default function BusinessTemplateModal({ template, onClose }: BusinessTemplateModalProps)
{
    if (!template) return null

    const handleDownload = () =>
    {
        toast.success(`Downloading ${template.title} (${template.fileFormat})`)
        onClose()
    }

    const handleCopyOutline = () =>
    {
        navigator.clipboard.writeText(`${template.title}\n\n${template.description}`)
        toast.success('Template outline copied to clipboard!')
    }

    return (
        <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {template.category}
                        </span>
                    </div>
                    <DialogTitle className="text-lg font-bold">
                        {template.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Format: <span className="font-semibold text-foreground">{template.fileFormat}</span> · Scope: <span className="font-semibold text-foreground">{template.pages}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-3">
                    <p className="text-sm text-foreground/90 leading-relaxed">
                        {template.description}
                    </p>

                    <div className="p-3 rounded-xl bg-muted/50 border border-border/70 space-y-2">
                        <p className="text-xs font-bold text-foreground">What&apos;s Included:</p>
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Pre-filled Nigerian market benchmarks & compliance standards</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Automated financial formulas & sensitivity curves</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Editable sections ready for CAC and bank loan applications</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                        onClick={handleCopyOutline}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Outline</span>
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Template</span>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
