'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
    BadgeCheck, 
    CheckCircle2, 
    CreditCard, 
    GraduationCap, 
    Loader2, 
    Lock, 
    Radio, 
    Sparkles, 
    Ticket, 
    Wallet 
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/toast'
import { getViewerWalletBalance, purchaseStreamTicket } from '@/lib/actions/creator-earnings'

interface WorkshopTicketGateProps {
    liveStreamId: string
    title: string
    description?: string | null
    ticketPrice: number
    workshopTopics?: string[]
    creatorName: string
    creatorAvatar?: string
    isLive: boolean
    viewerLoggedIn: boolean
    viewerWalletBalance?: number
    onUnlocked?: () => void
}

export default function WorkshopTicketGate({
    liveStreamId,
    title,
    description,
    ticketPrice,
    workshopTopics = [],
    creatorName,
    creatorAvatar,
    isLive,
    viewerLoggedIn,
    viewerWalletBalance: initialWalletBalance = 0,
    onUnlocked,
}: WorkshopTicketGateProps) {
    const router = useRouter()
    const [walletBalance, setWalletBalance] = useState<number>(initialWalletBalance)
    const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'paystack'>(
        initialWalletBalance >= ticketPrice ? 'wallet' : 'paystack'
    )
    const [isPurchasing, setIsPurchasing] = useState(false)
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        if (viewerLoggedIn) {
            getViewerWalletBalance().then((bal) => {
                setWalletBalance(bal)
                if (bal >= ticketPrice) {
                    setSelectedMethod('wallet')
                } else {
                    setSelectedMethod('paystack')
                }
            })
        }
    }, [viewerLoggedIn, ticketPrice])

    const hasEnoughBalance = walletBalance >= ticketPrice

    const handleConfirmPurchase = async (paystackRef?: string) => {
        setIsPurchasing(true)
        setErrorMsg(null)
        try {
            const res = await purchaseStreamTicket({
                liveStreamId,
                paymentMethod: paystackRef ? 'paystack' : selectedMethod,
                paystackReference: paystackRef,
            })

            if (!res.success) {
                setErrorMsg(res.error || 'Ticket purchase could not be completed.')
                setIsPurchasing(false)
                return
            }

            toast.success('Ticket confirmed! Unlocking live workshop access.')
            setIsUnlocked(true)
            if (onUnlocked) onUnlocked()
            setTimeout(() => {
                router.refresh()
            }, 1200)
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.')
            setIsPurchasing(false)
        }
    }

    const handlePaystackCheckout = () => {
        const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
        if (!paystackKey) {
            setErrorMsg('Paystack configuration error. Please try paying with wallet.')
            return
        }
        if (typeof window === 'undefined' || !(window as any).PaystackPop) {
            setErrorMsg('Payment gateway is still loading. Please retry in a few moments.')
            return
        }

        const ref = `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

        setIsPurchasing(true)
        const handler = (window as any).PaystackPop.setup({
            key: paystackKey,
            email: 'attendee@hubnovo.com',
            amount: Math.round(ticketPrice * 100), // in kobo
            ref,
            metadata: {
                type: 'stream_ticket',
                live_stream_id: liveStreamId,
                title,
            },
            onSuccess: async (tx: any) => {
                await handleConfirmPurchase(tx.reference || ref)
            },
            onClose: () => {
                setIsPurchasing(false)
            },
        })

        handler.openIframe()
    }

    const handleAction = () => {
        if (!viewerLoggedIn) {
            router.push(`/auth/signin?redirect=/app/modushive/live/${liveStreamId}`)
            return
        }

        if (selectedMethod === 'wallet') {
            if (!hasEnoughBalance) {
                setErrorMsg('Insufficient Hubnovo Wallet balance. Please choose card payment or top up.')
                return
            }
            handleConfirmPurchase()
        } else {
            handlePaystackCheckout()
        }
    }

    if (isUnlocked) {
        return (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center animate-in zoom-in-95 duration-300">
                <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Ticket Verified & Activated!</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                    Connecting to your masterclass stream and live interactive chat...
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500 mt-2" />
            </div>
        )
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-card via-card/95 to-background shadow-xl p-5 sm:p-7 md:p-8">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative space-y-6">
                {/* Header Badge & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <Ticket className="h-3.5 w-3.5" /> Ticketed Workshop
                        </span>
                        {isLive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive border border-destructive/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                <Radio className="h-3 w-3 animate-pulse" /> Live Now
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border border-border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                Scheduled Class
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                        <span>Private broadcast gated for ticket holders</span>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                    {/* Left: Workshop Details & Syllabus */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                                {title}
                            </h2>
                            {description && (
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Instructor Info */}
                        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-3">
                            <Avatar className="h-10 w-10 ring-1 ring-border">
                                <AvatarImage src={creatorAvatar} />
                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                    {creatorName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                                    Instructor / Host
                                </p>
                                <p className="text-sm font-bold text-foreground flex items-center gap-1">
                                    {creatorName}
                                    <BadgeCheck className="h-4 w-4 text-primary" />
                                </p>
                            </div>
                        </div>

                        {/* Topics / Syllabus */}
                        {workshopTopics.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                                    What You&apos;ll Learn & Topics Covered
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {workshopTopics.map((topic, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* What&apos;s Included */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-2.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Full Live Stream & HD Audio</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-2.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Interactive Q&A Live Chat</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-2.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Unlimited Replay Access</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Checkout & Ticket Purchase Card */}
                    <div className="rounded-2xl border border-amber-500/30 bg-card/90 p-5 shadow-lg space-y-4">
                        <div className="text-center pb-3 border-b border-border/60">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Workshop Admission
                            </span>
                            <div className="mt-1 flex items-baseline justify-center gap-1">
                                <span className="text-3xl font-extrabold text-foreground tracking-tight">
                                    ₦{ticketPrice.toLocaleString('en-NG')}
                                </span>
                                <span className="text-xs text-muted-foreground font-semibold">/ pass</span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        {viewerLoggedIn && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Payment Method
                                </label>
                                <div className="space-y-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMethod('wallet')}
                                        className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all ${
                                            selectedMethod === 'wallet'
                                                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                                                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Wallet className="h-4 w-4" />
                                            <span>Hubnovo Wallet (1-Tap)</span>
                                        </div>
                                        <span className="font-semibold text-[11px]">
                                            ₦{walletBalance.toLocaleString('en-NG')}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedMethod('paystack')}
                                        className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all ${
                                            selectedMethod === 'paystack'
                                                ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                                                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            <span>Paystack Card / Transfer</span>
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                                            Instant
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {errorMsg && (
                            <p className="rounded-lg bg-destructive/10 p-2 text-center text-xs font-semibold text-destructive">
                                {errorMsg}
                            </p>
                        )}

                        <button
                            type="button"
                            disabled={isPurchasing}
                            onClick={handleAction}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isPurchasing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Processing Ticket...</span>
                                </>
                            ) : !viewerLoggedIn ? (
                                <>
                                    <Lock className="h-4 w-4" />
                                    <span>Sign In to Buy Ticket</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    <span>Unlock Workshop (₦{ticketPrice.toLocaleString('en-NG')})</span>
                                </>
                            )}
                        </button>

                        <p className="text-[10px] text-center text-muted-foreground leading-normal">
                            90% of admission fees directly support the creator. Immediate verified pass access.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
