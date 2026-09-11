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
    confirmed: { label: 'Confirmed', icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50' },
    packed: { label: 'Packed', icon: Package, cls: 'text-indigo-600 bg-indigo-50' },
    shipped: { label: 'Shipped', icon: Truck, cls: 'text-purple-600 bg-purple-50' },
    delivered: { label: 'Delivered', icon: CheckCircle2, cls: 'text-green-600 bg-green-50' },
    disputed: { label: 'Disputed', icon: AlertCircle, cls: 'text-rose-600 bg-rose-50' },
    returned: { label: 'Returned', icon: XCircle, cls: 'text-gray-600 bg-gray-50' },
    refunded: { label: 'Refunded', icon: XCircle, cls: 'text-gray-600 bg-gray-50' },
    cancelled: { label: 'Cancelled', icon: XCircle, cls: 'text-gray-600 bg-gray-50' },
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

    // Get cover image from joined listing_images
    const coverImg = (order.listing_images ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.image_url ?? null
    const listingTitle = (order.listing as any)?.title ?? 'Order'
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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-50">
                {/* Product thumb */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                    {coverImg
                        ? <img src={coverImg} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{listingTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {role === 'buyer' ? `Seller: ${sellerName}` : `Buyer: @${buyerName}`}
                    </p>
                    <p className="text-xs text-gray-400">{fmtDate(order.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="font-black text-gray-900">{fmt(order.total_amount)}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${cfg.cls}`}>
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 flex gap-2 flex-wrap">
                {/* Seller: mark packed */}
                {role === 'seller' && order.status === 'confirmed' && (
                    <button disabled={!!loading}
                        onClick={() => handle('packed')}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                        {loading === 'packed' ? '…' : 'Mark Packed'}
                    </button>
                )}
                {/* Seller: mark shipped */}
                {role === 'seller' && order.status === 'packed' && (
                    <button disabled={!!loading}
                        onClick={() => handle('shipped')}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 transition-colors">
                        {loading === 'shipped' ? '…' : 'Mark Shipped'}
                    </button>
                )}

                {/* Buyer: confirm delivery */}
                {role === 'buyer' && order.status === 'delivered' && (
                    <button disabled={!!loading}
                        onClick={() => handle('confirm')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors">
                        {loading === 'confirm' ? '…' : <><Check className="h-3.5 w-3.5" /> Confirm Delivery</>}
                    </button>
                )}

                {/* Raise dispute */}
                {['delivered', 'shipped'].includes(order.status) && (
                    <button
                        onClick={() => toast.info('Dispute form coming — contact support for now')}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors">
                        Dispute
                    </button>
                )}

                {/* Leave review (buyer, confirmed) */}
                {role === 'buyer' && order.status === 'confirmed' && (
                    <Link href={`/app/market/${order.product_id}?review=1`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition-colors">
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
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Hero */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.18),transparent 70%)' }} />
                <div className="relative z-10 px-5 pt-7 pb-8 max-w-4xl mx-auto">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">NaijaMarket</p>
                    <h1 className="text-3xl font-black text-white">My Orders</h1>
                    <p className="text-sm text-green-300/60 mt-1">Track and manage all your transactions</p>
                    <div className="grid grid-cols-2 gap-3 pt-5 mt-5"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div>
                            <span className="text-3xl font-black text-white">{buyingOrders.length}</span>
                            <span className="text-sm text-green-400 block">Purchases</span>
                        </div>
                        <div>
                            <span className="text-3xl font-black text-white">{sellingOrders.length}</span>
                            <span className="text-sm text-green-400 block">Sales</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
                {/* Tab selector */}
                <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm">
                    {(['buying', 'selling'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${tab === t
                                ? 'text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'}`}
                            style={tab === t ? { background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' } : {}}>
                            {t === 'buying' ? `Buying (${buyingOrders.length})` : `Selling (${sellingOrders.length})`}
                        </button>
                    ))}
                </div>

                {/* Orders list */}
                <div className="space-y-3">
                    {(tab === 'buying' ? buyingOrders : sellingOrders).length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center">
                            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="font-semibold text-gray-600">
                                {tab === 'buying' ? "You haven't made any purchases yet" : "No sales yet"}
                            </p>
                            <Link href="/app/market"
                                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white mx-auto transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                Browse Marketplace <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        (tab === 'buying' ? buyingOrders : sellingOrders).map(order => (
                            <OrderCard key={order.id} order={order} role={tab === 'buying' ? 'buyer' : 'seller'} />
                        ))
                    )}
                </div>

                <div className="h-4" />
            </div>
        </div>
    )
}
