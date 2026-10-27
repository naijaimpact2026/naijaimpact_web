import { redirect } from 'next/navigation'
import Script from 'next/script'
import { getCurrentUser } from '@/lib/supabase/auth'
import { fetchWallet } from '@/lib/actions/wallet'
import WalletPanel from '@/components/app/wallet/WalletPanel'
import { hasWalletPin } from '@/lib/wallet-pin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Wallet — HubNovo' }

export default async function WalletPage() {
    const { authUser, profile } = await getCurrentUser()

    if (!authUser) redirect('/auth/login')
    if (!profile) redirect('/auth/login')

    const [{ wallet, transactions }, hasPin] = await Promise.all([fetchWallet(20), hasWalletPin(profile.id)])

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
                hasPin={hasPin}
                displayName={profile.display_name ?? undefined}
                naijaPoints={(profile as any).naija_points ?? 0}
            />
        </>
    )
}
