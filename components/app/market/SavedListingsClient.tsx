'use client'

import Link from 'next/link'
import { Heart, Plus } from 'lucide-react'
import ListingCard from './ListingCard'
import type { NmListingDetail } from '@/lib/types'

export default function SavedListingsClient({ listings }: { listings: NmListingDetail[] })
{
    return (
        <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <div>
                <h1 className="font-display text-2xl font-black text-foreground">Saved Items</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {listings.length} item{listings.length !== 1 ? 's' : ''} you&apos;ve hearted
                </p>
            </div>

            {listings.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
                        <Heart className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-bold text-foreground">No saved items yet</p>
                    <p className="mb-5 mt-1 text-sm text-muted-foreground">
                        Tap the heart on any listing to save it here for later.
                    </p>
                    <Link href="/app/market"
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg transition-colors hover:bg-primary/90">
                        <Plus className="h-4 w-4" /> Browse Marketplace
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
                </div>
            )}
        </div>
    )
}
