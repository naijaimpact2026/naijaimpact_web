'use client'

import React, { useEffect, useState } from 'react'
import {
    AlertCircle,
    CheckCircle2,
    Coins,
    Crown,
    Flame,
    Heart,
    Loader2,
    Rocket,
    ShieldCheck,
    Sparkles,
    Star,
    Wallet,
    X,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getViewerWalletBalance, sendLiveStreamTip } from '@/lib/actions/creator-earnings'

interface LiveTipModalProps {
    isOpen: boolean
    onClose: () => void
    liveStreamId: string
    creatorId: string
    creatorName: string
    creatorAvatar?: string
    onTipSuccess?: (tip: {
        amount: number
        netAmount: number
        giftBadge: string
        senderName: string
        message?: string
    }) => void
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000]

const GIFT_BADGES = [
    { id: 'Golden Star', label: 'Star', icon: Star, color: 'text-amber-400 bg-amber-400/15 border-amber-400/30' },
    { id: 'Super Rocket', label: 'Rocket', icon: Rocket, color: 'text-rose-500 bg-rose-500/15 border-rose-500/30' },
    { id: 'Royal Crown', label: 'Crown', icon: Crown, color: 'text-purple-500 bg-purple-500/15 border-purple-500/30' },
    { id: 'Fire Booster', label: 'Fire', icon: Flame, color: 'text-orange-500 bg-orange-500/15 border-orange-500/30' },
    { id: 'Heart Love', label: 'Heart', icon: Heart, color: 'text-pink-500 bg-pink-500/15 border-pink-500/30' },
]

function formatNaira(amount: number) {
    return `₦${amount.toLocaleString('en-NG')}`
}

