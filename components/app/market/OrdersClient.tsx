'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { Package, Truck, CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight, Check, Star } from 'lucide-react'
import { confirmDelivery, updateOrderStatus, raiseDispute } from '@/lib/actions/marketplace'
import type { NmOrder } from '@/lib/types'

interface Props
{
    buyingOrders: NmOrder[]
    sellingOrders: NmOrder[]
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    pending: { label: 'Pending', icon: Clock, cls: 'text-amber-600 bg-amber-50' },
    confirmed: { label: 'Confirmed', icon: CheckCircle2, cls: 'text-emerald bg-emerald/10' },
    packed: { label: 'Packed', icon: Package, cls: 'text-indigo-600 bg-indigo-50' },
    shipped: { label: 'Shipped', icon: Truck, cls: 'text-primary bg-primary/10' },
    delivered: { label: 'Delivered', icon: CheckCircle2, cls: 'text-emerald bg-emerald/10' },
    disputed: { label: 'Disputed', icon: AlertCircle, cls: 'text-rose-600 bg-rose-50' },
    returned: { label: 'Returned', icon: XCircle, cls: 'text-muted-foreground bg-muted' },
    refunded: { label: 'Refunded', icon: XCircle, cls: 'text-muted-foreground bg-muted' },
    cancelled: { label: 'Cancelled', icon: XCircle, cls: 'text-muted-foreground bg-muted' },
}

function fmt(n: number)
{
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function fmtDate(d: string)
{
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function OrderCard({ order, role }: { order: NmOrder; role: 'buyer' | 'seller' })
{
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)

    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
    const StatusIcon = cfg.icon

    // Get cover image from the listing's joined images
    const coverImg = (order.listing?.listing_images ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.image_url ?? null
    const listingTitle = order.listing?.title ?? 'Order'
    const sellerName = (order.seller_profile as any)?.business_name ?? 'Seller'
    const buyerName = (order.buyer_profile as any)?.username ?? 'Buyer'

    async function handle(action: string)
    {
        setLoading(action)
        try
        {
            if (action === 'confirm') await confirmDelivery(order.id)
            else if (action === 'shipped') await updateOrderStatus(order.id, 'shipped')
            else if (action === 'packed') await updateOrderStatus(order.id, 'packed')
            toast.success('Order updated!')
            router.refresh()
        } catch (err)
        {
            toast.error(err instanceof Error ? err.message : 'Failed to update order')
        } finally
        {
            setLoading(null)
        }
    }

    return (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b border-border px-5 pb-3 pt-4">
                {/* Product thumb */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
                    {coverImg
                        ? <img src={coverImg} alt="" className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center"><Package className="h-5 w-5 text-muted-foreground/40" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{listingTitle}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {role === 'buyer' ? `Seller: ${sellerName}` : `Buyer: @${buyerName}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{fmtDate(order.created_at)}</p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="font-black text-foreground">{fmt(order.total_amount)}</p>
                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>
                        <StatusIcon className="h-3 w-3" /> {cfg.label}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 px-5 py-3">
                {/* Seller: mark packed */}
                {role === 'seller' && order.status === 'confirmed' && (
                    <button disabled={!!loading}
                        onClick={() => handle('packed')}
                        className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">
                        {loading === 'packed' ? '…' : 'Mark Packed'}
                    </button>
                )}
                {/* Seller: mark shipped */}
                {role === 'seller' && order.status === 'packed' && (
                    <button disabled={!!loading}
                        onClick={() => handle('shipped')}
                        className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-secondary/90 disabled:opacity-60">
                        {loading === 'shipped' ? '…' : 'Mark Shipped'}
                    </button>
                )}

                {/* Buyer: confirm delivery */}
                {role === 'buyer' && order.status === 'delivered' && (
                    <button disabled={!!loading}
                        onClick={() => handle('confirm')}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2 text-xs font-bold text-emerald-foreground transition-colors hover:opacity-90 disabled:opacity-60">
                        {loading === 'confirm' ? '…' : <><Check className="h-3.5 w-3.5" /> Confirm Delivery</>}
                    </button>
                )}

                {/* Raise dispute */}
                {['delivered', 'shipped'].includes(order.status) && (
                    <button
                        onClick={() => toast.info('Dispute form coming soon. Contact support for now')}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors">
                        Dispute
                    </button>
                )}

                {/* Leave review (buyer, confirmed) */}
                {role === 'buyer' && order.status === 'confirmed' && (
                    <Link href={`/app/market/${order.listing_id}?review=1`}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-300 px-4 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-50">
                        <Star className="h-3.5 w-3.5" /> Leave Review
                    </Link>
                )}
            </div>
        </div>
    )
}

export default function OrdersClient({ buyingOrders, sellingOrders }: Props)
{
    const [tab, setTab] = useState<'buying' | 'selling'>('buying')

    return (
        <div className="w-full space-y-4 px-4 py-6 sm:px-6 lg:px-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl"
                style={{ background: 'linear-gradient(135deg,#102A43 0%,#0E6EDC 130%)' }}>
                <div className="px-6 py-7 sm:px-8">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-200">Hubnovo Marketplace</p>
                    <h1 className="font-display text-3xl font-black text-white">My Orders</h1>
                    <p className="mt-1 text-sm text-white/70">Track and manage all your transactions</p>
                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                        <div>
                            <span className="text-3xl font-black text-white">{buyingOrders.length}</span>
                            <span className="block text-sm text-white/60">Purchases</span>
                        </div>
                        <div>
                            <span className="text-3xl font-black text-white">{sellingOrders.length}</span>
                            <span className="block text-sm text-white/60">Sales</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tab selector */}
            <div className="flex gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
                {(['buying', 'selling'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-bold capitalize transition-all ${tab === t
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'}`}>
                        {t === 'buying' ? `Buying (${buyingOrders.length})` : `Selling (${sellingOrders.length})`}
                    </button>
                ))}
            </div>

            {/* Orders list */}
            <div className="space-y-3">
                {(tab === 'buying' ? buyingOrders : sellingOrders).length === 0 ? (
                    <div className="rounded-3xl border border-border bg-card py-16 text-center">
                        <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                        <p className="font-semibold text-muted-foreground">
                            {tab === 'buying' ? "You haven't made any purchases yet" : "No sales yet"}
                        </p>
                        <Link href="/app/market"
                            className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                            Browse Marketplace <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    (tab === 'buying' ? buyingOrders : sellingOrders).map(order => (
                        <OrderCard key={order.id} order={order} role={tab === 'buying' ? 'buyer' : 'seller'} />
                    ))
                )}
            </div>
        </div>
    )
}
