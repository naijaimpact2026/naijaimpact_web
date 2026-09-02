import { redirect } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/server'
import { fetchWallet } from '@/lib/actions/wallet'
import WalletPanel from '@/components/app/wallet/WalletPanel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Wallet — NaijaImpact' }

export default async function WalletPage() {
    console.log('🔥🔥🔥 WALLET PAGE IS RENDERING 🔥🔥🔥')

    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    console.log('👤 AUTH USER:', authUser?.id)

    if (!authUser) redirect('/auth/login')

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, wallet_pin, display_name, naija_points')
        .eq('auth_id', authUser.id)
        .single()

    console.log('👤 PROFILE:', profile)
    console.log('❌ PROFILE ERROR:', profileError)

    if (!profile) redirect('/auth/login')

    const { wallet, transactions } = await fetchWallet(20)

    console.log('💰 WALLET:', wallet)
    console.log('💳 TRANSACTIONS:', transactions)

    console.log('🔥🔥🔥 ABOUT TO RENDER WALLET PANEL 🔥🔥🔥')

    return (
        <>
            <Script
                src="https://js.paystack.co/v1/inline.js"
                strategy="lazyOnload"
            />

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