export default function LiveTipModal({
    isOpen,
    onClose,
    liveStreamId,
    creatorId,
    creatorName,
    creatorAvatar,
    onTipSuccess,
}: LiveTipModalProps) {
    const [amount, setAmount] = useState<number>(1000)
    const [customInput, setCustomInput] = useState<string>('')
    const [selectedBadge, setSelectedBadge] = useState<string>(GIFT_BADGES[0].id)
    const [cheerMessage, setCheerMessage] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'paystack'>('wallet')
    const [viewerWalletBalance, setViewerWalletBalance] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [successTip, setSuccessTip] = useState<{ amount: number; badge: string } | null>(null)

    // Load viewer wallet balance on open
    useEffect(() => {
        if (!isOpen) return
        setErrorMsg(null)
        setSuccessTip(null)
        getViewerWalletBalance().then((bal) => {
            setViewerWalletBalance(bal)
            // If wallet balance is insufficient, default to Paystack
            if (bal < 1000) {
                setPaymentMethod('paystack')
            } else {
                setPaymentMethod('wallet')
            }
        })
    }, [isOpen])

    if (!isOpen) return null

    const effectiveAmount = customInput ? Number(customInput) || 0 : amount
    const creatorNet = Math.round(effectiveAmount * 0.9)
    const hasEnoughWalletBalance = viewerWalletBalance >= effectiveAmount

    const handleSelectPreset = (val: number) => {
        setAmount(val)
        setCustomInput('')
        setErrorMsg(null)
    }

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomInput(e.target.value)
        setErrorMsg(null)
    }

    const handleCompleteTip = async (paystackRef?: string) => {
        setIsSubmitting(true)
        setErrorMsg(null)
        try {
            const res = await sendLiveStreamTip({
                liveStreamId,
                creatorId,
                amount: effectiveAmount,
                giftBadge: selectedBadge,
                message: cheerMessage.trim() || undefined,
                paymentMethod: paystackRef ? 'paystack' : paymentMethod,
                paystackReference: paystackRef,
            })

            if (!res.success || !res.tip) {
                setErrorMsg(res.error || 'Failed to send tip.')
                setIsSubmitting(false)
                return
            }

            setSuccessTip({
                amount: res.tip.amount,
                badge: res.tip.giftBadge,
            })

            if (onTipSuccess) {
                onTipSuccess(res.tip)
            }

            setTimeout(() => {
                onClose()
            }, 2500)
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg(null)

        if (effectiveAmount < 100) {
            setErrorMsg('Minimum tip amount is ₦100.')
            return
        }

        if (paymentMethod === 'wallet') {
            if (!hasEnoughWalletBalance) {
                setErrorMsg(`Insufficient wallet balance (${formatNaira(viewerWalletBalance)}). Please top up or pay with Paystack card.`)
                return
            }
            await handleCompleteTip()
        } else {
            // Paystack inline flow
            const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
            if (!paystackKey) {
                setErrorMsg('Paystack configuration error. Please try paying with wallet.')
                return
            }
            if (typeof window === 'undefined' || !(window as any).PaystackPop) {
                setErrorMsg('Payment gateway is loading. Please retry in a few moments.')
                return
            }

            const ref = `TIP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

            setIsSubmitting(true)
            const handler = (window as any).PaystackPop.setup({
                key: paystackKey,
                email: 'viewer@hubnovo.com',
                amount: Math.round(effectiveAmount * 100), // in kobo
                ref,
                metadata: {
                    type: 'stream_tip',
                    live_stream_id: liveStreamId,
                    creator_id: creatorId,
                    gift_badge: selectedBadge,
                },
                onSuccess: async (tx: any) => {
                    await handleCompleteTip(tx.reference || ref)
                },
                onClose: () => {
                    setIsSubmitting(false)
                },
            })

            handler.openIframe()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50 duration-200">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-card p-6 shadow-2xl backdrop-blur-2xl">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-5 top-5 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {successTip ? (
                    /* Celebratory Success View */
                    <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
                        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white shadow-xl shadow-amber-500/30 animate-bounce">
                            <Sparkles className="h-8 w-8" />
                        </span>
                        <div>
                            <h3 className="font-display text-xl font-bold text-foreground">
                                Tip Sent to {creatorName}!
                            </h3>
                            <p className="mt-1 text-sm font-semibold text-amber-500">
                                {formatNaira(successTip.amount)} • {successTip.badge}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Your tip was delivered and broadcast live in chat. The creator has received 90% net!
                        </p>
                    </div>
                ) : (
                    /* Tip Composer Form */
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Header with Creator Info */}
                        <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                            <Avatar className="h-11 w-11 ring-2 ring-amber-400/50">
                                <AvatarImage src={creatorAvatar} />
                                <AvatarFallback className="bg-amber-500/20 text-amber-600 font-bold">
                                    {(creatorName || 'C').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-display text-sm font-bold text-foreground">
                                        Tip {creatorName}
                                    </h3>
                                    <span className="rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-bold text-amber-500">
                                        Day-1 Fan Gift
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Send live appreciation and unlock in-stream highlights
                                </p>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Amount Presets */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Choose Tip Amount
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {PRESET_AMOUNTS.map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => handleSelectPreset(val)}
                                        className={`rounded-2xl border py-2 text-xs font-extrabold transition-all ${
                                            !customInput && amount === val
                                                ? 'border-amber-500 bg-amber-500/20 text-amber-500 shadow-xs'
                                                : 'border-border/70 bg-card hover:bg-muted text-foreground'
                                        }`}
                                    >
                                        {formatNaira(val)}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Amount input */}
                            <div className="relative pt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                    ₦
                                </span>
                                <input
                                    type="number"
                                    min="100"
                                    step="50"
                                    value={customInput}
                                    onChange={handleCustomChange}
                                    placeholder="Or enter custom amount (min ₦100)"
                                    className="w-full rounded-2xl border border-border/70 bg-muted/40 pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        {/* Gift Badge Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Select Animated Fan Badge
                            </label>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                {GIFT_BADGES.map((badge) => {
                                    const Icon = badge.icon
                                    const isSelected = selectedBadge === badge.id
                                    return (
                                        <button
                                            key={badge.id}
                                            type="button"
                                            onClick={() => setSelectedBadge(badge.id)}
                                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                                                isSelected
                                                    ? 'border-amber-500 bg-amber-500/20 text-amber-500 ring-2 ring-amber-500/20'
                                                    : 'border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60'
                                            }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            <span>{badge.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Cheer Message (Optional) */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Cheer Message <span className="text-[10px] lowercase font-normal">(optional)</span>
                            </label>
                            <input
                                type="text"
                                maxLength={120}
                                value={cheerMessage}
                                onChange={(e) => setCheerMessage(e.target.value)}
                                placeholder="Say something nice to the creator..."
                                className="w-full rounded-2xl border border-border/70 bg-muted/40 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-1.5 pt-1">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Payment Source
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`flex items-center gap-2 rounded-2xl border p-2.5 text-left transition-all ${
                                        paymentMethod === 'wallet'
                                            ? 'border-amber-500 bg-amber-500/10'
                                            : 'border-border/70 bg-card hover:bg-muted/40'
                                    }`}
                                >
                                    <Wallet className="h-4 w-4 text-amber-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground">Hubnovo Wallet</p>
                                        <p className="text-[10px] text-muted-foreground truncate">
                                            Balance: {formatNaira(viewerWalletBalance)}
                                        </p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('paystack')}
                                    className={`flex items-center gap-2 rounded-2xl border p-2.5 text-left transition-all ${
                                        paymentMethod === 'paystack'
                                            ? 'border-amber-500 bg-amber-500/10'
                                            : 'border-border/70 bg-card hover:bg-muted/40'
                                    }`}
                                >
                                    <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground">Card / Paystack</p>
                                        <p className="text-[10px] text-muted-foreground truncate">
                                            Debit Card & USSD
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Value transparency pill */}
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
                            <span>Creator net pass-through (90%):</span>
                            <strong className="text-amber-500 font-extrabold font-display">
                                {formatNaira(creatorNet)}
                            </strong>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={effectiveAmount < 100 || isSubmitting}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Processing Tip...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        <span>Send {formatNaira(effectiveAmount)} Tip</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
