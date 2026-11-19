import Link from 'next/link'
import { ArrowRight, KeyRound, Wallet as WalletIcon } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrCreateWallet } from '@/lib/wallet/service'
import { hasWalletPin } from '@/lib/wallet-pin'

/*
 * Marketplace Competition: the seller's Hubnovo Wallet at a glance.
 * Sales payouts and prize grants land in the wallet, so competitors should
 * see it (and have a PIN set to withdraw) without leaving the competition.
 * Server component; renders nothing if the wallet can't be loaded.
 */
export default async function SellerWalletCard({ userId, themeColor }: { userId: string; themeColor: string })
{
    let balance: number
    let hasPin: boolean
    try
    {
        const [wallet, pin] = await Promise.all([
            getOrCreateWallet(createServiceClient(), userId),
            hasWalletPin(userId),
        ])
        balance = wallet.balance
        hasPin = pin
    } catch
    {
        return null
    }

    return (
        <section className="mt-4 rounded-2xl border border-border bg-muted/40 p-3.5">
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${themeColor}22`, color: themeColor }}>
                    <WalletIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Seller wallet</p>
                    <p className="text-lg font-extrabold tabular-nums text-foreground">
                        ₦{balance.toLocaleString('en-NG', { maximumFractionDigits: 2 })}
                    </p>
                </div>
                <Link
                    href="/app/wallet"
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-bold text-white shadow-md hover:opacity-90"
                    style={{ backgroundColor: themeColor }}
                >
                    Open wallet <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
                Your sales earnings and any prize money are paid here.
            </p>
            {!hasPin && (
                <Link href="/app/wallet" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:underline dark:text-amber-400">
                    <KeyRound className="h-3 w-3" /> Set a wallet PIN so you can withdraw
                </Link>
            )}
        </section>
    )
}
