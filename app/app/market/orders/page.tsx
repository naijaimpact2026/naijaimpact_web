import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchMyOrders } from '@/lib/actions/marketplace'
import OrdersClient from '@/components/app/market/OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage()
{
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const [buyingOrders, sellingOrders] = await Promise.all([
        fetchMyOrders('buyer'),
        fetchMyOrders('seller'),
    ])

    return <OrdersClient buyingOrders={buyingOrders} sellingOrders={sellingOrders} />
}
