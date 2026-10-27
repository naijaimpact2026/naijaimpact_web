'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LogOut, Loader2, MessageSquareHeart } from 'lucide-react'

export interface SignOutFeedback {
    rating?: string
    note?: string
}

interface SignOutPromptModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirmSignOut: (feedback?: SignOutFeedback) => void
    isSigningOut?: boolean
}

const RATING_OPTIONS = [
    { value: 'excellent', label: 'Excellent', emoji: '🤩' },
    { value: 'good', label: 'Good', emoji: '😊' },
    { value: 'okay', label: 'Okay', emoji: '😐' },
    { value: 'needs_work', label: 'Needs work', emoji: '😕' },
]

export default function SignOutPromptModal({
    isOpen,
    onClose,
    onConfirmSignOut,
    isSigningOut = false,
}: SignOutPromptModalProps) {
    const [selectedRating, setSelectedRating] = useState<string | undefined>()
    const [note, setNote] = useState('')

    const handleConfirm = () => {
        onConfirmSignOut({
            rating: selectedRating,
            note: note.trim() || undefined,
        })
    }

    const handleRatingClick = (val: string) => {
        setSelectedRating((prev) => (prev === val ? undefined : val))
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isSigningOut && onClose()}>
            <DialogContent className="sm:max-w-md p-6 gap-5 bg-card border-border">
                <DialogHeader className="gap-2 sm:text-left">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
                            <LogOut className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                Are you sure you want to sign out?
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                You can sign back in anytime to access your feed, messages, and wallet.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Optional Experience Feedback Question */}
                <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <MessageSquareHeart className="w-3.5 h-3.5 text-primary" />
                            How was your experience today?
                        </label>
                        <span className="text-[11px] text-muted-foreground font-medium">
                            Optional
                        </span>
                    </div>

                    {/* Quick Sentiment Options */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {RATING_OPTIONS.map((option) => {
                            const isSelected = selectedRating === option.value
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleRatingClick(option.value)}
                                    className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                                        isSelected
                                            ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                                            : 'border-border/80 bg-background hover:bg-muted text-foreground'
                                    }`}
                                >
                                    <span className="text-base mb-0.5">{option.emoji}</span>
                                    <span className="text-[11px] leading-tight truncate">
                                        {option.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Optional Note */}
                    <div className="space-y-1 pt-1">
                        <Textarea
                            placeholder="Any suggestions or thoughts before you leave? (Optional)"
                            value={note}
                            onChange={(e) => setNote(e.target.value.slice(0, 200))}
                            rows={2}
                            maxLength={200}
                            className="resize-none text-xs bg-background h-16"
                        />
                        {note.length > 0 && (
                            <div className="flex justify-end">
                                <span className="text-[10px] text-muted-foreground">
                                    {note.length}/200
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSigningOut}
                        className="h-10 px-4 text-xs font-medium"
                    >
                        Stay signed in
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isSigningOut}
                        className="h-10 px-4 text-xs font-medium gap-1.5"
                    >
                        {isSigningOut ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Signing out…
                            </>
                        ) : (
                            <>
                                <LogOut className="w-3.5 h-3.5" />
                                Sign out
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
