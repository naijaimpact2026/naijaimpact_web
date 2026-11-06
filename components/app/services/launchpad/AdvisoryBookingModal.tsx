'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/components/toast'
import { Rocket, Calendar, Clock, CheckCircle2 } from 'lucide-react'

interface AdvisoryBookingModalProps
{
    open: boolean
    onClose: () => void
}

export default function AdvisoryBookingModal({ open, onClose }: AdvisoryBookingModalProps)
{
    const [topic, setTopic] = useState('Business Plan & Financial Review')
    const [date, setDate] = useState('')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = (e: React.FormEvent) =>
    {
        e.preventDefault()
        setSubmitting(true)
        setTimeout(() =>
        {
            toast.success('Advisory session booked! We sent a calendar invite to your email.')
            setSubmitting(false)
            onClose()
        }, 600)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Rocket className="w-4 h-4" />
                        </div>
                        <DialogTitle className="text-base sm:text-lg font-bold">
                            Book Free 1-on-1 Advisory Session
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Connect directly with an accredited enterprise mentor to review your business strategy.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
                    <div>
                        <label className="text-xs font-semibold text-foreground">Select Advisory Focus</label>
                        <select
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm font-medium"
                        >
                            <option>Business Plan & Financial Review</option>
                            <option>Hubnovo Registration & Compliance Guidance</option>
                            <option>Investor Pitch Deck Preparation</option>
                            <option>Sales & Go-to-Market Strategy</option>
                            <option>Grant & Loan Application Assistance</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Preferred Date</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-xs sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Time Slot (WAT)</span>
                            </label>
                            <select className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-xs sm:text-sm">
                                <option>10:00 AM - 10:45 AM</option>
                                <option>01:00 PM - 01:45 PM</option>
                                <option>03:30 PM - 04:15 PM</option>
                                <option>05:00 PM - 05:45 PM</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-foreground">Specific Questions / Context</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Share what specific obstacles you want to tackle during this session..."
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm"
                        />
                    </div>

                    <div className="p-3 rounded-xl bg-muted/50 border border-border/70 text-xs text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Sessions are 100% free, 45 minutes on Google Meet with notes delivered after.</span>
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
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                            {submitting ? 'Confirming...' : 'Confirm Session'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
