'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CreditCard, Loader2, MapPin, Minus, Package, Plus, ShoppingBag, Truck, Wallet, X } from 'lucide-react'
import { toast } from '@/components/toast'
import { getViewerWalletBalance } from '@/lib/actions/creator-earnings'
import { purchasePinnedProduct } from '@/lib/actions/live-shopping'
import type { PinnedProduct } from '@/lib/types'

interface LiveProductBuyModalProps {
    isOpen: boolean
    onClose: () => void
    liveStreamId: string
    product: PinnedProduct
    viewerLoggedIn: boolean
    onSuccess?: () => void
}

export default function LiveProductBuyModal({
    isOpen,
    onClose,
    liveStreamId,
    product,
    viewerLoggedIn,
    onSuccess,
}: LiveProductBuyModalProps) {
    const router = useRouter()
    const [quantity, setQuantity] = useState(1)
    const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery' | 'digital'>('pickup')
    const [deliveryAddress, setDeliveryAddress] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'paystack'>('wallet')
    const [walletBalance, setWalletBalance] = useState(0)
    const [loading, setLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const unitPrice = Number(product.price ?? 0)
    const totalAmount = unitPrice * quantity
    const hasEnoughWalletBalance = walletBalance >= totalAmount

    useEffect(() => {
        if (!isOpen) return
        setErrorMsg(null)
        setIsSuccess(false)
        if (viewerLoggedIn) {
            getViewerWalletBalance().then((bal) => {
                setWalletBalance(bal)
                if (bal >= totalAmount) {
                    setPaymentMethod('wallet')
                } else {
                    setPaymentMethod('paystack')
                }
            })
        }
    }, [isOpen, viewerLoggedIn, totalAmount])

    if (!isOpen) return null

    const handleCompletePurchase = async (paystackRef?: string) => {
        setLoading(true)
        setErrorMsg(null)
        try {
            const res = await purchasePinnedProduct({
                liveStreamId,
                productId: product.id,
                quantity,
                deliveryOption,
                deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress.trim() : undefined,
                paymentMethod: paystackRef ? 'paystack' : paymentMethod,
                paystackReference: paystackRef,
            })

            if (!res.success) {
                setErrorMsg(res.error || 'Failed to complete order.')
                setLoading(false)
                return
            }

            setIsSuccess(true)
            toast.success(`Ordered ${product.title} live!`)
            if (onSuccess) onSuccess()
            setTimeout(() => {
                onClose()
            }, 2000)
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.')
        } finally {
            setLoading(false)
        }
    }

    const handlePaystackCheckout = () => {
        const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
        if (!paystackKey) {
            setErrorMsg('Paystack configuration error. Please try paying with wallet.')
            return
        }
        if (typeof window === 'undefined' || !(window as any).PaystackPop) {
            setErrorMsg('Payment gateway is loading. Please retry in a few moments.')
            return
        }

        const ref = `SHOP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

        setLoading(true)
        const handler = (window as any).PaystackPop.setup({
            key: paystackKey,
            email: 'shopper@hubnovo.com',
            amount: Math.round(totalAmount * 100), // in kobo
            ref,
            metadata: {
                type: 'stream_shopping_order',
                live_stream_id: liveStreamId,
                product_id: product.id,
                title: product.title,
                quantity,
            },
            onSuccess: async (tx: any) => {
                await handleCompletePurchase(tx.reference || ref)
            },
            onClose: () => {
                setLoading(false)
            },
        })

        handler.openIframe()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg(null)

        if (!viewerLoggedIn) {
            router.push(`/auth/signin?redirect=/app/modushive/live/${liveStreamId}`)
            return
        }

        if (deliveryOption === 'delivery' && !deliveryAddress.trim()) {
            setErrorMsg('Please enter a delivery address for physical shipment.')
            return
        }

        if (paymentMethod === 'wallet') {
            if (!hasEnoughWalletBalance) {
                setErrorMsg(`Insufficient wallet balance (₦${walletBalance.toLocaleString('en-NG')}). Please pay with card or top up.`)
                return
            }
            await handleCompletePurchase()
        } else {
            handlePaystackCheckout()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50 duration-200">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-card p-5 sm:p-6 shadow-2xl backdrop-blur-2xl">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center gap-3 animate-in zoom-in-95 duration-200">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Order Placed Live!</h3>
                        <p className="text-xs text-muted-foreground max-w-xs">
                            Your order for <strong>{product.title}</strong> has been confirmed. The streamer has been notified.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">In-Stream Order</h3>
                                <p className="text-xs text-muted-foreground">Buy directly without interrupting the stream</p>
                            </div>
                        </div>

                        {/* Product Card */}
                        <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/40 p-3">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-background">
                                {product.cover_image_url ? (
                                    <Image
                                        src={product.cover_image_url}
                                        alt={product.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                ) : (
                                    <Package className="h-6 w-6 m-auto text-muted-foreground" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-foreground">{product.title}</p>
                                <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                                    ₦{unitPrice.toLocaleString('en-NG')}
                                </p>
                                {product.seller_name && (
                                    <p className="text-[10px] text-muted-foreground">Sold by {product.seller_name}</p>
                                )}
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-3.5 py-2">
                            <span className="text-xs font-semibold text-foreground">Quantity</span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground hover:bg-muted"
                                >
                                    <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-bold text-foreground w-4 text-center">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground hover:bg-muted"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                        </div>

                        {/* Delivery Option */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Delivery method
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeliveryOption('pickup')}
                                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all ${
                                        deliveryOption === 'pickup'
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>Pickup / Store</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeliveryOption('delivery')}
                                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all ${
                                        deliveryOption === 'delivery'
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    <Truck className="h-3.5 w-3.5" />
                                    <span>Dispatch Delivery</span>
                                </button>
                            </div>
                        </div>

                        {/* Delivery Address Input */}
                        {deliveryOption === 'delivery' && (
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-foreground">Delivery address</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter street address, city, state"
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        )}

                        {/* Payment Method Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Payment rail
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`flex flex-col items-start rounded-xl border p-2.5 text-xs transition-all ${
                                        paymentMethod === 'wallet'
                                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Wallet className="h-3.5 w-3.5" />
                                        <span>Wallet</span>
                                    </div>
                                    <span className="text-[10px] font-normal mt-0.5 text-muted-foreground">
                                        Bal: ₦{walletBalance.toLocaleString('en-NG')}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('paystack')}
                                    className={`flex flex-col items-start rounded-xl border p-2.5 text-xs transition-all ${
                                        paymentMethod === 'paystack'
                                            ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        <span>Paystack</span>
                                    </div>
                                    <span className="text-[10px] font-normal mt-0.5 text-muted-foreground">
                                        Card / Bank
                                    </span>
                                </button>
                            </div>
                        </div>

                        {errorMsg && (
                            <p className="rounded-lg bg-destructive/10 p-2 text-center text-xs font-semibold text-destructive">
                                {errorMsg}
                            </p>
                        )}

                        {/* Total & Checkout CTA */}
                        <div className="pt-2 border-t border-border/60">
                            <div className="flex items-center justify-between pb-2 text-xs">
                                <span className="font-semibold text-muted-foreground">Total:</span>
                                <span className="text-base font-extrabold text-foreground">
                                    ₦{totalAmount.toLocaleString('en-NG')}
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-2.5 text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Processing Order...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="h-4 w-4" />
                                        <span>Buy Now (₦{totalAmount.toLocaleString('en-NG')})</span>
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
