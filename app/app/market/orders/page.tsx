import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { fetchMyOrders } from '@/lib/actions/marketplace'
import OrdersClient from '@/components/app/market/OrdersClient'
import PendingPaymentsCheck from '@/components/app/wallet/PendingPaymentsCheck'

export const dynamic = 'force-dynamic'

export default async function OrdersPage()
{
    const { authUser } = await getCurrentUser()
    if (!authUser) redirect('/auth/login')

    const [buyingOrders, sellingOrders] = await Promise.all([
        fetchMyOrders('buyer'),
        fetchMyOrders('seller'),
    ])

    return (
        <>
            {/* Confirms any order payment the webhook hasn't settled yet. */}
            <PendingPaymentsCheck />
            <OrdersClient buyingOrders={buyingOrders} sellingOrders={sellingOrders} />
        </>
    )
}
