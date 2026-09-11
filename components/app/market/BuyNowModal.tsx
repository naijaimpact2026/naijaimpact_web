'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, ShoppingCart, MapPin, Truck, Package, Lock } from 'lucide-react'
import { createOrder } from '@/lib/actions/marketplace'
import type { ProductWithSeller } from '@/lib/types'

declare global
{
    interface Window
    {
        PaystackPop: {
            setup(config: {
                key: string
                email: string
                amount: number
                currency: string
                ref: string
                metadata: Record<string, unknown>
                onClose: () => void
                callback: (response: { reference: string }) => void
            }): { openIframe: () => void }
        }
    }
}

interface Props
{
    open: boolean
    onOpenChange: (v: boolean) => void
    product: ProductWithSeller
    userEmail: string
    userId: string
}

function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

export default function BuyNowModal({ open, onOpenChange, product, userEmail, userId }: Props)
{
    const router = useRouter()
    const [qty, setQty] = useState(1)
    const [deliveryMethod, setDeliveryMethod] = useState(
        product.delivery_options.includes('delivery') ? 'delivery' : 'pickup'
    )
    const [address, setAddress] = useState('')
    const [loading, setLoading] = useState(false)

    const total = product.price * qty

    async function handlePay()
    {
        if (deliveryMethod === 'delivery' && !address.trim())
        {
            toast.error('Please enter a delivery address')
            return
        }

        setLoading(true)
        try
        {
            const { id: orderId, paystack_ref } = await createOrder({
                product_id: product.id,
                quantity: qty,
                delivery_method: deliveryMethod,
                delivery_address: address || undefined,
            })

            const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? ''

            const handler = window.PaystackPop.setup({
                key: paystackKey,
                email: userEmail,
                amount: total * 100, // kobo
                currency: 'NGN',
                ref: paystack_ref,
                metadata: {
                    type: 'marketplace_purchase',
                    userId,
                    referenceId: orderId,
                },
                onClose: () =>
                {
                    setLoading(false)
                    toast.info('Payment cancelled')
                },
                callback: () =>
                {
                    setLoading(false)
                    onOpenChange(false)
                    toast.success('Payment successful! Order placed.')
                    router.push('/app/market/orders')
                },
            })
            handler.openIframe()
        } catch (err)
        {
            setLoading(false)
            toast.error(err instanceof Error ? err.message : 'Failed to create order')
        }
    }

    if (!open) return null

    return (
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
                            <h2 className="font-black text-gray-900">Complete Purchase</h2>
                            <p className="text-xs text-gray-400">Secured by escrow</p>
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
                            {product.images[0]
                                ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{product.title}</p>
                            <p className="text-xs text-gray-500">by @{product.seller.username}</p>
                            <p className="text-sm font-black text-gray-900 mt-0.5">{fmt(product.price)} each</p>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-2 block">Quantity</label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQty(q => Math.max(1, q - 1))}
                                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                                −
                            </button>
                            <span className="w-10 text-center font-bold text-gray-900">{qty}</span>
                            <button
                                onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}
                                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                                +
                            </button>
                            <span className="text-xs text-gray-400 ml-2">{product.stock_quantity} available</span>
                        </div>
                    </div>

                    {/* Delivery method */}
                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-2 block">Delivery Method</label>
                        <div className="grid grid-cols-2 gap-2">
                            {product.delivery_options.includes('delivery') && (
                                <button
                                    onClick={() => setDeliveryMethod('delivery')}
                                    className={`flex items-center gap-2 py-3 px-4 rounded-2xl border-2 text-sm font-bold transition-all ${deliveryMethod === 'delivery' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                                    <Truck className="w-4 h-4" /> Delivery
                                </button>
                            )}
                            {product.delivery_options.includes('pickup') && (
                                <button
                                    onClick={() => setDeliveryMethod('pickup')}
                                    className={`flex items-center gap-2 py-3 px-4 rounded-2xl border-2 text-sm font-bold transition-all ${deliveryMethod === 'pickup' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                                    <Package className="w-4 h-4" /> Pickup
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Address (if delivery) */}
                    {deliveryMethod === 'delivery' && (
                        <div>
                            <label className="text-sm font-semibold text-gray-800 mb-2 block">
                                Delivery Address <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Enter your full delivery address"
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Escrow note */}
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-2xl">
                        <Lock className="h-5 w-5 text-blue-500 shrink-0" />
                        <p className="text-xs text-blue-700">
                            Payment is held in <strong>escrow</strong>. Funds are only released to the seller after you confirm delivery.
                        </p>
                    </div>

                    {/* Total + Pay */}
                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Subtotal ({qty} × {fmt(product.price)})</span>
                            <span className="font-bold text-gray-900">{fmt(total)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-4">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="text-xl font-black text-gray-900">{fmt(total)}</span>
                        </div>

                        <button
                            disabled={loading}
                            onClick={handlePay}
                            className="w-full py-4 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            {loading
                                ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Processing…</>
                                : <><ShoppingCart className="w-4 h-4" /> Pay {fmt(total)} Securely</>}
                        </button>
                    </div>
                </div>
            </div>

            <script src="https://js.paystack.co/v1/inline.js" />
        </div>
    )
}
