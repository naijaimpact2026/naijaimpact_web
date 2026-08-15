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
                    toast.info('Payment cancelled — order is pending')
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
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
                onClick={() => !loading && onOpenChange(false)}>
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                <ShoppingCart className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h2 className="font-black text-gray-900">Place Order</h2>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Escrow protected
                                </p>
                            </div>
                        </div>
                        <button onClick={() => !loading && onOpenChange(false)}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        {/* Product summary */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                                {listing.cover_image_url
                                    ? <img src={listing.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
                                <p className="text-xs text-gray-500">by {listing.seller_business_name ?? listing.seller_fullname ?? 'Seller'}</p>
                                <p className="text-sm font-black text-gray-900 mt-0.5">{fmt(unitPrice)} each</p>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="text-sm font-semibold text-gray-800 mb-2 block">Quantity</label>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-200 transition-colors text-lg">
                                    −
                                </button>
                                <span className="w-10 text-center font-bold text-gray-900 text-lg">{qty}</span>
                                <button onClick={() => setQty(q => Math.min(listing.stock, q + 1))}
                                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-200 transition-colors text-lg">
                                    +
                                </button>
                                <span className="text-xs text-gray-400 ml-2">{listing.stock} available</span>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div>
                            <label className="text-sm font-semibold text-gray-800 mb-2 block">Delivery</label>
                            <div className="grid grid-cols-2 gap-2">
                                {availableOptions.map(opt => (
                                    <button key={opt}
                                        onClick={() => setDeliveryOption(opt)}
                                        className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all ${deliveryOption === opt ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                                        {opt === 'pickup' ? <Package className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                                        {DELIVERY_LABELS[opt]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Address */}
                        {(deliveryOption === 'local_delivery' || deliveryOption === 'nationwide') && (
                            <div>
                                <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                    Delivery Address <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                                    <textarea
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        placeholder="Full delivery address…"
                                        rows={2}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Order Notes (optional)</label>
                            <input
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Any special instructions for the seller…"
                                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none"
                            />
                        </div>

                        {/* Escrow note */}
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-2xl">
                            <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700">
                                Your payment is held in <strong>escrow</strong>. Funds are only released to the seller after you confirm receipt.
                            </p>
                        </div>

                        {/* Total + CTA */}
                        <div className="pt-2 border-t border-gray-100">
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{qty} × {fmt(unitPrice)}</span>
                                    <span className="font-semibold">{fmt(unitPrice * qty)}</span>
                                </div>
                                {deliveryFee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Delivery fee</span>
                                        <span className="font-semibold">{fmt(deliveryFee)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-black text-gray-900">
                                    <span>Total</span>
                                    <span className="text-xl">{fmt(total)}</span>
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                onClick={handleOrder}
                                className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                {loading
                                    ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Placing Order…</>
                                    : <><ShoppingCart className="w-4 h-4" /> Pay {fmt(total)} — Escrow</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
