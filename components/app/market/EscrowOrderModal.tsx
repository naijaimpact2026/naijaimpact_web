'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, ShoppingCart, Shield, MapPin, Truck, Package } from 'lucide-react'
import { createEscrowOrder } from '@/lib/actions/marketplace'
import type { NmListingDetail, NmDeliveryOption } from '@/lib/types'
import Script from 'next/script'

interface Props
{
    open: boolean
    onOpenChange: (v: boolean) => void
    listing: NmListingDetail
    userEmail: string
    userId: string
}

function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

const DELIVERY_LABELS: Record<NmDeliveryOption, string> = {
    pickup: 'Pickup',
    local_delivery: 'Local Delivery',
    nationwide: 'Nationwide',
    none: 'No Delivery',
}

export default function EscrowOrderModal({ open, onOpenChange, listing, userEmail, userId }: Props)
{
    const router = useRouter()
    const [qty, setQty] = useState(1)
    const [deliveryOption, setDeliveryOption] = useState<NmDeliveryOption>(
        listing.delivery_option !== 'none' ? listing.delivery_option : 'pickup'
    )
    const [address, setAddress] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const unitPrice = listing.price
    const deliveryFee = deliveryOption === 'pickup' ? 0 : (listing.delivery_fee ?? 0)
    const total = unitPrice * qty + deliveryFee

    const availableOptions: NmDeliveryOption[] = listing.delivery_option === 'none'
        ? ['pickup']
        : [listing.delivery_option, ...(listing.delivery_option !== 'pickup' ? ['pickup' as NmDeliveryOption] : [])]

    async function handleOrder()
    {
        if ((deliveryOption === 'local_delivery' || deliveryOption === 'nationwide') && !address.trim())
        {
            toast.error('Please enter a delivery address')
            return
        }

        setLoading(true)
        try
        {
            // The RPC handles order + escrow creation + wallet debit atomically
            const { order_id } = await createEscrowOrder({
                listing_id: listing.id,
                quantity: qty,
                delivery_option: deliveryOption,
                delivery_address: address || undefined,
                notes: notes || undefined,
            })

            // After order is created, trigger Paystack for payment
            // (or if wallet has funds, could debit directly via RPC — depends on flow)
            const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? ''
            if (!paystackKey)
            {
                toast.success('Order placed! Check My Orders for details.')
                onOpenChange(false)
                router.push('/app/market/orders')
                return
            }

            const paystackRef = `nm_${order_id.slice(0, 8)}_${Date.now()}`
            const handler = (window as any).PaystackPop?.setup({
                key: paystackKey,
                email: userEmail,
                amount: total * 100,
                currency: 'NGN',
                ref: paystackRef,
                metadata: {
                    type: 'marketplace_purchase',
                    userId,
                    referenceId: order_id,
                },
                onClose: () =>
                {
                    setLoading(false)
                    toast.info('Payment cancelled. Order is pending')
                },
                callback: () =>
                {
                    setLoading(false)
                    onOpenChange(false)
                    toast.success('Payment confirmed! Order placed in escrow.')
                    router.push('/app/market/orders')
                },
            })

            if (handler)
            {
                handler.openIframe()
            } else
            {
                // Paystack not loaded — still show success
                setLoading(false)
                onOpenChange(false)
                toast.success('Order created! Complete payment in My Orders.')
                router.push('/app/market/orders')
            }
        } catch (err)
        {
            setLoading(false)
            toast.error(err instanceof Error ? err.message : 'Failed to create order')
        }
    }

    if (!open) return null

    return (
        <>
            <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
                onClick={() => !loading && onOpenChange(false)}>
                <div className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl"
                    onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                                <ShoppingCart className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                                <h2 className="font-display font-black text-foreground">Place Order</h2>
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Shield className="h-3 w-3" /> Escrow protected
                                </p>
                            </div>
                        </div>
                        <button onClick={() => !loading && onOpenChange(false)}
                            className="rounded-xl p-2 transition-colors hover:bg-muted">
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="space-y-4 px-6 py-5">
                        {/* Product summary */}
                        <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                                {listing.cover_image_url
                                    ? <img src={listing.cover_image_url} alt="" className="h-full w-full object-cover" />
                                    : <div className="flex h-full w-full items-center justify-center"><Package className="h-6 w-6 text-muted-foreground/40" /></div>}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-foreground">{listing.title}</p>
                                <p className="text-xs text-muted-foreground">by {listing.seller_business_name ?? listing.seller_fullname ?? 'Seller'}</p>
                                <p className="mt-0.5 text-sm font-black text-foreground">{fmt(unitPrice)} each</p>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-foreground">Quantity</label>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg font-bold text-foreground transition-colors hover:bg-muted/70">
                                    −
                                </button>
                                <span className="w-10 text-center text-lg font-bold text-foreground">{qty}</span>
                                <button onClick={() => setQty(q => Math.min(listing.stock, q + 1))}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg font-bold text-foreground transition-colors hover:bg-muted/70">
                                    +
                                </button>
                                <span className="ml-2 text-xs text-muted-foreground">{listing.stock} available</span>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-foreground">Delivery</label>
                            <div className="grid grid-cols-2 gap-2">
                                {availableOptions.map(opt => (
                                    <button key={opt}
                                        onClick={() => setDeliveryOption(opt)}
                                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-bold transition-all ${deliveryOption === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                                        {opt === 'pickup' ? <Package className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                                        {DELIVERY_LABELS[opt]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Address */}
                        {(deliveryOption === 'local_delivery' || deliveryOption === 'nationwide') && (
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                                    Delivery Address <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        placeholder="Full delivery address"
                                        rows={2}
                                        className="w-full resize-none rounded-2xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-foreground">Order Notes (optional)</label>
                            <input
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Any special instructions for the seller"
                                className="w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        {/* Escrow note */}
                        <div className="flex items-start gap-2 rounded-2xl bg-primary/5 p-3">
                            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <p className="text-xs text-primary">
                                Your payment is held in <strong>escrow</strong>. Funds are only released to the seller after you confirm receipt.
                            </p>
                        </div>

                        {/* Total + CTA */}
                        <div className="border-t border-border pt-2">
                            <div className="mb-4 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{qty} × {fmt(unitPrice)}</span>
                                    <span className="font-semibold text-foreground">{fmt(unitPrice * qty)}</span>
                                </div>
                                {deliveryFee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Delivery fee</span>
                                        <span className="font-semibold text-foreground">{fmt(deliveryFee)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-black text-foreground">
                                    <span>Total</span>
                                    <span className="text-xl">{fmt(total)}</span>
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                onClick={handleOrder}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60">
                                {loading
                                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Placing Order…</>
                                    : <><ShoppingCart className="h-4 w-4" /> Pay {fmt(total)} securely</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
