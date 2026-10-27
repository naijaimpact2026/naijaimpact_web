'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    CheckCircle2,
    Coins,
    Crown,
    GraduationCap,
    Loader2,
    Radio,
    ShieldCheck,
    Sparkles,
    X,
    Zap,
} from 'lucide-react'
import { becomeCreatorAction } from '@/lib/actions/creator-earnings'
import { toast } from '@/components/toast'

interface BecomeCreatorModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export default function BecomeCreatorModal({
    isOpen,
    onClose,
    onSuccess,
}: BecomeCreatorModalProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    if (!isOpen) return null

    const handleActivate = async () => {
        setIsSubmitting(true)
        try {
            const res = await becomeCreatorAction()
            if (!res.success) {
                toast.error(res.error || 'Failed to activate creator account.')
                setIsSubmitting(false)
                return
            }

            setIsSuccess(true)
            toast.success('🎉 Congratulations! You are now a NovoStream Creator.')

            setTimeout(() => {
                if (onSuccess) {
                    onSuccess()
                } else {
                    router.refresh()
                    onClose()
                }
            }, 1200)
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-2xl space-y-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    aria-label="Close modal"
                    className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                {isSuccess ? (
                    <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-500 shadow-inner">
                            <CheckCircle2 className="h-8 w-8 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-display text-xl font-black text-foreground">
                                Welcome to NovoStream Creators!
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Your creator suite has been unlocked. Loading your studio and earnings dashboard...
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header with Glowing Badge */}
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
                                <Crown className="h-3.5 w-3.5" />
                                <span>Day-One Creator Program</span>
                            </div>
                            <h2 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                Unlock the NovoStream Creator Suite
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Start broadcasting live, connect with your community, and earn on Day 1 with zero barrier hurdles.
                            </p>
                        </div>

                        {/* Value Pillars Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-border/70 bg-muted/40 p-3.5 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                                        <Radio className="h-4 w-4" />
                                    </span>
                                    <h4 className="text-xs font-bold text-foreground">Live Streaming Studio</h4>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-normal">
                                    Go live directly from your web browser or OBS with low latency.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border/70 bg-muted/40 p-3.5 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                                        <Coins className="h-4 w-4" />
                                    </span>
                                    <h4 className="text-xs font-bold text-foreground">Live Tips & Fan Gifts</h4>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-normal">
                                    Receive gold tips and celebratory badges. Keep 90% direct to wallet.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border/70 bg-muted/40 p-3.5 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-500">
                                        <GraduationCap className="h-4 w-4" />
                                    </span>
                                    <h4 className="text-xs font-bold text-foreground">Workshops & Classes</h4>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-normal">
                                    Host ticketed mini-classes for 10 to 50 eager learners.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border/70 bg-muted/40 p-3.5 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                                        <Zap className="h-4 w-4" />
                                    </span>
                                    <h4 className="text-xs font-bold text-foreground">Instant Withdrawals</h4>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-normal">
                                    Zero withdrawal threshold. Transfer directly to Nigerian bank accounts.
                                </p>
                            </div>
                        </div>

                        {/* Transparency Pledge */}
                        <div className="flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                            <p className="leading-snug">
                                <span className="font-bold text-foreground">Fair & Transparent:</span>{' '}
                                No monthly fees or eligibility waitlists. Hubnovo takes a 10% platform fee on tips; 90% goes straight to you.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={handleActivate}
                                disabled={isSubmitting}
                                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Activating Creator Account...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        <span>Activate Creator Account</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto rounded-2xl border border-border/80 px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
