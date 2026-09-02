// import { createClient } from '@/lib/supabase/server'
// import { redirect } from 'next/navigation'
// import { fetchListings, fetchMarketCategories } from '@/lib/actions/marketplace'
// import MarketHomeClient from '@/components/app/market/MarketHomeClient'

// export const dynamic = 'force-dynamic'

// export default async function MarketPage()
// {
//     const supabase = await createClient()
//     const { data: { user } } = await supabase.auth.getUser()
//     if (!user) redirect('/auth/login')

//     const { data: profile } = await supabase
//         .from('users')
//         .select('id, display_name, fullname')
//         .eq('auth_id', user.id)
//         .single()

//     const [{ listings, nextCursor }, categories] = await Promise.all([
//         fetchListings({}, 24),
//         fetchMarketCategories(),
//     ])

//     const displayName = profile?.display_name ?? profile?.fullname ?? 'User'

//     return (
//         <MarketHomeClient
//             initialListings={listings}
//             initialNextCursor={nextCursor}
//             categories={categories}
//             userId={user.id}
//             displayName={displayName}
//         />
//     )
// }
'use client'

import { Hourglass } from 'lucide-react'

export default function MarketPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-slate-950">
            <div className="flex min-h-screen items-center justify-center px-6">
                <div className="w-full max-w-lg text-center">

                    {/* Hourglass */}
                    <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                        <Hourglass
                            className="h-14 w-14 text-emerald-600 dark:text-emerald-400"
                            strokeWidth={1.5}
                        />
                    </div>

                    {/* Heading */}
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Market is Coming Soon
                    </h1>

                    {/* Description */}
                    <p className="mx-auto mt-5 max-w-md text-base leading-7 text-gray-500 dark:text-gray-400">
                        We&apos;re preparing something exciting.
                        Soon, you&apos;ll be able to discover,
                        buy, sell, and connect with businesses
                        and customers on NaijaImpact.
                    </p>

                    {/* Status */}
                    <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 dark:bg-slate-800 dark:text-gray-300">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                        Coming Soon
                    </div>

                </div>
            </div>
        </main>
    )
}