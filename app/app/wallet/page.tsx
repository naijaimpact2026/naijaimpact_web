import { redirect } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/server'
import { fetchWallet } from '@/lib/actions/wallet'
import WalletPanel from '@/components/app/wallet/WalletPanel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Wallet — NaijaImpact' }

export default async function WalletPage()
{
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users')
        .select('id, wallet_pin, display_name, naija_points')
        .eq('auth_id', authUser.id)
        .single()

    if (!profile) redirect('/auth/login')

    const { wallet, transactions } = await fetchWallet(20)

    return (
        <>
            <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

            {/* No container — WalletPanel manages its own layout */}
            <WalletPanel
                wallet={wallet}
                transactions={transactions}
                userEmail={authUser.email ?? ''}
                hasPin={Boolean(profile.wallet_pin)}
                displayName={profile.display_name ?? undefined}
                naijaPoints={profile.naija_points ?? 0}
            />
        </>
    )
}
