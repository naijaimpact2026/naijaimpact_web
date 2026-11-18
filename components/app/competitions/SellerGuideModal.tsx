'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    BookOpen,
    Camera,
    CheckCircle2,
    Hand,
    HeartHandshake,
    Loader2,
    ShieldCheck,
    Sparkles,
    Star,
    Tag,
    Zap,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/toast'
import { checkInMission } from '@/lib/actions/competitions'

interface SellerGuideModalProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    missionId?: string
    isCompleted?: boolean
    themeColor?: string
}

export default function SellerGuideModal({
    open,
    onOpenChange,
    missionId,
    isCompleted = false,
    themeColor = '#F59E0B',
}: SellerGuideModalProps)
{
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    function handleClaim()
    {
        if (!missionId) return
        startTransition(async () =>
        {
            const res = await checkInMission(missionId)
            if (!res.ok)
            {
                toast.error(res.error)
                return
            }
            toast.success(res.xp > 0 ? `+${res.xp} XP earned!` : 'Already completed.')
            onOpenChange(false)
            router.refresh()
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl">
                {/* Header */}
                <DialogHeader className="shrink-0 border-b border-border bg-card/60 p-5 sm:p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm text-white"
                            style={{ backgroundColor: themeColor }}
                        >
                            <BookOpen className="h-6 w-6" />
                        </span>
                        <div>
                            <DialogTitle className="text-lg sm:text-xl font-black text-foreground">
                                Hubnovo Seller Playbook
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Masterclasses on photographing, pricing, and winning customer trust across Nigeria.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
                    {/* Tip 1: Product Photography */}
                    <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                <Camera className="h-4 w-4" />
                            </span>
                            <h3 className="text-sm font-bold text-foreground">
                                1. Eye-Catching Smartphone Photos
                            </h3>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1.5 pl-2 leading-relaxed">
                            <li>• <strong>Natural Day Light</strong>: Shoot near a window or outdoors in early morning or late afternoon to avoid harsh shadows.</li>
                            <li>• <strong>Plain Neutral Background</strong>: Use a clean white, neutral, or wood table backdrop so your item is the sole focus.</li>
                            <li>• <strong>Multiple Perspectives</strong>: Upload at least 3 photos — front, side/details, and scale (e.g. holding or wearing the item).</li>
                        </ul>
                    </div>

                    {/* Tip 2: Pricing & Honest Descriptions */}
                    <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <Tag className="h-4 w-4" />
                            </span>
                            <h3 className="text-sm font-bold text-foreground">
                                2. Clear Descriptions & Transparent Pricing
                            </h3>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1.5 pl-2 leading-relaxed">
                            <li>• <strong>Accurate Condition</strong>: Explicitly state if an item is Brand New, Open Box, or UK/US Used.</li>
                            <li>• <strong>Key Specs First</strong>: Include sizes, dimensions, storage capacity, and power ratings in bullet points.</li>
                            <li>• <strong>Realistic Delivery Estimates</strong>: State estimated arrival days for intra-state (Lagos/Abuja) and nationwide dispatch.</li>
                        </ul>
                    </div>

                    {/* Tip 3: Escrow & Safe Delivery */}
                    <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                                <ShieldCheck className="h-4 w-4" />
                            </span>
                            <h3 className="text-sm font-bold text-foreground">
                                3. Safe Escrow Protection
                            </h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-2">
                            Hubnovo Escrow secures the buyer’s payment into an encrypted wallet holding balance before you package your item. Once your dispatch partner delivers the item and the customer confirms, funds are instantly released directly to your Hubnovo wallet.
                        </p>
                    </div>

                    {/* Tip 4: 5-Star Reviews & Fast Response */}
                    <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                <Star className="h-4 w-4" />
                            </span>
                            <h3 className="text-sm font-bold text-foreground">
                                4. Winning 5-Star Reviews
                            </h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-2">
                            Sellers who respond in chat within 15 minutes achieve 3x more order conversions. After delivering an order, politely message your customer to ensure they are satisfied and encourage them to leave a 5-star rating on your storefront.
                        </p>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="shrink-0 border-t border-border bg-card/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span>Completion rewards <strong className="text-amber-500">+20 XP</strong> toward your competition rank</span>
                    </div>

                    {isCompleted ? (
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Guide Completed</span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleClaim}
                            disabled={pending || !missionId}
                            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-50"
                            style={{ backgroundColor: themeColor }}
                        >
                            {pending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Hand className="h-4 w-4" />
                            )}
                            <span>I’ve read this guide · Claim +20 XP</span>
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

