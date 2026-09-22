'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Store, BadgeCheck } from 'lucide-react'
import { toggleSellerFollow } from '@/lib/actions/marketplace'
import type { NmTopSeller } from '@/lib/types'

function StoreRow({ seller }: { seller: NmTopSeller })
{
    const [following, setFollowing] = useState(seller.is_following)
    const [pending, setPending] = useState(false)

    async function handleFollowToggle()
    {
        if (pending) return
        setPending(true)
        const next = !following
        setFollowing(next)
        try
        {
            const result = await toggleSellerFollow(seller.id)
            setFollowing(result.following)
        }
        catch
        {
            setFollowing(!next)
            toast.error('Could not update follow status')
        }
        finally
        {
            setPending(false)
        }
    }

    const initials = (seller.business_name ?? 'Store')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="flex items-center gap-2.5 px-4 py-2.5">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-primary/10">
                {seller.logo_url ? (
                    <Image src={seller.logo_url} alt={seller.business_name ?? 'Store'} fill unoptimized className="object-cover" sizes="36px" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
                        {initials}
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                    <p className="truncate text-xs font-bold text-foreground">{seller.business_name ?? 'Unnamed Store'}</p>
                    {seller.is_verified && <BadgeCheck className="h-3 w-3 shrink-0 text-primary" />}
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                    {seller.dominant_category_name ?? 'General store'}
                </p>
            </div>
            <button
                onClick={handleFollowToggle}
                disabled={pending}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition-colors disabled:opacity-60 ${following ? 'bg-muted text-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
            >
                {following ? 'Following' : 'Follow'}
            </button>
        </div>
    )
}

export default function TopStoresRail({ sellers }: { sellers: NmTopSeller[] })
{
    if (sellers.length === 0) return null

    return (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                    <Store className="h-4 w-4 text-primary" /> Top Stores
                </h2>
                <Link href="/app/market/stores" className="text-xs font-medium text-primary hover:underline">
                    See All
                </Link>
            </div>
            <div className="divide-y divide-border">
                {sellers.map((seller) => (
                    <StoreRow key={seller.id} seller={seller} />
                ))}
            </div>
        </section>
    )
}
