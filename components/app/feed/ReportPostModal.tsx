'use client'

import { useState } from 'react'
import
{
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Flag, AlertTriangle, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react'
import { reportPost } from '@/lib/actions/posts'
import { toast } from '@/components/toast'

const REPORT_REASONS = [
    { id: 'spam', label: 'Spam or commercial promotion', desc: 'Repetitive, advertising, or unsolicited promotion' },
    { id: 'fraud', label: 'Fraud, scam or deceptive opportunity', desc: 'Misleading financial offers, phishing, or fake gigs' },
    { id: 'harassment', label: 'Harassment, hate speech, or abuse', desc: 'Targeting individuals, discrimination, or threats' },
    { id: 'misinformation', label: 'False or misleading information', desc: 'Fabricated news, health claims, or false identity' },
    { id: 'inappropriate', label: 'Inappropriate or explicit content', desc: 'Graphic violence, sexually explicit media, or illegal acts' },
]

interface ReportPostModalProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    postId: string
    authorUsername?: string
}

export default function ReportPostModal({
    open,
    onOpenChange,
    postId,
    authorUsername,
}: ReportPostModalProps)
{
    const [selectedReason, setSelectedReason] = useState<string>('spam')
    const [details, setDetails] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    async function handleSubmit(e: React.FormEvent)
    {
        e.preventDefault()
        if (!selectedReason) return

        setIsSubmitting(true)
        try
        {
            await reportPost({
                postId,
                reason: selectedReason,
                details: details.trim() || undefined,
            })
            setIsSubmitted(true)
            toast.success('Thank you for your report. Our moderation team has been notified.')
            setTimeout(() =>
            {
                setIsSubmitted(false)
                setDetails('')
                setSelectedReason('spam')
                onOpenChange(false)
            }, 1400)
        } catch (err)
        {
            console.error('Failed to submit post report:', err)
            toast.error('Failed to submit report. Please try again.')
        } finally
        {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card border-border text-foreground p-6 rounded-3xl">
                <DialogHeader>
                    <div className="flex items-center gap-2.5 text-destructive mb-1">
                        <div className="w-9 h-9 rounded-2xl bg-destructive/10 flex items-center justify-center">
                            <Flag className="w-4 h-4 text-destructive" />
                        </div>
                        <DialogTitle className="text-lg font-bold">Report Post</DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                        {authorUsername
                            ? `Help keep Hubnovo safe. Why are you reporting this post by @${authorUsername}?`
                            : 'Help keep Hubnovo safe. Why are you reporting this post?'}
                    </DialogDescription>
                </DialogHeader>

                {isSubmitted ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center animate-in zoom-in-75">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <p className="font-bold text-foreground text-sm">Report Submitted</p>
                        <p className="text-xs text-muted-foreground max-w-xs">
                            Thank you for helping protect the Hubnovo community. We will review this post shortly.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground">Select a reason</label>
                            <div className="space-y-1.5">
                                {REPORT_REASONS.map((r) =>
                                {
                                    const isSelected = selectedReason === r.id
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setSelectedReason(r.id)}
                                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${isSelected
                                                    ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary/20'
                                                    : 'border-border/80 hover:bg-muted/60 text-muted-foreground'
                                                }`}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${isSelected
                                                        ? 'border-primary bg-primary'
                                                        : 'border-muted-foreground/40'
                                                    }`}
                                            >
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                    {r.label}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                                    {r.desc}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">
                                Additional context <span className="font-normal text-muted-foreground">(optional)</span>
                            </label>
                            <Textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder="Describe what makes this content problematic or suspicious…"
                                rows={2}
                                maxLength={500}
                                className="text-xs rounded-xl resize-none border-border"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                                disabled={isSubmitting || !selectedReason}
                                className="rounded-xl text-xs font-bold flex items-center gap-1.5"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…
                                    </>
                                ) : (
                                    <>
                                        <Flag className="w-3.5 h-3.5" /> Submit Report
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
