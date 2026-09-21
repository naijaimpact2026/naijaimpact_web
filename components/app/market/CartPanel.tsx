'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShoppingCart, Minus, Plus, Trash2, Package, Lock } from 'lucide-react'
import { useMarketCart } from './MarketCartProvider'
import { createEscrowOrder } from '@/lib/actions/marketplace'

// window.PaystackPop is declared ambiently in components/app/wallet/DepositModal.tsx
// (declare global — applies program-wide since that file is part of the build).

function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG')}`
}

interface Props
{
    userId: string
    userEmail: string
}

export default function CartPanel({ userId, userEmail }: Props)
{
    const router = useRouter()
    const { items, removeItem, updateQuantity, clear, subtotal, count } = useMarketCart()
    const [checkingOut, setCheckingOut] = useState(false)

    async function handleCheckout()
    {
        if (items.length === 0 || checkingOut) return
        setCheckingOut(true)

        const results = await Promise.allSettled(
            items.map((item) =>
                createEscrowOrder({
                    listing_id: item.listingId,
                    quantity: item.quantity,
                    delivery_option: 'pickup',
                }).then((r) => ({ ...r, item }))
            )
        )

        const succeeded = results
            .filter((r): r is PromiseFulfilledResult<{ order_id: string; item: typeof items[number] }> => r.status === 'fulfilled')
            .map((r) => r.value)
        const failedCount = results.length - succeeded.length

        if (succeeded.length === 0)
        {
            setCheckingOut(false)
            toast.error('Could not place your order. Please try again.')
            return
        }

        if (failedCount > 0)
        {
            toast.warning(`${failedCount} item${failedCount > 1 ? 's' : ''} in your cart could not be ordered and were skipped.`)
        }

        const orderIds = succeeded.map((s) => s.order_id)
        const total = succeeded.reduce((sum, s) => sum + s.item.price * s.item.quantity, 0)
        const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? ''

        const handler = window.PaystackPop.setup({
            key: paystackKey,
            email: userEmail,
            amount: Math.round(total * 100),
            ref: `mkt_cart_${Date.now()}`,
            metadata: {
                type: 'marketplace_purchase',
                userId,
                orderIds,
            },
            onSuccess: () =>
            {
                setCheckingOut(false)
                clear()
                toast.success('Payment successful! Your order is being processed.')
                router.push('/app/market/orders')
            },
            onClose: () =>
            {
                setCheckingOut(false)
                toast.info('Payment cancelled. Your order is saved and awaiting payment.')
                router.push('/app/market/orders')
            },
        })
        handler.openIframe()
    }

    return (
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    My Cart {count > 0 && <span className="text-muted-foreground font-normal">({count})</span>}
                </h2>
                {items.length > 0 && (
                    <button onClick={clear} className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors">
                        Clear
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="px-4 py-8 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Your cart is empty</p>
                </div>
            ) : (
                <>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                        {items.map((item) => (
                            <div key={item.listingId} className="flex items-center gap-2.5 px-4 py-3">
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                                    {item.image ? (
                                        <Image src={item.image} alt={item.title} fill unoptimized className="object-cover" sizes="44px" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-foreground">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{fmt(item.price)}</p>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <button
                                            onClick={() => updateQuantity(item.listingId, item.quantity - 1)}
                                            className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-foreground hover:bg-muted/70"
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-4 text-center text-xs font-semibold text-foreground">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.listingId, item.quantity + 1)}
                                            disabled={item.quantity >= item.stock}
                                            className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-foreground hover:bg-muted/70 disabled:opacity-40"
                                            aria-label="Increase quantity"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeItem(item.listingId)}
                                    aria-label="Remove item"
                                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="px-4 py-3 border-t border-border space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-bold text-foreground">{fmt(subtotal)}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={checkingOut}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                        >
                            {checkingOut
                                ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Processing…</>
                                : <>Proceed to Checkout <Lock className="h-3.5 w-3.5" /></>}
                        </button>
                    </div>
                </>
            )}
        </section>
    )
}
