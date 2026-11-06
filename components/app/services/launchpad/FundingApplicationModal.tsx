'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import type { FundingOpportunity } from '@/lib/launchpad-data'
import { toast } from '@/components/toast'
import { Landmark, CheckCircle2 } from 'lucide-react'

interface FundingApplicationModalProps
{
    opportunity: FundingOpportunity | null
    onClose: () => void
}

export default function FundingApplicationModal({
    opportunity,
    onClose,
}: FundingApplicationModalProps)
{
    const [businessName, setBusinessName] = useState('')
    const [amount, setAmount] = useState('')
    const [useOfFunds, setUseOfFunds] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (!opportunity) return null

    const handleSubmit = (e: React.FormEvent) =>
    {
        e.preventDefault()
        setSubmitting(true)
        setTimeout(() =>
        {
            toast.success(`Application submitted for ${opportunity.title}! Our team will contact you within 24 hours.`)
            setSubmitting(false)
            onClose()
        }, 600)
    }

    return (
        <Dialog open={!!opportunity} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${opportunity.badgeBg}`}>
                            <Landmark className="w-4 h-4" />
                        </div>
                        <DialogTitle className="text-base sm:text-lg font-bold">
                            {opportunity.title}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {opportunity.highlight}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
                    <div>
                        <label className="text-xs font-semibold text-foreground">Registered Business / Trade Name</label>
                        <input
                            type="text"
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. DaniFoods Enterprises"
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-foreground">Requested Capital (₦)</label>
                        <input
                            type="text"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 500,000"
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm font-semibold"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-foreground">Purpose & Use of Funds</label>
                        <textarea
                            rows={3}
                            required
                            value={useOfFunds}
                            onChange={(e) => setUseOfFunds(e.target.value)}
                            placeholder="Briefly describe what inventory, equipment, or working capital this funding will support..."
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm"
                        />
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5 text-foreground font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Quick 48-Hour Decision Window</span>
                        </div>
                        <p className="text-[11px]">
                            No collateral required for microloans under ₦500,000 with a verified Hubnovo business profile.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                        >
                            {submitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
